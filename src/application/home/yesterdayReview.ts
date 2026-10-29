import type { Task } from '../../domain/entities/Task';
import type { TaskCompletion } from '../../domain/entities/TaskCompletion';
import type { PlanRepository } from '../../domain/repositories/PlanRepository';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import {
  calculateProgress,
  isTaskDueOnDate,
} from '../../domain/policies/ProgressCalculator';
import { addDays, todayDateOnly } from '../../shared/utils/date';

export type YesterdayTaskItem = {
  task: Task;
  completed: boolean;
};

export type YesterdayReview = {
  date: string;
  percent: number;
  completedCount: number;
  totalCount: number;
  tasks: YesterdayTaskItem[];
  available: boolean;
};

function isCompleted(
  completions: TaskCompletion[],
  taskId: string,
  date: string,
): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date && c.completed);
}

export function createGetYesterdayReview(
  planRepo: PlanRepository,
  completionRepo: CompletionRepository,
) {
  return async function getYesterdayReview(
    planId?: string | null,
    today = todayDateOnly(),
  ): Promise<YesterdayReview | null> {
    const yesterday = addDays(today, -1);
    const activeList = await planRepo.listActive();
    const activePlan =
      (planId ? activeList.find((p) => p.id === planId) : undefined) ??
      activeList[0] ??
      null;

    if (!activePlan) return null;
    if (
      yesterday < activePlan.startDate ||
      (activePlan.endDate != null && yesterday > activePlan.endDate)
    ) {
      return {
        date: yesterday,
        percent: 0,
        completedCount: 0,
        totalCount: 0,
        tasks: [],
        available: false,
      };
    }

    const completions = await completionRepo.listByPlan(activePlan.id);
    const progress = calculateProgress({
      tasks: activePlan.tasks,
      completions,
      date: yesterday,
      planStartDate: activePlan.startDate,
      planEndDate: activePlan.endDate,
    });

    const tasks: YesterdayTaskItem[] = activePlan.tasks
      .filter((t) => isTaskDueOnDate(t, yesterday, completions))
      .map((task) => ({
        task,
        completed: isCompleted(completions, task.id, yesterday),
      }));

    return {
      date: yesterday,
      percent: progress.dailyPercent,
      completedCount: progress.dailyCompleted,
      totalCount: progress.dailyTotal,
      tasks,
      available: true,
    };
  };
}
