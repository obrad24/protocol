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
  period: StatsPeriod;
  date: string;
  rangeStart: string;
  rangeEnd: string;
  hasActivePlan: boolean;
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
    period: StatsPeriod = 'week',
    date = todayDateOnly(),
  ): Promise<StatsDashboard> {
    const activePlan = await planRepo.getActive();
    const range = rangeForPeriod(period, date);

    if (!activePlan) {
      return {
        period,
        date,
        rangeStart: range.start,
        rangeEnd: range.end,
        hasActivePlan: false,
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

    const completions = await completionRepo.listByPlan(activePlan.id);
    const dayBars = buildDayBars({
      tasks: activePlan.tasks,
      completions,
      from: range.start,
      to: range.end > date ? date : range.end,
      planStartDate: activePlan.startDate,
      planEndDate: activePlan.endDate,
    });

    const completedCount = dayBars.reduce((sum, d) => sum + d.completed, 0);
    const expectedCount = dayBars.reduce((sum, d) => sum + d.total, 0);
    const overallPercent =
      expectedCount === 0 ? 0 : Math.round((completedCount / expectedCount) * 100);

    const daysWithTasks = dayBars.filter((d) => d.total > 0).length;
    const dailyAverage =
      daysWithTasks === 0
        ? 0
        : Math.round((completedCount / daysWithTasks) * 10) / 10;

    const streak = calculateStreak({
      tasks: activePlan.tasks,
      completions,
      date,
      planStartDate: activePlan.startDate,
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

    // Also use period-end progress snapshot for weekly/monthly % consistency
    const progress = calculateProgress({
      tasks: activePlan.tasks,
      completions,
      date: range.end > date ? date : range.end,
      planStartDate: activePlan.startDate,
      planEndDate: activePlan.endDate,
    });

    const habitStats = buildHabitStats({
      tasks: activePlan.tasks,
      completions,
      from: range.start,
      to: range.end > date ? date : range.end,
    });

    return {
      period,
      date,
      rangeStart: range.start,
      rangeEnd: range.end,
      hasActivePlan: true,
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
