import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import type { PlanSummaryRepository } from '../../domain/repositories/PlanSummaryRepository';
import {
  buildTasksFromInput,
  resolveEndDate,
  ValidationError,
  type CreatePlanInput,
} from './createPlan';
import { defaultPlanStartDate } from '../../shared/utils/planDates';

export type UpdatePlanInput = CreatePlanInput & {
  planId: string;
};

export function createUpdatePlan(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function updatePlan(input: UpdatePlanInput): Promise<PlanWithTasks> {
    const existing = await planRepo.getById(input.planId);
    if (!existing) {
      throw new ValidationError('Plan nije pronađen.');
    }

    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Naziv plana je obavezan.');
    }

    const now = new Date().toISOString();
    const startDate = defaultPlanStartDate();
    const endDate = resolveEndDate(startDate, input.duration, input.customEndDate);
    const tasks = buildTasksFromInput(existing.id, input.tasks, now);

    const plan = {
      ...existing,
      name,
      description: input.description.trim(),
      duration: input.duration,
      startDate,
      endDate,
      overviewSeenAt: null,
      updatedAt: now,
    };

    await completionRepo.deleteByPlan(existing.id);
    await planRepo.save(plan, tasks);

    return { ...plan, tasks };
  };
}

export function createDeletePlan(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
  planSummaryRepo: PlanSummaryRepository,
) {
  return async function deletePlan(planId: string): Promise<void> {
    const existing = await planRepo.getById(planId);
    if (!existing) {
      throw new ValidationError('Plan nije pronađen.');
    }
    await completionRepo.deleteByPlan(planId);
    await planSummaryRepo.deleteByPlanId(planId);
    await planRepo.delete(planId);
  };
}

export function createMarkPlanOverviewSeen(planRepo: PlanRepository) {
  return async function markPlanOverviewSeen(planId: string): Promise<void> {
    const plan = await planRepo.getById(planId);
    if (!plan) return;
    await planRepo.save(
      { ...plan, overviewSeenAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      plan.tasks,
    );
  };
}

export function createGetPlan(planRepo: PlanRepository) {
  return async function getPlan(planId: string): Promise<PlanWithTasks | null> {
    return planRepo.getById(planId);
  };
}
