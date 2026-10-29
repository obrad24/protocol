import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import {
  eachDateInRange,
  getMonthRange,
  getWeekRange,
} from '../../shared/utils/date';

export type PerfectStatus = {
  perfectDay: boolean;
  perfectWeek: boolean;
  /** Reserved for Perfect Month; currently only `monthly_count` targets. */
  perfectMonth: boolean;
};

function isCompletedOn(
  completions: TaskCompletion[],
  taskId: string,
  date: string,
): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date && c.completed);
}

function completionWeight(c: TaskCompletion): number {
  if (!c.completed) return 0;
  const count = c.count ?? 1;
  return count > 0 ? count : 1;
}

function countCompletionsInRange(
  completions: TaskCompletion[],
  taskId: string,
  from: string,
  to: string,
): number {
  return completions
    .filter((c) => c.taskId === taskId && c.date >= from && c.date <= to)
    .reduce((sum, c) => sum + completionWeight(c), 0);
}

function isWeeklyTargetMet(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): boolean {
  if (task.recurrence.type !== 'weekly_count') return false;
  const { start, end } = getWeekRange(date);
  const done = countCompletionsInRange(completions, task.id, start, end);
  return done >= task.recurrence.timesPerWeek;
}

function isMonthlyTargetMet(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): boolean {
  if (task.recurrence.type !== 'monthly_count') return false;
  const { start, end } = getMonthRange(date);
  const done = countCompletionsInRange(completions, task.id, start, end);
  return done >= task.recurrence.timesPerMonth;
}

/** Daily tasks that count toward Perfect Day. */
export function getPerfectDayTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.recurrence.type === 'daily');
}

/**
 * How many Perfect Day (daily) tasks are still incomplete on `date`.
 */
export function countPerfectDayRemaining(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string,
): number {
  return getPerfectDayTasks(tasks).filter(
    (t) => !isCompletedOn(completions, t.id, date),
  ).length;
}

/**
 * Perfect Day — only `daily` tasks.
 * Weekly / monthly tasks never block Perfect Day, even if shown on Home.
 */
export function isPerfectDay(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string,
): boolean {
  const dailyTasks = getPerfectDayTasks(tasks);
  if (dailyTasks.length === 0) return false;
  return dailyTasks.every((t) => isCompletedOn(completions, t.id, date));
}

/**
 * Perfect Week — every `weekly_count` task must meet its week target (4/3 still OK).
 *
 * Daily tasks use the existing week rule: one completion for each day in the week range.
 * Monthly tasks are excluded (Perfect Month later).
 */
export function isPerfectWeek(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string,
): boolean {
  const weeklyTasks = tasks.filter((t) => t.recurrence.type === 'weekly_count');
  const dailyTasks = tasks.filter((t) => t.recurrence.type === 'daily');

  if (weeklyTasks.length === 0 && dailyTasks.length === 0) return false;

  if (!weeklyTasks.every((task) => isWeeklyTargetMet(task, date, completions))) {
    return false;
  }

  if (dailyTasks.length === 0) return true;

  const { start, end } = getWeekRange(date);
  const daysInWeek = eachDateInRange(start, end).length;

  return dailyTasks.every((task) => {
    const done = countCompletionsInRange(completions, task.id, start, end);
    return done >= daysInWeek;
  });
}

/**
 * Perfect Month — only `monthly_count` for now (extensible later).
 */
export function isPerfectMonth(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string,
): boolean {
  const monthlyTasks = tasks.filter((t) => t.recurrence.type === 'monthly_count');
  if (monthlyTasks.length === 0) return false;
  return monthlyTasks.every((task) => isMonthlyTargetMet(task, date, completions));
}

export function evaluatePerfectStatus(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string,
): PerfectStatus {
  return {
    perfectDay: isPerfectDay(tasks, completions, date),
    perfectWeek: isPerfectWeek(tasks, completions, date),
    perfectMonth: isPerfectMonth(tasks, completions, date),
  };
}
