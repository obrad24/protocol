export type PlanDuration =
  | 'weekly'
  | 'monthly'
  | 'multi_month'
  | 'end_of_week'
  | 'end_of_month'
  | 'custom'
  | 'unlimited';

export type Plan = {
  id: string;
  name: string;
  description: string;
  duration: PlanDuration;
  /** ISO date (YYYY-MM-DD) when the plan period starts. */
  startDate: string;
  /**
   * ISO date (YYYY-MM-DD) when the plan period ends (inclusive).
   * `null` when duration is `unlimited` (no end date).
   */
  endDate: string | null;
  isActive: boolean;
  /** When the user dismissed the end-of-plan overview (ISO-8601), if any. */
  overviewSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isPlanExpired(plan: Pick<Plan, 'endDate'>, today: string): boolean {
  if (plan.endDate == null) return false;
  return today > plan.endDate;
}

export function isUnlimitedPlan(plan: Pick<Plan, 'duration' | 'endDate'>): boolean {
  return plan.duration === 'unlimited' || plan.endDate == null;
}

/** Max concurrently active (non-expired) plans. Same for all users (no Premium yet). */
export const MAX_ACTIVE_PLANS = 2;

/**
 * Active slots: only `isActive` plans that have not ended.
 * Finished / expired (and future paused/archived) do not count.
 */
export function countsTowardActiveLimit(
  plan: Pick<Plan, 'isActive' | 'endDate'>,
  today: string,
): boolean {
  return plan.isActive && !isPlanExpired(plan, today);
}
