import { AgentConfig } from '../types';
import { shouldRunAt } from './cron';
import { CommandRouter } from '../core/command-router';
import { log } from '../core/logger';
import {
  fetchAgents,
  fetchPendingTasks,
  reportTaskCompletion,
  RemoteAgent,
} from '../core/api-client';
import { getToken } from '../core/config';

export class AgentLoop {
  private router: CommandRouter;
  private interval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private running: Set<string> = new Set();
  private remoteAgents: RemoteAgent[] = [];
  private localAgents: AgentConfig[] = [];

  constructor(router: CommandRouter) {
    this.router = router;
  }

  start(localAgents: AgentConfig[]): void {
    this.localAgents = localAgents;

    // Check every minute
    this.interval = setInterval(() => this.tick(), 60_000);
    // Refresh agents from backend every 5 minutes
    this.refreshInterval = setInterval(() => this.refreshRemoteAgents(), 5 * 60_000);

    // Initial load
    this.refreshRemoteAgents().then(() => this.tick());
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async refreshRemoteAgents(): Promise<void> {
    if (!getToken()) return;

    try {
      this.remoteAgents = await fetchAgents();
      const scheduled = this.remoteAgents.filter(a => a.schedule && a.status === 'active');
      if (scheduled.length > 0) {
        log.dim(`Scheduler: ${scheduled.length} remote agent(s) with schedules`);
      }
    } catch (err: any) {
      log.warn(`Scheduler: failed to refresh agents: ${err.message}`);
    }
  }

  private async tick(): Promise<void> {
    const now = new Date();

    // Run local agents (from config.json)
    for (const agent of this.localAgents) {
      if (!agent.schedule) continue;
      if (this.running.has(agent.id)) continue;

      try {
        if (shouldRunAt(agent.schedule, now)) {
          await this.runLocalAgent(agent);
        }
      } catch (err: any) {
        log.warn(`Scheduler error for "${agent.name}": ${err.message}`);
        this.running.delete(agent.id);
      }
    }

    // Run remote agents (from backend API)
    for (const agent of this.remoteAgents) {
      if (!agent.schedule || !agent.cliTool || agent.status !== 'active') continue;
      if (this.running.has(agent.agentId)) continue;

      try {
        if (shouldRunAt(agent.schedule, now)) {
          await this.runRemoteAgent(agent);
        }
      } catch (err: any) {
        log.warn(`Scheduler error for "${agent.agentName}": ${err.message}`);
        this.running.delete(agent.agentId);
      }
    }
  }

  private async runLocalAgent(agent: AgentConfig): Promise<void> {
    this.running.add(agent.id);
    log.dim(`Scheduler: running local agent "${agent.name}" (${agent.id})`);

    try {
      const result = await this.router.route({
        id: `sched-${agent.id}-${Date.now()}`,
        type: 'agent:run',
        payload: { agentId: agent.id },
      });

      if (result.success) {
        log.dim(`Scheduler: agent "${agent.name}" completed (${result.duration}ms)`);
      } else {
        log.warn(`Scheduler: agent "${agent.name}" failed: ${result.error}`);
      }
    } finally {
      this.running.delete(agent.id);
    }
  }

  private async runRemoteAgent(agent: RemoteAgent): Promise<void> {
    this.running.add(agent.agentId);
    log.dim(`Scheduler: running "${agent.agentName}" (${agent.cliTool})`);

    try {
      // Check for pending tasks to pick up, or run with the agent's systemPrompt
      const pendingTasks = await fetchPendingTasks(agent.agentId);
      const taskId = pendingTasks.length > 0 ? pendingTasks[0].taskId : undefined;

      const prompt = agent.systemPrompt || `Execute scheduled task for: ${agent.agentName}`;

      const result = await this.router.route({
        id: `sched-remote-${agent.agentId}-${Date.now()}`,
        type: 'tool:run',
        payload: {
          tool: agent.cliTool,
          prompt,
          cwd: agent.workingDirectory,
          env: agent.envVars,
        },
      });

      // Report completion to backend (triggers Telegram notification)
      if (taskId) {
        await reportTaskCompletion(agent.agentId, taskId, {
          success: result.success ?? false,
          stdout: result.stdout,
          stderr: result.stderr,
          error: result.error,
        });
      }

      if (result.success) {
        log.dim(`Scheduler: "${agent.agentName}" completed (${result.duration}ms)`);
      } else {
        log.warn(`Scheduler: "${agent.agentName}" failed: ${result.error}`);
      }
    } finally {
      this.running.delete(agent.agentId);
    }
  }
}
