import { log } from '../core/logger';
import { setToken, getToken, getConfigDir } from '../core/config';
import chalk from 'chalk';

export function loginCommand(options: { token?: string }): void {
  if (options.token) {
    setToken(options.token);
    log.success('Token saved successfully');
    return;
  }

  const existing = getToken();
  if (existing) {
    log.info(`Token configured: ${chalk.dim(existing.slice(0, 8) + '...')}`);
    log.dim(`Config: ${getConfigDir()}/config.json`);
    return;
  }

  log.header('V16 Authentication Setup');
  log.info('To get your auth token:');
  log.dim('  1. Go to https://v16.ai/dashboard');
  log.dim('  2. Open Settings → API Token');
  log.dim('  3. Copy your token');
  log.dim('');
  log.info('Then run:');
  log.dim(`  ${chalk.cyan('v16 login --token <your-token>')}`);
}
