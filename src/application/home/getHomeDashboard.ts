import type { Task } from '../../domain/entities/Task';
import type { TaskCompletion } from '../../domain/entities/TaskCompletion';
import type { UserProfile } from '../../domain/entities/UserProfile';
import type { PlanWithTasks } from '../../domain/repositories/PlanRepository';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import {
  calculateProgress,
  getTaskPeriodProgress,
  isTaskActiveOnDate,
  shouldShowInPlanFulfilledSection,
  type ProgressSnapshot,
  type TaskPeriodProgress,
} from '../../domain/policies/ProgressCalculator';
import { calculateStreak } from '../../domain/policies/StreakCalculator';
import {
  buildDayBars,
  type DayBar,
} from '../../domain/policies/AnalyticsCalculator';
import { getWeekRange, todayDateOnly } from '../../shared/utils/date';

export type HomeTaskItem = {
  task: Task;
  completed: boolean;
};

export type HomeFulfilledTaskItem = {
  task: Task;
  completedToday: boolean;
  period: TaskPeriodProgress;
};

/** Lightweight card data for each concurrently active plan. */
export type HomeActivePlanSummary = {
  id: string;
  name: string;
  description: string;
  planCompletionPercent: number;
  dailyPercent: number;
  streak: number;
};

export type HomeDashboard = {
  profile: UserProfile;
  greetingName: string;
  date: string;
  /** All active (non-expired) plans for the hub switcher. */
  activePlans: HomeActivePlanSummary[];
  /** Selected active plan — all tasks/progress below are scoped to this plan only. */
  activePlan: PlanWithTasks | null;
  progress: ProgressSnapshot | null;
  streak: number;
  todayTasks: HomeTaskItem[];
  planFulfilledTasks: HomeFulfilledTaskItem[];
  weeklyBars: DayBar[];
};

function isCompleted(
  completions: TaskCompletion[],
  taskId: string,
  date: string,
): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date && c.completed);
}

async function buildPlanSummary(
  plan: PlanWithTasks,
  completionRepo: CompletionRepository,
  date: string,
): Promise<HomeActivePlanSummary> {
  const completions = await completionRepo.listByPlan(plan.id);
  const progress = calculateProgress({
    tasks: plan.tasks,
    completions,
    date,
    planStartDate: plan.startDate,
    planEndDate: plan.endDate,
  });
  const streak = calculateStreak({
    tasks: plan.tasks,
    completions,
    date,
    planStartDate: plan.startDate,
  });
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    planCompletionPercent: progress.planCompletionPercent,
    dailyPercent: progress.dailyPercent,
    streak,
  };
}

export function createGetHomeDashboard(
  profileRepo: ProfileRepository,
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getHomeDashboard(
    planId?: string | null,
    date = todayDateOnly(),
  ): Promise<HomeDashboard> {
    const profile = await profileRepo.get();
    if (!profile) {
      throw new Error('Profil nije pronađen. Završi onboarding.');
    }

    const activeList = await planRepo.listActive();
    const activePlans = await Promise.all(
      activeList.map((plan) => buildPlanSummary(plan, completionRepo, date)),
    );

    const selected =
      (planId ? activeList.find((p) => p.id === planId) : undefined) ??
      activeList[0] ??
      null;

    if (!selected) {
      return {
        profile,
        greetingName: profile.displayName,
        date,
        activePlans: [],
        activePlan: null,
        progress: null,
        streak: 0,
        todayTasks: [],
        planFulfilledTasks: [],
        weeklyBars: [],
      };
    }

    const completions = await completionRepo.listByPlan(selected.id);
    const progress = calculateProgress({
      tasks: selected.tasks,
      completions,
      date,
      planStartDate: selected.startDate,
      planEndDate: selected.endDate,
    });
    const streak = calculateStreak({
      tasks: selected.tasks,
      completions,
      date,
      planStartDate: selected.startDate,
    });

    const todayTasks: HomeTaskItem[] = selected.tasks
      .filter((t) => isTaskActiveOnDate(t, date, completions))
      .map((task) => ({
        task,
        completed: isCompleted(completions, task.id, date),
      }));

    const planFulfilledTasks: HomeFulfilledTaskItem[] = selected.tasks
      .filter((t) => shouldShowInPlanFulfilledSection(t, date, completions))
      .map((task) => {
        const period = getTaskPeriodProgress(task, date, completions)!;
        return {
          task,
          completedToday: isCompleted(completions, task.id, date),
          period,
        };
      });

    const week = getWeekRange(date);
    const weeklyBars = buildDayBars({
      tasks: selected.tasks,
      completions,
      from: week.start,
      to: week.end,
      planStartDate: selected.startDate,
      planEndDate: selected.endDate,
    });

    return {
      profile,
      greetingName: profile.displayName,
      date,
      activePlans,
      activePlan: selected,
      progress,
      streak,
      todayTasks,
      planFulfilledTasks,
      weeklyBars,
    };
  };
}
