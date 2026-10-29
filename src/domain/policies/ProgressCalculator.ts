import type { TaskCompletion } from '../entities/TaskCompletion';
import type { Task } from '../entities/Task';
import type { RecurrenceRule } from '../value-objects/RecurrenceRule';
import {
  eachDateInRange,
  getMonthRange,
  getWeekRange,
  getWeekday,
} from '../../shared/utils/date';
import {
  countPerfectDayRemaining,
  evaluatePerfectStatus,
  getPerfectDayTasks,
} from './PerfectStatus';

export type ProgressSnapshot = {
  dailyPercent: number;
  weeklyPercent: number;
  monthlyPercent: number;
  planCompletionPercent: number;
  dailyCompleted: number;
  dailyTotal: number;
  /** Based only on daily tasks — independent of Home due-list. */
  perfectDay: boolean;
  /** Weekly targets (+ existing daily week rule); ignores monthly. */
  perfectWeek: boolean;
  /** Monthly targets only (extensible). */
  perfectMonth: boolean;
  /** Incomplete daily tasks remaining for Perfect Day. */
  perfectDayRemaining: number;
  /** Total daily tasks that count toward Perfect Day. */
  perfectDayTotal: number;
};

export type TaskPeriodProgress = {
  done: number;
  target: number;
  /** Extra completions above the planned target. */
  bonus: number;
  fulfilled: boolean;
};

function clampPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function completionWeight(c: TaskCompletion): number {
  if (!c.completed) return 0;
  const count = c.count ?? 1;
  return count > 0 ? count : 1;
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
  return completions
    .filter((c) => c.taskId === taskId && c.date >= from && c.date <= to)
    .reduce((sum, c) => sum + completionWeight(c), 0);
}

function periodTargetForRule(rule: RecurrenceRule): number | null {
  switch (rule.type) {
    case 'daily':
    case 'weekdays':
      return 1;
    case 'weekly_count':
      return rule.timesPerWeek;
    case 'monthly_count':
      return rule.timesPerMonth;
    default:
      return null;
  }
}

/**
 * Progress toward the task's planned target for the relevant period
 * (day / week / month), using the original target (never inflated by bonuses).
 */
export function getTaskPeriodProgress(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): TaskPeriodProgress | null {
  const rule = task.recurrence;
  const target = periodTargetForRule(rule);
  if (target === null) return null;

  let done = 0;
  switch (rule.type) {
    case 'daily':
      done = countCompletionsInRange(completions, task.id, date, date);
      break;
    case 'weekdays': {
      if (!rule.days.includes(getWeekday(date))) return null;
      done = countCompletionsInRange(completions, task.id, date, date);
      break;
    }
    case 'weekly_count': {
      const { start, end } = getWeekRange(date);
      done = countCompletionsInRange(completions, task.id, start, end);
      break;
    }
    case 'monthly_count': {
      const { start, end } = getMonthRange(date);
      done = countCompletionsInRange(completions, task.id, start, end);
      break;
    }
  }

  const bonus = Math.max(0, done - target);
  return {
    done,
    target,
    bonus,
    fulfilled: done >= target,
  };
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

/**
 * Tasks with over-plan enabled that already met the period target belong in the
 * "Plan ispunjen" section — not in the main obligations list.
 */
export function shouldShowInPlanFulfilledSection(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): boolean {
  if (!task.allowOverPlan) return false;
  const progress = getTaskPeriodProgress(task, date, completions);
  return progress !== null && progress.fulfilled;
}

/**
 * Due for the main Home list (excludes over-plan fulfilled tasks).
 */
export function isTaskActiveOnDate(
  task: Task,
  date: string,
  completions: TaskCompletion[],
): boolean {
  if (shouldShowInPlanFulfilledSection(task, date, completions)) return false;
  return isTaskDueOnDate(task, date, completions);
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
  /** `null` = unlimited plan; progress is measured through `date`. */
  planEndDate: string | null;
}): ProgressSnapshot {
  const { tasks, completions, date, planStartDate, planEndDate } = input;
  const effectiveEnd = planEndDate ?? date;

  // Active obligations + over-plan tasks completed today (so hitting target still counts as a done day).
  const dueToday = tasks.filter(
    (t) =>
      isTaskActiveOnDate(t, date, completions) ||
      (shouldShowInPlanFulfilledSection(t, date, completions) &&
        isCompletedOn(completions, t.id, date)),
  );
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
  const planTo = effectiveEnd < date ? effectiveEnd : date;
  const planExpected =
    planTo >= planFrom ? expectedInRange(tasks, planFrom, planTo) : 0;
  const planCompleted =
    planTo >= planFrom ? completedInRange(tasks, completions, planFrom, planTo) : 0;

  const perfect = evaluatePerfectStatus(tasks, completions, date);
  const perfectDayTotal = getPerfectDayTasks(tasks).length;
  const perfectDayRemaining = countPerfectDayRemaining(tasks, completions, date);

  return {
    dailyPercent: clampPercent(dailyCompleted, dailyTotal),
    weeklyPercent: clampPercent(weeklyCompleted, weeklyExpected),
    monthlyPercent: clampPercent(monthlyCompleted, monthlyExpected),
    planCompletionPercent: clampPercent(planCompleted, planExpected),
    dailyCompleted,
    dailyTotal,
    perfectDay: perfect.perfectDay,
    perfectWeek: perfect.perfectWeek,
    perfectMonth: perfect.perfectMonth,
    perfectDayRemaining,
    perfectDayTotal,
  };
}
