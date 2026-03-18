import { log } from '../core/logger';
import { getAgents, addAgent, removeAgent } from '../core/config';
import { AgentConfig } from '../types';
import chalk from 'chalk';
import { randomBytes } from 'crypto';

interface AgentOptions {
  name?: string;
  tool?: string;
  prompt?: string;
  schedule?: string;
  id?: string;
}

export function agentsCommand(action: string = 'list', options: AgentOptions): void {
  switch (action) {
    case 'list':
      return listAgents();
    case 'create':
      return createAgent(options);
    case 'remove':
      return removeAgentCmd(options);
    default:
      log.error(`Unknown action: ${action}. Use list, create, or remove.`);
  }
}

function listAgents(): void {
  const agents = getAgents();

  log.header('Registered Agents');

  if (agents.length === 0) {
    log.dim('No agents registered. Create one with:');
    log.dim(`  ${chalk.cyan('v16 agents create --name "My Agent" --tool claude --prompt "..."')}`);
    return;
  }

  for (const agent of agents) {
    log.agent(agent.name, agent.tool);
    log.dim(`    ID: ${agent.id}`);
    log.dim(`    Prompt: ${agent.prompt.slice(0, 60)}${agent.prompt.length > 60 ? '...' : ''}`);
    if (agent.schedule) {
      log.dim(`    Schedule: ${agent.schedule}`);
    }
    if (agent.cwd) {
      log.dim(`    CWD: ${agent.cwd}`);
    }
  }
}

function createAgent(options: AgentOptions): void {
  if (!options.name || !options.tool || !options.prompt) {
    log.error('Required: --name, --tool, and --prompt');
    log.dim('Example:');
    log.dim(`  ${chalk.cyan('v16 agents create --name "Code Review" --tool claude --prompt "Review open PRs" --schedule "0 9 * * *"')}`);
    return;
  }

  const agent: AgentConfig = {
    id: randomBytes(8).toString('hex'),
    name: options.name,
    description: '',
    tool: options.tool,
    prompt: options.prompt,
    schedule: options.schedule,
    createdAt: Date.now(),
  };

  addAgent(agent);
  log.success(`Agent "${agent.name}" created (${agent.id})`);

  if (agent.schedule) {
    log.dim(`  Scheduled: ${agent.schedule}`);
  }
}

function removeAgentCmd(options: AgentOptions): void {
  if (!options.id) {
    log.error('Required: --id <agent-id>');
    return;
  }

  if (removeAgent(options.id)) {
    log.success(`Agent ${options.id} removed`);
  } else {
    log.error(`Agent ${options.id} not found`);
  }
}
