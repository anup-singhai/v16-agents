import { log } from '../core/logger';
import { ToolRunner } from '../handlers/tool-runner';
import chalk from 'chalk';

export async function runCommand(
  tool: string,
  prompt: string,
  options: { cwd?: string }
): Promise<void> {
  log.info(`Running ${chalk.cyan(tool)} with prompt...`);

  const runner = new ToolRunner();

  try {
    const result = await runner.run(
      {
        tool,
        prompt,
        cwd: options.cwd,
      },
      (type, data) => {
        // Stream output to console
        if (type === 'stdout') {
          process.stdout.write(data);
        } else {
          process.stderr.write(chalk.red(data));
        }
      }
    );

    console.log();
    if (result.success) {
      log.success(`Completed in ${(result.duration / 1000).toFixed(1)}s (exit code: ${result.exitCode})`);
    } else {
      log.error(`Failed with exit code ${result.exitCode} (${(result.duration / 1000).toFixed(1)}s)`);
      process.exit(1);
    }
  } catch (err: any) {
    log.error(err.message);
    process.exit(1);
  }
}
