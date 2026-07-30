import type { TaskCompletion } from '../entities/TaskCompletion';
import type { Task } from '../entities/Task';
import type { RecurrenceRule } from '../value-objects/RecurrenceRule';
import {
  eachDateInRange,
  getMonthRange,
  getWeekRange,
  getWeekday,
} from '../../shared/utils/date';

export type ProgressSnapshot = {
  dailyPercent: number;
  weeklyPercent: number;
  monthlyPercent: number;
  planCompletionPercent: number;
  dailyCompleted: number;
  dailyTotal: number;
};

function clampPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function isCompletedOn(
  completions: TaskCompletion[],
  taskId: string,
  date: string,
): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date && c.completed);
}

function countCompletionsInRange(
  completions: TaskCompletion[],
  taskId: string,
  from: string,
  to: string,
): number {
  return completions.filter(
    (c) => c.taskId === taskId && c.completed && c.date >= from && c.date <= to,
  ).length;
}

/**
 * Whether the task should appear on the given calendar day
 * (for Home daily list and daily progress denominator).
 */
export function isTaskDueOnDate(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): boolean {
  const rule = task.recurrence;
  const alreadyDoneToday = isCompletedOn(completions, task.id, date);

  switch (rule.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return rule.days.includes(getWeekday(date));
    case 'weekly_count': {
      const { start, end } = getWeekRange(date);
      const doneThisWeek = countCompletionsInRange(completions, task.id, start, end);
      return alreadyDoneToday || doneThisWeek < rule.timesPerWeek;
    }
    case 'monthly_count': {
      const { start, end } = getMonthRange(date);
      const doneThisMonth = countCompletionsInRange(completions, task.id, start, end);
      return alreadyDoneToday || doneThisMonth < rule.timesPerMonth;
    }
    default:
      return false;
  }
}

function expectedOccurrencesForRule(
  rule: RecurrenceRule,
  from: string,
  to: string,
): number {
  const dates = eachDateInRange(from, to);
  switch (rule.type) {
    case 'daily':
      return dates.length;
    case 'weekdays':
      return dates.filter((d) => rule.days.includes(getWeekday(d))).length;
    case 'weekly_count': {
      // Count full weeks + proportional remainder by unique week starts.
      const weekStarts = new Set(dates.map((d) => getWeekRange(d).start));
      return weekStarts.size * rule.timesPerWeek;
    }
    case 'monthly_count': {
      const monthKeys = new Set(
        dates.map((d) => {
          const { start } = getMonthRange(d);
          return start;
        }),
      );
      return monthKeys.size * rule.timesPerMonth;
    }
    default:
      return 0;
  }
}

function expectedInRange(tasks: Task[], from: string, to: string): number {
  return tasks.reduce((sum, task) => sum + expectedOccurrencesForRule(task.recurrence, from, to), 0);
}

function completedInRange(
  tasks: Task[],
  completions: TaskCompletion[],
  from: string,
  to: string,
): number {
  return tasks.reduce((sum, task) => {
    const count = countCompletionsInRange(completions, task.id, from, to);
    const expected = expectedOccurrencesForRule(task.recurrence, from, to);
    return sum + Math.min(count, expected);
  }, 0);
}

export function calculateProgress(input: {
  tasks: Task[];
  completions: TaskCompletion[];
  date: string;
  planStartDate: string;
  planEndDate: string;
}): ProgressSnapshot {
  const { tasks, completions, date, planStartDate, planEndDate } = input;

  const dueToday = tasks.filter((t) => isTaskDueOnDate(t, date, completions));
  const dailyCompleted = dueToday.filter((t) =>
    isCompletedOn(completions, t.id, date),
  ).length;
  const dailyTotal = dueToday.length;

  const week = getWeekRange(date);
  const month = getMonthRange(date);

  const weeklyExpected = expectedInRange(tasks, week.start, week.end);
  const weeklyCompleted = completedInRange(tasks, completions, week.start, week.end);

  const monthlyExpected = expectedInRange(tasks, month.start, month.end);
  const monthlyCompleted = completedInRange(tasks, completions, month.start, month.end);

  const planFrom = planStartDate;
  const planTo = planEndDate < date ? planEndDate : date;
  const planExpected =
    planTo >= planFrom ? expectedInRange(tasks, planFrom, planTo) : 0;
  const planCompleted =
    planTo >= planFrom ? completedInRange(tasks, completions, planFrom, planTo) : 0;

  return {
    dailyPercent: clampPercent(dailyCompleted, dailyTotal),
    weeklyPercent: clampPercent(weeklyCompleted, weeklyExpected),
    monthlyPercent: clampPercent(monthlyCompleted, monthlyExpected),
    planCompletionPercent: clampPercent(planCompleted, planExpected),
    dailyCompleted,
    dailyTotal,
  };
}
