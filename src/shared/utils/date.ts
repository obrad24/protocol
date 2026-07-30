import type { Weekday } from '../../domain/value-objects/RecurrenceRule';

/** Parse YYYY-MM-DD as local calendar date (no timezone shift). */
export function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  const d = parseDateOnly(date);
  d.setDate(d.getDate() + days);
  return formatDateOnly(d);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function getWeekday(date: string): Weekday {
  const jsDay = parseDateOnly(date).getDay(); // 0 = Sunday
  return (jsDay === 0 ? 7 : jsDay) as Weekday;
}

/** Monday-based week containing `date`. */
export function getWeekRange(date: string): { start: string; end: string } {
  const weekday = getWeekday(date);
  const start = addDays(date, 1 - weekday);
  const end = addDays(start, 6);
  return { start, end };
}

export function getMonthRange(date: string): { start: string; end: string } {
  const d = parseDateOnly(date);
  const start = formatDateOnly(new Date(d.getFullYear(), d.getMonth(), 1));
  const end = formatDateOnly(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start, end };
}

export function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}
