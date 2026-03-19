import { spawn } from 'child_process';
import { ToolRunRequest, ToolRunResult } from '../types';
import { getAdapter } from '../tools/registry';

export class ToolRunner {
  async run(
    request: ToolRunRequest,
    onProgress: (type: 'stdout' | 'stderr', data: string) => void
  ): Promise<ToolRunResult> {
    const adapter = getAdapter(request.tool);
    if (!adapter) {
      throw new Error(`Unknown tool: ${request.tool}. Run 'v16 tools' to see available tools.`);
    }

    // Check tool is installed
    const detected = await adapter.detect();
    if (!detected.available) {
      throw new Error(`Tool not installed: ${adapter.command}. Install it and try again.`);
    }

    const args = adapter.buildArgs(request.prompt, request);
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(adapter.command, args, {
        cwd: request.cwd || process.cwd(),
        env: { ...process.env, ...request.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        onProgress('stdout', chunk);
      });

      child.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        onProgress('stderr', chunk);
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const exitCode = code ?? 0;

        // Apply output parsing if adapter supports it
        const parsedStdout = adapter.parseOutput ? adapter.parseOutput(stdout) : stdout;

        resolve({
          success: exitCode === 0,
          exitCode,
          stdout: parsedStdout,
          stderr,
          duration,
        });
      });

      child.on('error', (err) => {
        reject(new Error(`Failed to spawn ${adapter.command}: ${err.message}`));
      });
    });
  }
}
