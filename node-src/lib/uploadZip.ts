import retry from 'async-retry';
import { filesize } from 'filesize';
import { FormData } from 'formdata-node';

import { Context, TargetInfo } from '../types';
import { FileReaderBlob } from './fileReaderBlob';

/**
 * Upload a zip to Chromatic instead of individual files.
 *
 * @param ctx The context set when executing the CLI.
 * @param target The zip information to upload.
 * @param onProgress A callback to report progress on the upload.
 *
 * @returns A promise that resolves when the zip is uploaded.
 */
export async function uploadZip(
  ctx: Context,
  target: TargetInfo & { contentLength: number; localPath: string },
  onProgress: (progress: number) => void
) {
  const { experimental_abortSignal: signal } = ctx.options;
  const { contentLength, filePath, formAction, formFields, localPath } = target;
  let totalProgress = 0;

  ctx.log.debug(`Uploading ${filePath} (${filesize(contentLength)})`);

  return retry(
    async (bail) => {
      if (signal?.aborted) {
        return bail(signal.reason || new Error('Aborted'));
      }

      const blob = new FileReaderBlob(localPath, contentLength, (delta) => {
        totalProgress += delta;
        onProgress?.(totalProgress);
      });

      const formData = new FormData();
      for (const [k, v] of Object.entries(formFields)) {
        formData.append(k, v);
      }
      formData.append('file', blob);

      const result = await ctx.http.fetch(
        formAction,
        { body: formData, method: 'POST', signal },
        { retries: 0 } // already retrying the whole operation
      );

      if (!result.ok) {
        ctx.log.debug(`Uploading ${localPath} failed: %O`, result);
        throw new Error(localPath);
      }
      ctx.log.debug(`Uploaded ${filePath} (${filesize(contentLength)})`);
    },
    {
      retries: ctx.env.CHROMATIC_RETRIES,
      onRetry: (err: Error) => {
        totalProgress = 0;
        ctx.log.debug('Retrying upload for %s, %O', localPath, err);
        onProgress(totalProgress);
      },
    }
  );
}
