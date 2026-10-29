import type { PlanSummary } from '../entities/PlanSummary';

export interface PlanSummaryRepository {
  list(): Promise<PlanSummary[]>;
  upsert(summary: PlanSummary): Promise<void>;
  getByPlanId(planId: string): Promise<PlanSummary | null>;
  deleteByPlanId(planId: string): Promise<void>;
}
