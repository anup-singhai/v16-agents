import express, { Request, Response } from 'express';
import { Server } from 'http';
import * as crypto from 'crypto';
import { log } from './logger';
import { CommandRouter } from './command-router';
import { discoverTools } from '../tools/discovery';
import { getBuiltInTemplates, getBuiltInTemplate } from '../templates';
import { createRunLog, appendLogEntry, finalizeRunLog, getRunLog, listRunLogs } from './log-store';
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

    // Run a tool with SSE streaming + persist logs
    this.app.post('/api/run', async (req: Request, res: Response) => {
      const { tool, prompt, cwd } = req.body;

      if (!tool || !prompt) {
        return res.status(400).json({ success: false, error: 'Missing required fields: tool, prompt' });
      }

      const runId = crypto.randomUUID();
      log.info(`[HTTP] Run request: tool=${tool}, runId=${runId}, cwd=${cwd || 'default'}`);
      createRunLog(runId, tool, prompt, cwd);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send runId as first event so frontend can reference it
      res.write(`data: ${JSON.stringify({ type: 'start', runId, timestamp: Date.now() })}\n\n`);

      try {
        const result = await this.router.toolRunner.run(
          { tool, prompt, cwd },
          (type, data) => {
            appendLogEntry(runId, type, data);
            const event = JSON.stringify({ type, data, timestamp: Date.now() });
            res.write(`data: ${event}\n\n`);
          }
        );

        finalizeRunLog(runId, result.success, result.exitCode, result.duration);

        const done = JSON.stringify({
          type: 'done',
          runId,
          success: result.success,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          duration: result.duration,
        });
        res.write(`data: ${done}\n\n`);
        res.end();
      } catch (err: any) {
        log.error(`[HTTP] Run error: ${err.message}`);
        finalizeRunLog(runId, false, 1, 0);
        const error = JSON.stringify({ type: 'error', runId, error: err.message });
        res.write(`data: ${error}\n\n`);
        res.end();
      }
    });

    // List available tools
    this.app.get('/api/tools', async (_req: Request, res: Response) => {
      const tools = await discoverTools();
      res.json({ success: true, data: tools });
    });

    // List templates (metadata only, no promptTemplate/guide)
    this.app.get('/api/templates', (_req: Request, res: Response) => {
      const templates = getBuiltInTemplates();
      const metadata = templates.map(({ promptTemplate, guide, ...rest }) => rest);
      res.json({ success: true, data: metadata });
    });

    // Get template by ID (full details including prompt)
    this.app.get('/api/templates/:id', (req: Request, res: Response) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const template = getBuiltInTemplate(id);
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      res.json({ success: true, data: template });
    });

    // List execution logs (metadata only, most recent first)
    this.app.get('/api/logs', (_req: Request, res: Response) => {
      const logs = listRunLogs();
      res.json({ success: true, data: logs });
    });

    // Get a specific run log with all entries
    this.app.get('/api/logs/:runId', (req: Request, res: Response) => {
      const runId = Array.isArray(req.params.runId) ? req.params.runId[0] : req.params.runId;
      const runLog = getRunLog(runId);
      if (!runLog) {
        return res.status(404).json({ success: false, error: 'Log not found' });
      }
      res.json({ success: true, data: runLog });
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
