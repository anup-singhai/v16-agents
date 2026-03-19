import { Command, CommandResult } from '../types';
import { executeHandler } from '../handlers/execute';
import { statusHandler } from '../handlers/status';
import { ToolRunner } from '../handlers/tool-runner';
import { discoverTools } from '../tools/discovery';
import { getAgents } from './config';

export class CommandRouter {
  private toolRunner: ToolRunner;

  constructor() {
    this.toolRunner = new ToolRunner();
  }

  async route(cmd: Command): Promise<CommandResult['payload']> {
    switch (cmd.type) {
      case 'execute':
        return executeHandler(cmd.payload);

      case 'cd':
        return this.handleCd(cmd.payload);

      case 'tool:run':
        return this.handleToolRun(cmd);

      case 'tool:list':
        return this.handleToolList();

      case 'agent:run':
        return this.handleAgentRun(cmd.payload);

      case 'agent:list':
        return this.handleAgentList();

      case 'status':
        return statusHandler();

      default:
        return { success: false, error: `Unknown command type: ${cmd.type}` };
    }
  }

  private handleCd(payload: { path: string }): CommandResult['payload'] {
    try {
      process.chdir(payload.path);
      return { success: true, data: { cwd: process.cwd() } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async handleToolRun(cmd: Command): Promise<CommandResult['payload']> {
    const { tool, prompt, cwd, args, env } = cmd.payload;

    try {
      const result = await this.toolRunner.run(
        { tool, prompt, cwd, args, env },
        () => {} // progress streaming handled by HTTP response
      );

      return {
        success: result.success,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration: result.duration,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async handleToolList(): Promise<CommandResult['payload']> {
    const tools = await discoverTools();
    return { success: true, data: tools };
  }

  private async handleAgentRun(payload: { agentId: string }): Promise<CommandResult['payload']> {
    const agents = getAgents();
    const agent = agents.find(a => a.id === payload.agentId);

    if (!agent) {
      return { success: false, error: `Agent not found: ${payload.agentId}` };
    }

    try {
      const result = await this.toolRunner.run(
        { tool: agent.tool, prompt: agent.prompt, cwd: agent.cwd, env: agent.env },
        () => {} // no streaming for scheduled runs
      );

      return {
        success: result.success,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration: result.duration,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private handleAgentList(): CommandResult['payload'] {
    const agents = getAgents();
    return { success: true, data: agents };
  }
}
