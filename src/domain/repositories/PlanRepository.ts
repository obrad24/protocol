import type { Plan } from '../entities/Plan';
import type { Task } from '../entities/Task';

export type PlanWithTasks = Plan & { tasks: Task[] };

export interface PlanRepository {
  list(): Promise<PlanWithTasks[]>;
  getById(id: string): Promise<PlanWithTasks | null>;
  getActive(): Promise<PlanWithTasks | null>;
  save(plan: Plan, tasks: Task[]): Promise<void>;
  setActive(planId: string): Promise<void>;
  delete(planId: string): Promise<void>;
}
