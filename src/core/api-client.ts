/**
 * V16 API Client
 * Fetches agents and reports task completion to the backend API.
 */

import { getServerUrl, getToken } from './config';
import { log } from './logger';

export interface RemoteAgent {
  agentId: string;
  userId: string;
  agentName: string;
  description: string;
  goals: string[];
  systemPrompt: string;
  cliTool: string;
  schedule?: string;
  workingDirectory?: string;
  envVars?: Record<string, string>;
  status: string;
}

export interface RemoteTask {
  taskId: string;
  agentId: string;
  userId: string;
  description: string;
  status: string;
  createdAt: number;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const serverUrl = getServerUrl();
  const token = getToken();

  if (!token) {
    throw new Error('Not authenticated. Run: v16 login --token <token>');
  }

  const url = `${serverUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

/** Fetch all agents for the authenticated user */
export async function fetchAgents(): Promise<RemoteAgent[]> {
  try {
    const agents = await apiFetch('/api/agents');
    return agents as RemoteAgent[];
  } catch (err: any) {
    log.warn(`Failed to fetch agents from API: ${err.message}`);
    return [];
  }
}

/** Fetch pending tasks for an agent */
export async function fetchPendingTasks(agentId: string): Promise<RemoteTask[]> {
  try {
    const tasks = await apiFetch(`/api/agents/${agentId}/tasks?status=pending`);
    return tasks as RemoteTask[];
  } catch (err: any) {
    log.warn(`Failed to fetch tasks for ${agentId}: ${err.message}`);
    return [];
  }
}

/** Report task completion to the backend */
export async function reportTaskCompletion(
  agentId: string,
  taskId: string,
  result: { success: boolean; stdout?: string; stderr?: string; error?: string }
): Promise<void> {
  try {
    await apiFetch(`/api/agents/${agentId}/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        success: result.success,
        result: { stdout: result.stdout, stderr: result.stderr },
        error: result.error,
      }),
    });
  } catch (err: any) {
    log.warn(`Failed to report task completion: ${err.message}`);
  }
}
