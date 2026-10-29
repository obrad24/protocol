import type { TaskCompletion } from '../entities/TaskCompletion';
import type { Task } from '../entities/Task';
import { addDays } from '../../shared/utils/date';
import { isPerfectDay } from './PerfectStatus';

/**
 * Streak = consecutive Perfect Days ending at `date`.
 * Days with no daily tasks do not break or extend the streak (skipped).
 */
export function calculateStreak(input: {
  tasks: Task[];
  completions: TaskCompletion[];
  date: string;
  planStartDate: string;
  lookbackDays?: number;
}): number {
  const { tasks, completions, date, planStartDate, lookbackDays = 365 } = input;
  let streak = 0;
  let cursor = date;
  let checked = 0;

  while (checked < lookbackDays && cursor >= planStartDate) {
    const hasDaily = tasks.some((t) => t.recurrence.type === 'daily');
    if (!hasDaily) {
      cursor = addDays(cursor, -1);
      checked += 1;
      continue;
    }

    if (!isPerfectDay(tasks, completions, cursor)) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
    checked += 1;
  }

  return streak;
}
