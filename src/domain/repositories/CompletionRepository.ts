import type { TaskCompletion } from '../entities/TaskCompletion';

export interface CompletionRepository {
  listByPlan(planId: string): Promise<TaskCompletion[]>;
  listByPlanAndDateRange(
    planId: string,
    fromDate: string,
    toDate: string,
  ): Promise<TaskCompletion[]>;
  upsert(completion: TaskCompletion): Promise<void>;
  find(taskId: string, date: string): Promise<TaskCompletion | null>;
}
