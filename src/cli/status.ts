import { log } from '../core/logger';
import { loadConfig, getConfigDir } from '../core/config';
import { discoverTools } from '../tools/discovery';
import chalk from 'chalk';

export async function statusCommand(): Promise<void> {
  const config = loadConfig();

  log.header('V16 Agent Status');

  // Connection
  log.info(`Server: ${chalk.cyan(config.serverUrl)}`);
  log.info(`Token: ${config.token ? chalk.green('configured') : chalk.red('not set')}`);
  log.info(`Config: ${chalk.dim(getConfigDir())}`);

  // Tools
  console.log();
  log.info('Installed tools:');
  const tools = await discoverTools();
  const available = tools.filter(t => t.available);
  if (available.length > 0) {
    for (const tool of available) {
      log.tool(tool.name, tool.version);
    }
  } else {
    log.dim('  No CLI tools detected');
  }

  // Agents
  console.log();
  log.info(`Registered agents: ${config.agents.length}`);
  for (const agent of config.agents) {
    const schedule = agent.schedule ? chalk.dim(` (${agent.schedule})`) : '';
    log.agent(agent.name, `${agent.tool}${schedule}`);
  }
}
