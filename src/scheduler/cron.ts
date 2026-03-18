// Simple cron expression parser
// Supports: minute hour day-of-month month day-of-week
// e.g., "0 9 * * *" = every day at 9:00 AM
//        "*/15 * * * *" = every 15 minutes
//        "0 */2 * * *" = every 2 hours

interface CronFields {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

function parseField(field: string, min: number, max: number): number[] {
  const values: number[] = [];

  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.push(i);
    } else if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      const start = range === '*' ? min : parseInt(range, 10);
      for (let i = start; i <= max; i += step) values.push(i);
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      for (let i = start; i <= end; i++) values.push(i);
    } else {
      values.push(parseInt(part, 10));
    }
  }

  return values.filter(v => v >= min && v <= max);
}

export function parseCron(expression: string): CronFields {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: "${expression}" (expected 5 fields)`);
  }

  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dayOfMonth: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dayOfWeek: parseField(parts[4], 0, 6),
  };
}

export function shouldRunAt(expression: string, date: Date): boolean {
  const fields = parseCron(expression);

  return (
    fields.minute.includes(date.getMinutes()) &&
    fields.hour.includes(date.getHours()) &&
    fields.dayOfMonth.includes(date.getDate()) &&
    fields.month.includes(date.getMonth() + 1) &&
    fields.dayOfWeek.includes(date.getDay())
  );
}

export function getNextRun(expression: string, after: Date = new Date()): Date {
  const next = new Date(after);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  // Check up to 1 year ahead
  const limit = new Date(after);
  limit.setFullYear(limit.getFullYear() + 1);

  while (next < limit) {
    if (shouldRunAt(expression, next)) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  throw new Error(`No next run found for: ${expression}`);
}
