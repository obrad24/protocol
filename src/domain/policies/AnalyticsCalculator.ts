import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import {
  calculateProgress,
  isTaskDueOnDate,
} from './ProgressCalculator';
import { eachDateInRange, getMonthRange, getWeekRange } from '../../shared/utils/date';

export type DayBar = {
  date: string;
  label: string;
  percent: number;
  completed: number;
  total: number;
};

const WEEKDAY_SHORT = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'] as const;

function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0 Sun
  const isoIndex = weekday === 0 ? 6 : weekday - 1;
  return WEEKDAY_SHORT[isoIndex];
}

export function buildDayBars(input: {
  tasks: Task[];
  completions: TaskCompletion[];
  from: string;
  to: string;
  planStartDate: string;
  planEndDate: string | null;
}): DayBar[] {
  return eachDateInRange(input.from, input.to).map((date) => {
    const progress = calculateProgress({
      tasks: input.tasks,
      completions: input.completions,
      date,
      planStartDate: input.planStartDate,
      planEndDate: input.planEndDate,
    });
    return {
      date,
      label: dayLabel(date),
      percent: progress.dailyPercent,
      completed: progress.dailyCompleted,
      total: progress.dailyTotal,
    };
  });
}

export type HabitStat = {
  taskId: string;
  title: string;
  completed: number;
  expected: number;
  percent: number;
};

export function buildHabitStats(input: {
  tasks: Task[];
  completions: TaskCompletion[];
  from: string;
  to: string;
}): HabitStat[] {
  const dates = eachDateInRange(input.from, input.to);

  return input.tasks
    .map((task) => {
      let expected = 0;
      let completed = 0;
      for (const date of dates) {
        if (!isTaskDueOnDate(task, date, input.completions)) continue;
        expected += 1;
        const done = input.completions.some(
          (c) => c.taskId === task.id && c.date === date && c.completed,
        );
        if (done) completed += 1;
      }
      const percent = expected === 0 ? 0 : Math.round((completed / expected) * 100);
      return {
        taskId: task.id,
        title: task.title,
        completed,
        expected,
        percent,
      };
    })
    .filter((h) => h.expected > 0)
    .sort((a, b) => b.percent - a.percent || b.completed - a.completed);
}

export function rangeForPeriod(
  period: 'week' | 'month',
  date: string,
): { start: string; end: string } {
  return period === 'week' ? getWeekRange(date) : getMonthRange(date);
}
