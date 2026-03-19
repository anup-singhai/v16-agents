import { log } from '../core/logger';
import { loadConfig } from '../core/config';
import { CommandRouter } from '../core/command-router';
import { HttpServer } from '../core/http-server';
import { AgentLoop } from '../scheduler/agent-loop';

export async function connectCommand(options: { port?: string }): Promise<void> {
  log.header('V16 Agent');

  const router = new CommandRouter();

  // Start local HTTP server
  const httpPort = options.port ? parseInt(options.port, 10) : undefined;
  const httpServer = new HttpServer(router, httpPort);
  try {
    await httpServer.start();
  } catch (err: any) {
    log.error(`Failed to start HTTP server: ${err.message}`);
    process.exit(1);
  }

  // Start agent scheduler for registered agents with schedules
  const config = loadConfig();
  const scheduledAgents = config.agents.filter(a => a.schedule);
  if (scheduledAgents.length > 0) {
    const loop = new AgentLoop(router);
    loop.start(scheduledAgents);
    log.info(`Scheduler started for ${scheduledAgents.length} agent(s)`);
  }

  log.success('Ready. Press Ctrl+C to stop.');

  // Keep process alive
  process.on('SIGINT', () => {
    log.info('Shutting down...');
    httpServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    httpServer.stop();
    process.exit(0);
  });
}
