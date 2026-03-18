import { exec } from 'child_process';
import { CommandResult } from '../types';

export function executeHandler(payload: {
  command: string;
  cwd?: string;
  timeout?: number;
}): Promise<CommandResult['payload']> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = payload.timeout || 60000;

    exec(
      payload.command,
      {
        cwd: payload.cwd || process.cwd(),
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        if (error) {
          resolve({
            success: false,
            exitCode: error.code ?? 1,
            stdout: stdout || '',
            stderr: stderr || error.message,
            duration,
          });
        } else {
          resolve({
            success: true,
            exitCode: 0,
            stdout: stdout || '',
            stderr: stderr || '',
            duration,
          });
        }
      }
    );
  });
}
