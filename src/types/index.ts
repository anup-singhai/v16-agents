// ==========================================
// V16 Local Agent — Type Definitions
// ==========================================

// Command protocol types
export interface Command {
  id: string;
  type: CommandType;
  payload: any;
}

export type CommandType =
  | 'execute'
  | 'tool:run'
  | 'tool:list'
  | 'agent:run'
  | 'agent:list'
  | 'status'
  | 'cd';

export interface CommandResult {
  id: string;
  payload: {
    success: boolean;
    data?: any;
    error?: string;
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    duration?: number;
  };
}

// Tool types
export interface InstalledTool {
  name: string;
  command: string;
  version?: string;
  available: boolean;
}

export interface ToolRunRequest {
  tool: string;
  prompt: string;
  cwd?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ToolRunResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

// Agent types
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  tool: string;
  prompt: string;
  cwd?: string;
  schedule?: string; // cron expression
  env?: Record<string, string>;
  createdAt: number;
}

export interface AgentExecution {
  agentId: string;
  startedAt: number;
  completedAt?: number;
  success?: boolean;
  exitCode?: number;
  output?: string;
  error?: string;
}

// Config types
export interface V16Config {
  serverUrl: string;
  token?: string;
  agents: AgentConfig[];
}

// CLI tool adapter interface
export interface ToolAdapter {
  name: string;
  command: string;
  detect(): Promise<InstalledTool>;
  buildArgs(prompt: string, options?: ToolRunRequest): string[];
  parseOutput?(raw: string): string;
}

// Template types
export interface AgentTemplatePayload {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  cliTool: string;
  defaultSchedule: string;
  prerequisites: string[];
  promptTemplate: string;
  guide: string;
}
