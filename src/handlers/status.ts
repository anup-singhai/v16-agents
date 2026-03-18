import * as os from 'os';
import { CommandResult } from '../types';
import { discoverTools } from '../tools/discovery';
import { getAgents } from '../core/config';

export async function statusHandler(): Promise<CommandResult['payload']> {
  const tools = await discoverTools();

  return {
    success: true,
    data: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cwd: process.cwd(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
      },
      tools: tools.filter(t => t.available),
      agents: getAgents(),
    },
  };
}
