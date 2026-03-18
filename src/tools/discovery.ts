import { InstalledTool } from '../types';
import { getAllAdapters } from './registry';

export async function discoverTools(): Promise<InstalledTool[]> {
  const adapters = getAllAdapters();
  const results: InstalledTool[] = [];

  for (const adapter of adapters) {
    const tool = await adapter.detect();
    results.push(tool);
  }

  return results;
}
