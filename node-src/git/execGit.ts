import { createInterface } from 'node:readline';

import { execaCommand } from 'execa';

import { Context } from '../types';
import gitNoCommits from '../ui/messages/errors/gitNoCommits';
import gitNotInitialized from '../ui/messages/errors/gitNotInitialized';
import gitNotInstalled from '../ui/messages/errors/gitNotInstalled';

const defaultOptions: Parameters<typeof execaCommand>[1] = {
  env: { LANG: 'C', LC_ALL: 'C' }, // make sure we're speaking English
  timeout: 20_000, // 20 seconds
  all: true, // interleave stdout and stderr
  shell: true, // we'll deal with escaping ourselves (for now)
};

/**
 * Execute a Git command in the local terminal.
 *
 * @param context Standard context object.
 * @param context.log Standard context logger.
 * @param command The command to execute.
 * @param options Execa options
 *
 * @returns The result of the command from the terminal.
 */
export async function execGitCommand(
  { log }: Pick<Context, 'log'>,
  command: string,
  options?: Parameters<typeof execaCommand>[1]
) {
  try {
    log.debug(`execGitCommand: ${command}`);
    const { all } = await execaCommand(command, { ...defaultOptions, ...options });

    if (all === undefined) {
      throw new Error(`Unexpected missing git command output for command: '${command}'`);
    }

    const result = all.toString();
    log.debug(`execGitCommand result: '${result}'`);
    return result;
  } catch (error) {
    const { message } = error;

    log.debug(`execGitCommand error: ${message}`);

    if (message.includes('not a git repository')) {
      throw new Error(gitNotInitialized({ command }));
    }

    if (message.includes('git not found')) {
      throw new Error(gitNotInstalled({ command }));
    }

    if (message.includes('does not have any commits yet')) {
      throw new Error(gitNoCommits({ command }));
    }

    throw error;
  }
}

/**
 * Execute a Git command in the local terminal and just get the first line.
 *
 * @param context Standard context object.
 * @param context.log Standard context logger.
 * @param command The command to execute.
 * @param options Execa options
 *
 * @returns The first line of the command from the terminal.
 */
export async function execGitCommandOneLine(
  { log }: Pick<Context, 'log'>,
  command: string,
  options?: Parameters<typeof execaCommand>[1]
) {
  log.debug(`execGitCommandOneLine: ${command}`);
  const process = execaCommand(command, { ...defaultOptions, buffer: false, ...options });

  return Promise.race([
    // This promise will resolve only if there is an error or it times out
    (async () => {
      await process;

      throw new Error(`Unexpected missing git command output for command: '${command}'`);
    })(),
    // We expect this promise to resolve first
    new Promise<string>((resolve, reject) => {
      if (!process.stdout) {
        return reject(new Error('Unexpected missing stdout'));
      }

      const rl = createInterface(process.stdout);
      rl.once('line', (line) => {
        rl.close();
        process.kill();

        resolve(line);
      });
    }),
  ]);
}

/**
 * Execute a Git command in the local terminal and count the lines in the result
 *
 * @param context Standard context object.
 * @param context.log Standard context logger.
 * @param command The command to execute.
 * @param options Execa options
 *
 * @returns The number of lines the command returned
 */
export async function execGitCommandCountLines(
  { log }: Pick<Context, 'log'>,
  command: string,
  options?: Parameters<typeof execaCommand>[1]
) {
  log.debug(`execGitCommandCountLines: ${command}`);
  const process = execaCommand(command, { ...defaultOptions, buffer: false, ...options });
  if (!process.stdout) {
    throw new Error('Unexpected missing stdout');
  }

  let lineCount = 0;
  const rl = createInterface(process.stdout);
  rl.on('line', () => {
    lineCount += 1;
  });

  // If the process errors, this will throw
  await process;

  return lineCount;
}
