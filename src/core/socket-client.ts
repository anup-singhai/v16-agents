import { io, Socket } from 'socket.io-client';
import * as os from 'os';
import { log } from './logger';
import { getToken } from './config';
import { Command, CommandResult, ProgressEvent, ReadyPayload } from '../types';
import { discoverTools } from '../tools/discovery';

export class SocketClient {
  private socket: Socket | null = null;
  private serverUrl: string;
  private onCommand: ((cmd: Command) => Promise<CommandResult['payload']>) | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  setCommandHandler(handler: (cmd: Command) => Promise<CommandResult['payload']>): void {
    this.onCommand = handler;
  }

  async connect(): Promise<void> {
    const token = getToken();
    if (!token) {
      throw new Error('No auth token configured. Run: v16 login --token <token>');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(`${this.serverUrl}/local-agent`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 30000,
      });

      this.socket.on('connect', async () => {
        log.success(`Connected to ${this.serverUrl}`);

        // Send ready payload with system info + installed tools
        const tools = await discoverTools();
        const ready: ReadyPayload = {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          cwd: process.cwd(),
          version: '0.1.0',
          capabilities: ['execute', 'tools', 'agents'],
          installedTools: tools,
        };

        this.socket!.emit('ready', ready);
        log.dim(`Reported ${tools.filter(t => t.available).length} installed tools`);
        resolve();
      });

      this.socket.on('command', async (cmd: Command) => {
        if (!this.onCommand) {
          log.warn(`No command handler for: ${cmd.type}`);
          return;
        }

        try {
          const result = await this.onCommand(cmd);
          this.socket!.emit('result', { id: cmd.id, payload: result });
        } catch (err: any) {
          this.socket!.emit('result', {
            id: cmd.id,
            payload: { success: false, error: err.message },
          });
        }
      });

      this.socket.on('disconnect', (reason) => {
        log.warn(`Disconnected: ${reason}`);
      });

      this.socket.on('reconnect', () => {
        log.success('Reconnected');
      });

      this.socket.on('connect_error', (err) => {
        log.error(`Connection error: ${err.message}`);
        if (!this.socket?.connected) {
          reject(err);
        }
      });
    });
  }

  sendProgress(event: ProgressEvent): void {
    if (this.socket?.connected) {
      this.socket.emit('progress', event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
