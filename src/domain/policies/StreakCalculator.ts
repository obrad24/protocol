import type { TaskCompletion } from '../entities/TaskCompletion';
import type { Task } from '../entities/Task';
import { addDays } from '../../shared/utils/date';
import { calculateProgress } from './ProgressCalculator';

/**
 * Streak = consecutive days ending at `date` where daily progress was 100%.
 * Days with zero due tasks do not break or extend the streak (skipped).
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
    const progress = calculateProgress({
      tasks,
      completions,
      date: cursor,
      planStartDate,
      planEndDate: cursor,
    });

    if (progress.dailyTotal === 0) {
      cursor = addDays(cursor, -1);
      checked += 1;
      continue;
    }

    if (progress.dailyPercent < 100) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
    checked += 1;
  }

  return streak;
}
