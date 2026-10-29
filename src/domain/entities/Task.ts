import type { RecurrenceRule } from '../value-objects/RecurrenceRule';

export const TASK_DESCRIPTION_MAX_LENGTH = 250;

export type Task = {
  id: string;
  planId: string;
  title: string;
  /** Optional short description (max 250 chars). */
  description?: string;
  recurrence: RecurrenceRule;
  /**
   * When true, the task stays available after the period target is met
   * so the user can log bonus completions (e.g. 4/3).
   */
  allowOverPlan: boolean;
  sortOrder: number;
  createdAt: string;
};
