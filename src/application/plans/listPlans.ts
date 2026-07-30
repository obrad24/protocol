import { calculateProgress } from '../../domain/policies/ProgressCalculator';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import { todayDateOnly } from '../../shared/utils/date';

export type PlanListItem = PlanWithTasks & {
  completionPercent: number;
};

export function createListPlans(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function listPlans(date = todayDateOnly()): Promise<PlanListItem[]> {
    const plans = await planRepo.list();
    const items: PlanListItem[] = [];

    for (const plan of plans) {
      const completions = await completionRepo.listByPlan(plan.id);
      const progress = calculateProgress({
        tasks: plan.tasks,
        completions,
        date,
        planStartDate: plan.startDate,
        planEndDate: plan.endDate,
      });
      items.push({ ...plan, completionPercent: progress.planCompletionPercent });
    }

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  };
}
