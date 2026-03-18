import { log } from '../core/logger';
import { discoverTools } from '../tools/discovery';
import chalk from 'chalk';

export async function toolsCommand(): Promise<void> {
  log.header('Installed CLI Tools');

  const spinner = log.spinner('Detecting tools...');
  const tools = await discoverTools();
  spinner.stop();

  const available = tools.filter(t => t.available);
  const unavailable = tools.filter(t => !t.available);

  if (available.length > 0) {
    log.info(`Found ${available.length} tool(s):`);
    for (const tool of available) {
      log.tool(tool.name, tool.version);
      log.dim(`    command: ${tool.command}`);
    }
  } else {
    log.warn('No CLI tools detected');
  }

  if (unavailable.length > 0) {
    console.log();
    log.dim('Not installed:');
    for (const tool of unavailable) {
      log.dim(`  ${chalk.strikethrough(tool.name)} (${tool.command})`);
    }
  }
}
