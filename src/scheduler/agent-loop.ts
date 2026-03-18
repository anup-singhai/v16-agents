import { AgentConfig } from '../types';
import { shouldRunAt } from './cron';
import { CommandRouter } from '../core/command-router';
import { log } from '../core/logger';

export class AgentLoop {
  private router: CommandRouter;
  private interval: NodeJS.Timeout | null = null;
  private running: Set<string> = new Set();

  constructor(router: CommandRouter) {
    this.router = router;
  }

  start(agents: AgentConfig[]): void {
    // Check every minute
    this.interval = setInterval(() => this.tick(agents), 60_000);
    // Also check immediately
    this.tick(agents);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async tick(agents: AgentConfig[]): Promise<void> {
    const now = new Date();

    for (const agent of agents) {
      if (!agent.schedule) continue;
      if (this.running.has(agent.id)) continue;

      try {
        if (shouldRunAt(agent.schedule, now)) {
          this.running.add(agent.id);
          log.dim(`Scheduler: running agent "${agent.name}" (${agent.id})`);

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
      } catch (err: any) {
        log.warn(`Scheduler error for "${agent.name}": ${err.message}`);
        this.running.delete(agent.id);
      }
    }
  }
}
