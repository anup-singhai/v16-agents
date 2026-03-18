import { ToolAdapter } from '../types';
import { ClaudeCodeAdapter } from './adapters/claude-code';
import { CodexAdapter } from './adapters/codex';
import { GenericAdapter } from './adapters/generic';

const adapters: Map<string, ToolAdapter> = new Map();

// Register built-in adapters
function registerDefaults(): void {
  const builtIn: ToolAdapter[] = [
    new ClaudeCodeAdapter(),
    new CodexAdapter(),
  ];

  for (const adapter of builtIn) {
    adapters.set(adapter.name, adapter);
  }
}

registerDefaults();

export function getAdapter(name: string): ToolAdapter | undefined {
  // Check registered adapters first
  const adapter = adapters.get(name);
  if (adapter) return adapter;

  // Fall back to generic adapter for unknown tools
  return new GenericAdapter(name);
}

export function getAllAdapters(): ToolAdapter[] {
  return Array.from(adapters.values());
}

export function registerAdapter(adapter: ToolAdapter): void {
  adapters.set(adapter.name, adapter);
}
