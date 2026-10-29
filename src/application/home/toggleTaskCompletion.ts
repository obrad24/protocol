import type { AchievementRepository } from '../../domain/repositories/AchievementRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { PlanSummaryRepository } from '../../domain/repositories/PlanSummaryRepository';
import {
  calculateProgress,
  getTaskPeriodProgress,
} from '../../domain/policies/ProgressCalculator';
import { calculateStreak } from '../../domain/policies/StreakCalculator';
import { evaluateAchievements } from '../../domain/policies/AchievementEvaluator';
import { createId } from '../../shared/utils/id';
import { todayDateOnly } from '../../shared/utils/date';
import { buildPlanOverview } from '../plans/planOverview';

export function createEvaluateAndUnlockAchievements(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
  achievementRepo: AchievementRepository,
  planSummaryRepo: PlanSummaryRepository,
) {
  return async function evaluateAndUnlockAchievements(
    planId: string,
    date = todayDateOnly(),
  ): Promise<void> {
    const plan = await planRepo.getById(planId);
    if (!plan) return;

    const active = await planRepo.getActive();
    const isActivePlan = active?.id === plan.id;

    const completions = await completionRepo.listByPlan(plan.id);
    const progress = calculateProgress({
      tasks: plan.tasks,
      completions,
      date,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });

    let planFullyComplete = false;

    // Unlimited plans never end — no plan-complete overview / summary.
    if (plan.endDate != null) {
      const fullProgress = calculateProgress({
        tasks: plan.tasks,
        completions,
        date: plan.endDate,
        planStartDate: plan.startDate,
        planEndDate: plan.endDate,
      });
      planFullyComplete =
        date >= plan.endDate && fullProgress.planCompletionPercent === 100;

      // Persist plan summary when period has ended (any success %)
      if (date > plan.endDate || date >= plan.endDate) {
        const overview = buildPlanOverview(plan, completions);
        if (date > plan.endDate || planFullyComplete || date === plan.endDate) {
          const existingSummary = await planSummaryRepo.getByPlanId(plan.id);
          if (!existingSummary && date > plan.endDate) {
            await planSummaryRepo.upsert({
              planId: plan.id,
              planName: plan.name,
              duration: plan.duration,
              startDate: plan.startDate,
              endDate: plan.endDate,
              successPercent: overview.successPercent,
              finishedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    const streak = isActivePlan
      ? calculateStreak({
          tasks: plan.tasks,
          completions,
          date,
          planStartDate: plan.startDate,
        })
      : 0;

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
      evaluateActivePlanAchievements: isActivePlan,
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
  syncDailyReminders?: () => Promise<void>,
) {
  return async function toggleTaskCompletion(input: {
    planId: string;
    taskId: string;
    date?: string;
    /**
     * When true, log one additional completion (over-plan bonus)
     * instead of flipping the day's checkbox.
     */
    addBonus?: boolean;
  }): Promise<{ completed: boolean; count: number }> {
    const date = input.date ?? todayDateOnly();
    const today = todayDateOnly();
    const yesterday = (() => {
      const [y, m, d] = today.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    })();

    if (date !== today && date !== yesterday) {
      throw new Error('Možeš mijenjati samo današnje ili jučerašnje zadatke.');
    }

    const plan = await planRepo.getById(input.planId);
    if (!plan) {
      throw new Error('Plan nije pronađen.');
    }
    const task = plan.tasks.find((t) => t.id === input.taskId);
    if (!task) {
      throw new Error('Zadatak nije pronađen.');
    }

    const existing = await completionRepo.find(input.taskId, date);
    const now = new Date().toISOString();

    if (input.addBonus) {
      if (!task.allowOverPlan) {
        throw new Error('Prekoračenje plana nije dozvoljeno za ovaj zadatak.');
      }

      const completions = await completionRepo.listByPlan(input.planId);
      const period = getTaskPeriodProgress(task, date, completions);
      if (!period || period.done < period.target) {
        throw new Error('Plan još nije ispunjen — koristi obično označiavanje.');
      }

      const currentCount =
        existing?.completed === true ? (existing.count ?? 1) : 0;
      const nextCount = currentCount + 1;

      await completionRepo.upsert({
        id: existing?.id ?? createId('completion'),
        taskId: input.taskId,
        planId: input.planId,
        date,
        completed: true,
        count: nextCount,
        updatedAt: now,
      });

      await evaluateAndUnlock(input.planId, date);
      await syncDailyReminders?.();
      return { completed: true, count: nextCount };
    }

    const nextCompleted = !(existing?.completed ?? false);

    await completionRepo.upsert({
      id: existing?.id ?? createId('completion'),
      taskId: input.taskId,
      planId: input.planId,
      date,
      completed: nextCompleted,
      count: nextCompleted ? 1 : undefined,
      updatedAt: now,
    });

    await evaluateAndUnlock(input.planId, date);
    await syncDailyReminders?.();
    return { completed: nextCompleted, count: nextCompleted ? 1 : 0 };
  };
}
