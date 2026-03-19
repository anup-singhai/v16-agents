import express, { Request, Response } from 'express';
import { Server } from 'http';
import { log } from './logger';
import { CommandRouter } from './command-router';
import { discoverTools } from '../tools/discovery';
import * as os from 'os';

const DEFAULT_PORT = 7160;

export class HttpServer {
  private app = express();
  private server: Server | null = null;
  private router: CommandRouter;
  private port: number;
  private startedAt = Date.now();

  constructor(router: CommandRouter, port?: number) {
    this.router = router;
    this.port = port || DEFAULT_PORT;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // CORS — allow frontend origins
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (_req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });

    // Health check
    this.app.get('/health', async (_req: Request, res: Response) => {
      const tools = await discoverTools();
      const available = tools.filter(t => t.available);

      res.json({
        status: 'ok',
        version: '1.0.4',
        uptime: Math.floor((Date.now() - this.startedAt) / 1000),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cwd: process.cwd(),
        tools: available.map(t => ({ name: t.name, command: t.command, version: t.version })),
      });
    });

    // Run a tool (replaces WebSocket tool:run command)
    this.app.post('/api/run', async (req: Request, res: Response) => {
      const { tool, prompt, cwd } = req.body;

      if (!tool || !prompt) {
        return res.status(400).json({ success: false, error: 'Missing required fields: tool, prompt' });
      }

      log.info(`[HTTP] Run request: tool=${tool}, cwd=${cwd || 'default'}`);

      try {
        const result = await this.router.route({
          id: `http-${Date.now()}`,
          type: 'tool:run',
          payload: { tool, prompt, cwd },
        });

        res.json(result);
      } catch (err: any) {
        log.error(`[HTTP] Run error: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // List available tools
    this.app.get('/api/tools', async (_req: Request, res: Response) => {
      const tools = await discoverTools();
      res.json({ success: true, data: tools });
    });

    // Status
    this.app.get('/api/status', async (_req: Request, res: Response) => {
      const result = await this.router.route({
        id: `http-${Date.now()}`,
        type: 'status',
        payload: {},
      });
      res.json(result);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        log.success(`HTTP server listening on port ${this.port}`);
        log.dim(`Health: http://localhost:${this.port}/health`);
        log.dim(`Run:    POST http://localhost:${this.port}/api/run`);
        resolve();
      });

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          log.warn(`Port ${this.port} in use, trying ${this.port + 1}...`);
          this.port++;
          this.server = this.app.listen(this.port, () => {
            log.success(`HTTP server listening on port ${this.port}`);
            resolve();
          });
        } else {
          reject(err);
        }
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  getPort(): number {
    return this.port;
  }
}
