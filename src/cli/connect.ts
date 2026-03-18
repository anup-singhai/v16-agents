import { log } from '../core/logger';
import { getServerUrl, setServerUrl, loadConfig } from '../core/config';
import { SocketClient } from '../core/socket-client';
import { CommandRouter } from '../core/command-router';
import { AgentLoop } from '../scheduler/agent-loop';

export async function connectCommand(options: { dev?: boolean; server?: string }): Promise<void> {
  let serverUrl: string;

  if (options.dev) {
    serverUrl = 'http://localhost:3001';
    log.dim('Dev mode: connecting to localhost:3001');
  } else if (options.server) {
    serverUrl = options.server;
    setServerUrl(serverUrl);
  } else {
    serverUrl = getServerUrl();
  }

  log.header('V16 Agent');
  log.info(`Connecting to ${serverUrl}...`);

  const client = new SocketClient(serverUrl);
  const router = new CommandRouter();
  router.setSocketClient(client);

  client.setCommandHandler((cmd) => router.route(cmd));

  try {
    await client.connect();
  } catch (err: any) {
    log.error(`Failed to connect: ${err.message}`);
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

  log.success('Listening for commands. Press Ctrl+C to disconnect.');

  // Keep process alive
  process.on('SIGINT', () => {
    log.info('Disconnecting...');
    client.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    client.disconnect();
    process.exit(0);
  });
}
