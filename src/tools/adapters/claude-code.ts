import { execSync } from 'child_process';
import { ToolAdapter, InstalledTool, ToolRunRequest } from '../../types';

export class ClaudeCodeAdapter implements ToolAdapter {
  name = 'claude';
  command = 'claude';

  async detect(): Promise<InstalledTool> {
    try {
      const output = execSync('claude --version 2>/dev/null', {
        timeout: 5000,
        encoding: 'utf-8',
      }).trim();

      // Extract version from output
      const versionMatch = output.match(/(\d+\.\d+\.\d+)/);

      return {
        name: this.name,
        command: this.command,
        version: versionMatch?.[1],
        available: true,
      };
    } catch {
      return {
        name: this.name,
        command: this.command,
        available: false,
      };
    }
  }

  buildArgs(prompt: string, options?: ToolRunRequest): string[] {
    const args: string[] = [
      '-p', prompt,
      '--output-format', 'stream-json',
    ];

    // Add any extra args
    if (options?.args) {
      args.push(...options.args);
    }

    return args;
  }

  parseOutput(raw: string): string {
    // Claude Code stream-json outputs one JSON object per line
    // Extract the text content from result messages
    const lines = raw.split('\n').filter(Boolean);
    const textParts: string[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'result' && obj.result) {
          textParts.push(obj.result);
        } else if (obj.type === 'assistant' && obj.message) {
          textParts.push(obj.message);
        }
      } catch {
        // Not JSON, include raw line
        textParts.push(line);
      }
    }

    return textParts.join('\n') || raw;
  }
}
