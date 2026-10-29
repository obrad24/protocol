import type { Plan } from '../entities/Plan';
import type { Task } from '../entities/Task';

export type PlanWithTasks = Plan & { tasks: Task[] };

export interface PlanRepository {
  list(): Promise<PlanWithTasks[]>;
  getById(id: string): Promise<PlanWithTasks | null>;
  /** First active non-expired plan (Home compatibility). */
  getActive(): Promise<PlanWithTasks | null>;
  /** All active non-expired plans (up to MAX_ACTIVE_PLANS). */
  listActive(): Promise<PlanWithTasks[]>;
  save(plan: Plan, tasks: Task[]): Promise<void>;
  /** Activate without deactivating others; enforces MAX_ACTIVE_PLANS. */
  setActive(planId: string): Promise<void>;
  deactivate(planId: string): Promise<void>;
  delete(planId: string): Promise<void>;
}
