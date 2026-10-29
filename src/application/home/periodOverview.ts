import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import { calculateProgress } from '../../domain/policies/ProgressCalculator';
import {
  addDays,
  getMonthRange,
  getWeekRange,
  todayDateOnly,
} from '../../shared/utils/date';

export type PeriodOverviewKind = 'week' | 'month';

export type PeriodOverview = {
  kind: PeriodOverviewKind;
  periodId: string;
  from: string;
  to: string;
  percent: number;
  completed: number;
  expected: number;
  motivationBucket: 'great' | 'solid' | 'restart';
};

function weekId(date: string): string {
  const { start } = getWeekRange(date);
  return start;
}

function monthId(date: string): string {
  return date.slice(0, 7);
}

function bucket(percent: number): 'great' | 'solid' | 'restart' {
  if (percent >= 80) return 'great';
  if (percent >= 50) return 'solid';
  return 'restart';
}

export function createGetPendingPeriodOverviews(
  profileRepo: ProfileRepository,
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getPendingPeriodOverviews(
    date = todayDateOnly(),
  ): Promise<PeriodOverview[]> {
    const profile = await profileRepo.get();
    const activePlan = await planRepo.getActive();
    if (!profile || !activePlan) return [];

    const result: PeriodOverview[] = [];
    const completions = await completionRepo.listByPlan(activePlan.id);

    // Previous week overview on Mondays (or any day after week boundary if not yet shown)
    const thisWeek = getWeekRange(date);
    const prevWeekEnd = addDays(thisWeek.start, -1);
    const prevWeek = getWeekRange(prevWeekEnd);
    const prevWeekPeriodId = weekId(prevWeek.start);
    if (
      date >= thisWeek.start &&
      profile.lastShownWeekId !== prevWeekPeriodId &&
      prevWeek.end >= activePlan.startDate &&
      (activePlan.endDate == null || prevWeek.start <= activePlan.endDate)
    ) {
      const progress = calculateProgress({
        tasks: activePlan.tasks,
        completions,
        date: prevWeek.end < date ? prevWeek.end : date,
        planStartDate: activePlan.startDate,
        planEndDate: activePlan.endDate,
      });
      // Use weekly percent computed as of end of previous week
      const asOf = calculateProgress({
        tasks: activePlan.tasks,
        completions,
        date: prevWeek.end,
        planStartDate: activePlan.startDate,
        planEndDate: activePlan.endDate,
      });
      result.push({
        kind: 'week',
        periodId: prevWeekPeriodId,
        from: prevWeek.start,
        to: prevWeek.end,
        percent: asOf.weeklyPercent,
        completed: Math.round((asOf.weeklyPercent / 100) * Math.max(1, progress.dailyTotal)),
        expected: 0,
        motivationBucket: bucket(asOf.weeklyPercent),
      });
    }

    // Previous month on the 1st+
    const thisMonth = getMonthRange(date);
    const prevMonthEnd = addDays(thisMonth.start, -1);
    const prevMonth = getMonthRange(prevMonthEnd);
    const prevMonthPeriodId = monthId(prevMonth.start);
    if (
      date >= thisMonth.start &&
      profile.lastShownMonthId !== prevMonthPeriodId &&
      prevMonth.end >= activePlan.startDate &&
      (activePlan.endDate == null || prevMonth.start <= activePlan.endDate)
    ) {
      const asOf = calculateProgress({
        tasks: activePlan.tasks,
        completions,
        date: prevMonth.end,
        planStartDate: activePlan.startDate,
        planEndDate: activePlan.endDate,
      });
      result.push({
        kind: 'month',
        periodId: prevMonthPeriodId,
        from: prevMonth.start,
        to: prevMonth.end,
        percent: asOf.monthlyPercent,
        completed: 0,
        expected: 0,
        motivationBucket: bucket(asOf.monthlyPercent),
      });
    }

    return result;
  };
}

export function createMarkPeriodOverviewSeen(profileRepo: ProfileRepository) {
  return async function markPeriodOverviewSeen(
    kind: PeriodOverviewKind,
    periodId: string,
  ): Promise<void> {
    const profile = await profileRepo.get();
    if (!profile) return;
    await profileRepo.save({
      ...profile,
      lastShownWeekId: kind === 'week' ? periodId : profile.lastShownWeekId,
      lastShownMonthId: kind === 'month' ? periodId : profile.lastShownMonthId,
      updatedAt: new Date().toISOString(),
    });
  };
}
