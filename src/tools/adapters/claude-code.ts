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
      '--output-format', 'text',
      '--max-turns', '10',
    ];

    // Add any extra args
    if (options?.args) {
      args.push(...options.args);
    }

    return args;
  }
}
