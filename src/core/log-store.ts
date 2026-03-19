/**
 * Execution Log Store
 * Persists agent run logs to ~/.v16/logs/ on the user's machine.
 * Each run gets a JSON file with streaming entries + final result.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LOGS_DIR = path.join(os.homedir(), '.v16', 'logs');
const MAX_LOGS = 100; // Keep last 100 runs

export interface LogEntry {
  timestamp: number;
  type: 'stdout' | 'stderr' | 'system';
  data: string;
}

export interface RunLog {
  runId: string;
  tool: string;
  prompt: string;
  cwd?: string;
  startedAt: number;
  completedAt?: number;
  success?: boolean;
  exitCode?: number;
  duration?: number;
  entries: LogEntry[];
}

function ensureDir(): void {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function logPath(runId: string): string {
  return path.join(LOGS_DIR, `${runId}.json`);
}

/**
 * Create a new run log
 */
export function createRunLog(runId: string, tool: string, prompt: string, cwd?: string): RunLog {
  ensureDir();
  const run: RunLog = {
    runId,
    tool,
    prompt: prompt.length > 500 ? prompt.slice(0, 500) + '...' : prompt,
    cwd,
    startedAt: Date.now(),
    entries: [],
  };
  run.entries.push({ timestamp: Date.now(), type: 'system', data: `Running ${tool}...` });
  fs.writeFileSync(logPath(runId), JSON.stringify(run), 'utf-8');
  return run;
}

/**
 * Append a log entry to a run
 */
export function appendLogEntry(runId: string, type: 'stdout' | 'stderr', data: string): void {
  const filePath = logPath(runId);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const run: RunLog = JSON.parse(raw);
    run.entries.push({ timestamp: Date.now(), type, data });
    fs.writeFileSync(filePath, JSON.stringify(run), 'utf-8');
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Finalize a run log with result
 */
export function finalizeRunLog(
  runId: string,
  success: boolean,
  exitCode: number,
  duration: number
): void {
  const filePath = logPath(runId);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const run: RunLog = JSON.parse(raw);
    run.completedAt = Date.now();
    run.success = success;
    run.exitCode = exitCode;
    run.duration = duration;
    run.entries.push({
      timestamp: Date.now(),
      type: 'system',
      data: success ? `Completed in ${Math.round(duration / 1000)}s` : `Failed (exit ${exitCode})`,
    });
    fs.writeFileSync(filePath, JSON.stringify(run), 'utf-8');
  } catch {
    // Ignore
  }
  pruneOldLogs();
}

/**
 * Get a specific run log
 */
export function getRunLog(runId: string): RunLog | null {
  try {
    const raw = fs.readFileSync(logPath(runId), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * List all run logs (metadata only, no entries), most recent first
 */
export function listRunLogs(): Omit<RunLog, 'entries'>[] {
  ensureDir();
  try {
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const raw = fs.readFileSync(path.join(LOGS_DIR, f), 'utf-8');
          const run: RunLog = JSON.parse(raw);
          const { entries, ...meta } = run;
          return meta;
        } catch {
          return null;
        }
      })
      .filter((r): r is Omit<RunLog, 'entries'> => r !== null)
      .sort((a, b) => b.startedAt - a.startedAt);
    return files;
  } catch {
    return [];
  }
}

/**
 * Remove old logs beyond MAX_LOGS
 */
function pruneOldLogs(): void {
  try {
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(LOGS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    for (let i = MAX_LOGS; i < files.length; i++) {
      fs.unlinkSync(path.join(LOGS_DIR, files[i].name));
    }
  } catch {
    // Ignore
  }
}
