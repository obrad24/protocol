import type { Task } from '../../domain/entities/Task';
import type { TaskCompletion } from '../../domain/entities/TaskCompletion';
import type { PlanSummary } from '../../domain/entities/PlanSummary';
import { isPlanExpired } from '../../domain/entities/Plan';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { PlanSummaryRepository } from '../../domain/repositories/PlanSummaryRepository';
import {
  calculateProgress,
  isTaskDueOnDate,
} from '../../domain/policies/ProgressCalculator';
import { eachDateInRange, todayDateOnly } from '../../shared/utils/date';

export type TaskOverviewRow = {
  taskId: string;
  title: string;
  expected: number;
  completed: number;
  missed: number;
};

export type PlanOverview = {
  plan: PlanWithTasks;
  successPercent: number;
  tasks: TaskOverviewRow[];
  motivationBucket: 'great' | 'solid' | 'restart';
};

function countExpectedForTask(
  task: Task,
  completions: TaskCompletion[],
  from: string,
  to: string,
): { expected: number; completed: number } {
  let expected = 0;
  let completed = 0;
  for (const date of eachDateInRange(from, to)) {
    if (isTaskDueOnDate(task, date, completions)) {
      expected += 1;
      if (completions.some((c) => c.taskId === task.id && c.date === date && c.completed)) {
        completed += 1;
      }
    }
  }
  return { expected, completed };
}

export function buildPlanOverview(
  plan: PlanWithTasks,
  completions: TaskCompletion[],
): PlanOverview {
  const asOf = plan.endDate ?? todayDateOnly();
  const progress = calculateProgress({
    tasks: plan.tasks,
    completions,
    date: asOf,
    planStartDate: plan.startDate,
    planEndDate: plan.endDate,
  });

  const tasks: TaskOverviewRow[] = plan.tasks.map((task) => {
    const { expected, completed } = countExpectedForTask(
      task,
      completions,
      plan.startDate,
      asOf,
    );
    return {
      taskId: task.id,
      title: task.title,
      expected,
      completed,
      missed: Math.max(0, expected - completed),
    };
  });

  const successPercent = progress.planCompletionPercent;
  const motivationBucket =
    successPercent >= 80 ? 'great' : successPercent >= 50 ? 'solid' : 'restart';

  return { plan, successPercent, tasks, motivationBucket };
}

export function createGetPlanOverview(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getPlanOverview(planId: string): Promise<PlanOverview | null> {
    const plan = await planRepo.getById(planId);
    if (!plan) return null;
    const completions = await completionRepo.listByPlan(planId);
    return buildPlanOverview(plan, completions);
  };
}

export function createEnsurePlanSummaries(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
  planSummaryRepo: PlanSummaryRepository,
) {
  return async function ensurePlanSummaries(date = todayDateOnly()): Promise<PlanSummary[]> {
    const plans = await planRepo.list();
    for (const plan of plans) {
      if (!isPlanExpired(plan, date)) continue;
      const existing = await planSummaryRepo.getByPlanId(plan.id);
      if (existing) continue;
      const completions = await completionRepo.listByPlan(plan.id);
      const overview = buildPlanOverview(plan, completions);
      await planSummaryRepo.upsert({
        planId: plan.id,
        planName: plan.name,
        duration: plan.duration,
        startDate: plan.startDate,
        endDate: plan.endDate ?? plan.startDate,
        successPercent: overview.successPercent,
        finishedAt: new Date().toISOString(),
      });
    }
    return planSummaryRepo.list();
  };
}

export function createListPendingPlanOverviews(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function listPendingPlanOverviews(
    date = todayDateOnly(),
  ): Promise<PlanOverview[]> {
    const plans = await planRepo.list();
    const pending: PlanOverview[] = [];
    for (const plan of plans) {
      if (!isPlanExpired(plan, date)) continue;
      if (plan.overviewSeenAt) continue;
      const completions = await completionRepo.listByPlan(plan.id);
      pending.push(buildPlanOverview(plan, completions));
    }
    return pending;
  };
}
