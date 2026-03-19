import { log } from '../core/logger';
import { loadConfig, getToken } from '../core/config';
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

  // Start agent scheduler — handles both local config agents and remote (backend API) agents
  const config = loadConfig();
  const localScheduled = config.agents.filter(a => a.schedule);
  const hasToken = !!getToken();

  if (localScheduled.length > 0 || hasToken) {
    const loop = new AgentLoop(router);
    loop.start(localScheduled);

    if (localScheduled.length > 0) {
      log.info(`Scheduler: ${localScheduled.length} local agent(s)`);
    }
    if (hasToken) {
      log.info('Scheduler: polling backend for remote agents');
    }
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
