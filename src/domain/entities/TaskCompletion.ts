export type TaskCompletion = {
  id: string;
  taskId: string;
  planId: string;
  /** Calendar day of completion (YYYY-MM-DD). */
  date: string;
  completed: boolean;
  /**
   * How many times the task was logged on this date.
   * Defaults to 1 when completed; used for same-day bonus over-plan.
   */
  count?: number;
  updatedAt: string;
};
