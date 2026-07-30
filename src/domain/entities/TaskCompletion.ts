export type TaskCompletion = {
  id: string;
  taskId: string;
  planId: string;
  /** Calendar day of completion (YYYY-MM-DD). */
  date: string;
  completed: boolean;
  updatedAt: string;
};
