import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import {
  countPerfectDayRemaining,
  getPerfectDayTasks,
} from '../../domain/policies/PerfectStatus';
import { todayDateOnly } from '../../shared/utils/date';

export type DailyReminderProgress = {
  date: string;
  total: number;
  remaining: number;
  completed: number;
};

/**
 * Perfect Day remaining across all active plans (daily tasks only).
 */
export function createGetDailyReminderProgress(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getDailyReminderProgress(
    date = todayDateOnly(),
  ): Promise<DailyReminderProgress> {
    const activePlans = await planRepo.listActive();
    let total = 0;
    let remaining = 0;

    for (const plan of activePlans) {
      const completions = await completionRepo.listByPlan(plan.id);
      total += getPerfectDayTasks(plan.tasks).length;
      remaining += countPerfectDayRemaining(plan.tasks, completions, date);
    }

    return {
      date,
      total,
      remaining,
      completed: Math.max(0, total - remaining),
    };
  };
}
