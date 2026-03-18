import { execSync } from 'child_process';
import { ToolAdapter, InstalledTool, ToolRunRequest } from '../../types';

export class GenericAdapter implements ToolAdapter {
  name: string;
  command: string;

  constructor(name: string) {
    this.name = name;
    this.command = name;
  }

  async detect(): Promise<InstalledTool> {
    try {
      execSync(`which ${this.command} 2>/dev/null`, {
        timeout: 5000,
        encoding: 'utf-8',
      });

      return {
        name: this.name,
        command: this.command,
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
