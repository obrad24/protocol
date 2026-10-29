import type { PlanDuration } from './Plan';

/** Snapshot of a finished plan for Achievements / re-entry overview. */
export type PlanSummary = {
  planId: string;
  planName: string;
  duration: PlanDuration;
  startDate: string;
  endDate: string;
  successPercent: number;
  finishedAt: string; // ISO-8601
};
