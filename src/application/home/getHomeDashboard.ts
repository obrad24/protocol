import type { Task } from '../../domain/entities/Task';
import type { TaskCompletion } from '../../domain/entities/TaskCompletion';
import type { UserProfile } from '../../domain/entities/UserProfile';
import type { PlanWithTasks } from '../../domain/repositories/PlanRepository';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import {
  calculateProgress,
  isTaskDueOnDate,
  type ProgressSnapshot,
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

export type HomeDashboard = {
  profile: UserProfile;
  greetingName: string;
  date: string;
  activePlan: PlanWithTasks | null;
  progress: ProgressSnapshot | null;
  streak: number;
  todayTasks: HomeTaskItem[];
  weeklyBars: DayBar[];
};

function isCompleted(
  completions: TaskCompletion[],
  taskId: string,
  date: string,
): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date && c.completed);
}

export function createGetHomeDashboard(
  profileRepo: ProfileRepository,
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getHomeDashboard(
    date = todayDateOnly(),
  ): Promise<HomeDashboard> {
    const profile = await profileRepo.get();
    if (!profile) {
      throw new Error('Profil nije pronađen. Završi onboarding.');
    }
    const activePlan = await planRepo.getActive();

    if (!activePlan) {
      return {
        profile,
        greetingName: profile.displayName,
        date,
        activePlan: null,
        progress: null,
        streak: 0,
        todayTasks: [],
        weeklyBars: [],
      };
    }

    const completions = await completionRepo.listByPlan(activePlan.id);
    const progress = calculateProgress({
      tasks: activePlan.tasks,
      completions,
      date,
      planStartDate: activePlan.startDate,
      planEndDate: activePlan.endDate,
    });
    const streak = calculateStreak({
      tasks: activePlan.tasks,
      completions,
      date,
      planStartDate: activePlan.startDate,
    });

    const todayTasks: HomeTaskItem[] = activePlan.tasks
      .filter((t) => isTaskDueOnDate(t, date, completions))
      .map((task) => ({
        task,
        completed: isCompleted(completions, task.id, date),
      }));

    const week = getWeekRange(date);
    const weeklyBars = buildDayBars({
      tasks: activePlan.tasks,
      completions,
      from: week.start,
      to: week.end,
      planStartDate: activePlan.startDate,
      planEndDate: activePlan.endDate,
    });

    return {
      profile,
      greetingName: profile.displayName,
      date,
      activePlan,
      progress,
      streak,
      todayTasks,
      weeklyBars,
    };
  };
}
