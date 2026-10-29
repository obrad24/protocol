import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import { calculateProgress } from '../../domain/policies/ProgressCalculator';
import { calculateStreak } from '../../domain/policies/StreakCalculator';
import {
  buildDayBars,
  buildHabitStats,
  rangeForPeriod,
  type DayBar,
  type HabitStat,
} from '../../domain/policies/AnalyticsCalculator';
import { todayDateOnly } from '../../shared/utils/date';

export type StatsPeriod = 'week' | 'month';

export type StatsDashboard = {
  planId: string;
  planName: string;
  period: StatsPeriod;
  date: string;
  rangeStart: string;
  rangeEnd: string;
  hasPlan: boolean;
  overallPercent: number;
  completedCount: number;
  expectedCount: number;
  streak: number;
  longestStreakInView: number;
  dailyAverage: number;
  dayBars: DayBar[];
  habitStats: HabitStat[];
};

export function createGetStatsDashboard(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getStatsDashboard(
    planId: string,
    period: StatsPeriod = 'week',
    date = todayDateOnly(),
  ): Promise<StatsDashboard> {
    const plan = await planRepo.getById(planId);
    const range = rangeForPeriod(period, date);

    if (!plan) {
      return {
        planId,
        planName: '',
        period,
        date,
        rangeStart: range.start,
        rangeEnd: range.end,
        hasPlan: false,
        overallPercent: 0,
        completedCount: 0,
        expectedCount: 0,
        streak: 0,
        longestStreakInView: 0,
        dailyAverage: 0,
        dayBars: [],
        habitStats: [],
      };
    }

    const completions = await completionRepo.listByPlan(plan.id);
    const dayBars = buildDayBars({
      tasks: plan.tasks,
      completions,
      from: range.start,
      to: range.end > date ? date : range.end,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });

    const completedCount = dayBars.reduce((sum, d) => sum + d.completed, 0);
    const expectedCount = dayBars.reduce((sum, d) => sum + d.total, 0);

    const daysWithTasks = dayBars.filter((d) => d.total > 0).length;
    const dailyAverage =
      daysWithTasks === 0
        ? 0
        : Math.round((completedCount / daysWithTasks) * 10) / 10;

    const streak = calculateStreak({
      tasks: plan.tasks,
      completions,
      date,
      planStartDate: plan.startDate,
    });

    let longest = 0;
    let current = 0;
    for (const bar of dayBars) {
      if (bar.total === 0) continue;
      if (bar.percent === 100) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    const progress = calculateProgress({
      tasks: plan.tasks,
      completions,
      date: range.end > date ? date : range.end,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });

    const habitStats = buildHabitStats({
      tasks: plan.tasks,
      completions,
      from: range.start,
      to: range.end > date ? date : range.end,
    });

    return {
      planId: plan.id,
      planName: plan.name,
      period,
      date,
      rangeStart: range.start,
      rangeEnd: range.end,
      hasPlan: true,
      overallPercent: period === 'week' ? progress.weeklyPercent : progress.monthlyPercent,
      completedCount,
      expectedCount,
      streak,
      longestStreakInView: longest,
      dailyAverage,
      dayBars,
      habitStats,
    };
  };
}
