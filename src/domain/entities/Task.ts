import type { RecurrenceRule } from '../value-objects/RecurrenceRule';

export type Task = {
  id: string;
  planId: string;
  title: string;
  recurrence: RecurrenceRule;
  sortOrder: number;
  createdAt: string;
};
