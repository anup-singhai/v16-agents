#!/usr/bin/env node

import { Command } from 'commander';
import { connectCommand } from './cli/connect';
import { statusCommand } from './cli/status';
import { toolsCommand } from './cli/tools';
import { runCommand } from './cli/run';
import { agentsCommand } from './cli/agents';
import { loginCommand } from './cli/login';

const program = new Command();

program
  .name('v16')
  .description('V16 Local Agent — Autonomous AI agent orchestration')
  .version('0.1.0');

program
  .command('connect')
  .description('Connect to V16 backend and start listening for commands')
  .option('--dev', 'Connect to local backend (localhost:3001)')
  .option('--server <url>', 'Custom server URL')
  .action(connectCommand);

program
  .command('status')
  .description('Show connection and agent status')
  .action(statusCommand);

program
  .command('tools')
  .description('List installed CLI tools')
  .action(toolsCommand);

program
  .command('run <tool> <prompt>')
  .description('Run a CLI tool locally with a prompt')
  .option('--cwd <dir>', 'Working directory')
  .action(runCommand);

program
  .command('agents')
  .description('Manage local agents')
  .argument('[action]', 'list, create, or remove', 'list')
  .option('--name <name>', 'Agent name (for create)')
  .option('--tool <tool>', 'CLI tool to use (for create)')
  .option('--prompt <prompt>', 'Agent prompt (for create)')
  .option('--schedule <cron>', 'Cron schedule (for create)')
  .option('--id <id>', 'Agent ID (for remove)')
  .action(agentsCommand);

program
  .command('login')
  .description('Set up authentication')
  .option('--token <token>', 'Auth token')
  .action(loginCommand);

program.parse();
