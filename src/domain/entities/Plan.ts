export type PlanDuration = 'weekly' | 'monthly' | 'multi_month';

export type Plan = {
  id: string;
  name: string;
  description: string;
  duration: PlanDuration;
  /** ISO date (YYYY-MM-DD) when the plan period starts. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) when the plan period ends (inclusive). */
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
