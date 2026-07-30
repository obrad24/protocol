import type { AchievementRepository } from '../../domain/repositories/AchievementRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import { calculateProgress } from '../../domain/policies/ProgressCalculator';
import { calculateStreak } from '../../domain/policies/StreakCalculator';
import { evaluateAchievements } from '../../domain/policies/AchievementEvaluator';
import { createId } from '../../shared/utils/id';
import { todayDateOnly } from '../../shared/utils/date';

export function createEvaluateAndUnlockAchievements(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
  achievementRepo: AchievementRepository,
) {
  return async function evaluateAndUnlockAchievements(
    planId: string,
    date = todayDateOnly(),
  ): Promise<void> {
    const plan = await planRepo.getById(planId);
    if (!plan) return;

    const completions = await completionRepo.listByPlan(plan.id);
    const progress = calculateProgress({
      tasks: plan.tasks,
      completions,
      date,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });

    // Full-period plan completion check
    const fullProgress = calculateProgress({
      tasks: plan.tasks,
      completions,
      date: plan.endDate,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });
    const planFullyComplete =
      date >= plan.endDate && fullProgress.planCompletionPercent === 100;

    const streak = calculateStreak({
      tasks: plan.tasks,
      completions,
      date,
      planStartDate: plan.startDate,
    });

    const existing = await achievementRepo.list();
    const alreadyUnlocked = new Set(
      existing.filter((a) => a.unlockedAt).map((a) => a.type),
    );

    const newly = evaluateAchievements({
      progress,
      streak,
      planFullyComplete,
      planDuration: plan.duration,
      alreadyUnlocked,
    });

    const unlockedAt = new Date().toISOString();
    for (const type of newly) {
      await achievementRepo.unlock(type, unlockedAt);
    }
  };
}

export function createToggleTaskCompletion(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
  evaluateAndUnlock: ReturnType<typeof createEvaluateAndUnlockAchievements>,
) {
  return async function toggleTaskCompletion(input: {
    planId: string;
    taskId: string;
    date?: string;
  }): Promise<{ completed: boolean }> {
    const date = input.date ?? todayDateOnly();
    const plan = await planRepo.getById(input.planId);
    if (!plan) {
      throw new Error('Plan nije pronađen.');
    }
    const task = plan.tasks.find((t) => t.id === input.taskId);
    if (!task) {
      throw new Error('Zadatak nije pronađen.');
    }

    const existing = await completionRepo.find(input.taskId, date);
    const nextCompleted = !(existing?.completed ?? false);
    const now = new Date().toISOString();

    await completionRepo.upsert({
      id: existing?.id ?? createId('completion'),
      taskId: input.taskId,
      planId: input.planId,
      date,
      completed: nextCompleted,
      updatedAt: now,
    });

    await evaluateAndUnlock(input.planId, date);
    return { completed: nextCompleted };
  };
}
