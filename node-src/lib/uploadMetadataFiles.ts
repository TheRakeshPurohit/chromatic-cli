import { stat, writeFileSync } from 'fs';
import path from 'path';
import { withFile } from 'tmp-promise';

import { main as trimStatsFile } from '../../bin-src/trimStatsFile';
import { Context, FileDesc } from '../types';
import metadataHtml from '../ui/html/metadata.html';
import uploadingMetadata from '../ui/messages/info/uploadingMetadata';
import { findStorybookConfigFile } from './getStorybookMetadata';
import { uploadMetadata } from './upload';

const fileSize = (path: string): Promise<number> =>
  new Promise((resolve) => stat(path, (err, stats) => resolve(err ? 0 : stats.size)));

/**
 * Upload metadata files to Chromatic for debugging issues with Chromatic support.
 *
 * @param ctx The context set when executing the CLI.
 *
 * @returns A promise that resolves when all metadata files are uploaded.
 */
export async function uploadMetadataFiles(ctx: Context) {
  if (!ctx.announcedBuild) {
    ctx.log.warn('No build announced, skipping metadata upload.');
    return;
  }

  return withPausedLog(ctx, async () => {
    const metadataFiles = [
      ctx.options.logFile,
      ctx.options.diagnosticsFile,
      ctx.options.storybookLogFile,
      await findStorybookConfigFile(ctx, /^main\.[jt]sx?$/).catch(() => undefined),
      await findStorybookConfigFile(ctx, /^preview\.[jt]sx?$/).catch(() => undefined),
      ctx.fileInfo?.statsPath && (await trimStatsFile([ctx.fileInfo.statsPath])),
    ].filter((m): m is string => !!m);

    const unfilteredFiles = await Promise.all(
      metadataFiles.map(async (localPath) => {
        const contentLength = await fileSize(localPath);
        const targetPath = `.chromatic/${path.basename(localPath)}`;
        return contentLength && { contentLength, localPath, targetPath };
      })
    );
    const files = unfilteredFiles
      .filter((f): f is FileDesc => !!f)
      .sort((a, b) => a.targetPath.localeCompare(b.targetPath, 'en', { numeric: true }));

    if (files.length === 0) {
      ctx.log.warn('No metadata files found, skipping metadata upload.');
      return;
    }

    await withFile(async ({ path }) => {
      const html = metadataHtml(ctx, files);
      writeFileSync(path, html);
      files.push({
        contentLength: html.length,
        localPath: path,
        targetPath: '.chromatic/index.html',
      });

      const directoryUrl = `${ctx.build.storybookUrl}.chromatic/`;
      ctx.log.info(uploadingMetadata(directoryUrl, files));

      await uploadMetadata(ctx, files);
    });
  });
}

/**
 * Pauses the log file stream during a callback execution, ensuring it's always resumed.
 * This prevents writes to the log file during operations that require a stable file size,
 * such as uploading to S3 with file size limits.
 *
 * @param ctx The context set when executing the CLI.
 * @param callback The async function to execute while the log is paused.
 *
 * @returns A promise that resolves with the callback's return value.
 */
async function withPausedLog<T>(ctx: Context, callback: () => Promise<T>): Promise<T> {
  ctx.log.pause();

  try {
    return await callback();
  } finally {
    ctx.log.resume();
  }
}
