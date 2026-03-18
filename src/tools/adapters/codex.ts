import { execSync } from 'child_process';
import { ToolAdapter, InstalledTool, ToolRunRequest } from '../../types';

export class CodexAdapter implements ToolAdapter {
  name = 'codex';
  command = 'codex';

  async detect(): Promise<InstalledTool> {
    try {
      const output = execSync('codex --version 2>/dev/null', {
        timeout: 5000,
        encoding: 'utf-8',
      }).trim();

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
    const args: string[] = [prompt];

    if (options?.args) {
      args.push(...options.args);
    }

    return args;
  }
}
