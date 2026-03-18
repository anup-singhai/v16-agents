import chalk from 'chalk';
import ora, { Ora } from 'ora';

const PREFIX = chalk.gray('[v16]');

export const log = {
  info(msg: string): void {
    console.log(`${PREFIX} ${msg}`);
  },

  success(msg: string): void {
    console.log(`${PREFIX} ${chalk.green('✓')} ${msg}`);
  },

  warn(msg: string): void {
    console.log(`${PREFIX} ${chalk.yellow('⚠')} ${msg}`);
  },

  error(msg: string): void {
    console.log(`${PREFIX} ${chalk.red('✗')} ${msg}`);
  },

  dim(msg: string): void {
    console.log(`${PREFIX} ${chalk.dim(msg)}`);
  },

  tool(name: string, version?: string): void {
    const ver = version ? chalk.dim(` v${version}`) : '';
    console.log(`${PREFIX}   ${chalk.cyan(name)}${ver}`);
  },

  agent(name: string, status: string): void {
    const statusColor = status === 'running' ? chalk.green(status) : chalk.dim(status);
    console.log(`${PREFIX}   ${chalk.magenta(name)} ${statusColor}`);
  },

  spinner(text: string): Ora {
    return ora({ text: `${text}`, prefixText: chalk.gray('[v16]') }).start();
  },

  header(text: string): void {
    console.log();
    console.log(`${PREFIX} ${chalk.bold.white(text)}`);
    console.log(`${PREFIX} ${chalk.dim('─'.repeat(text.length))}`);
  },
};
