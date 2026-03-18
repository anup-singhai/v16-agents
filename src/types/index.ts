// ==========================================
// V16 Local Agent — Type Definitions
// ==========================================

// Command protocol types (matches backend)
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

export interface ProgressEvent {
  id: string;
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

// Ready payload sent on connection
export interface ReadyPayload {
  platform: string;
  arch: string;
  hostname: string;
  cwd: string;
  version: string;
  capabilities: string[];
  installedTools: InstalledTool[];
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
