import {
  countsTowardActiveLimit,
  MAX_ACTIVE_PLANS,
  type Plan,
} from '../../domain/entities/Plan';
import type { Task } from '../../domain/entities/Task';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import { todayDateOnly } from '../../shared/utils/date';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

type PlansState = {
  plans: Plan[];
  tasksByPlanId: Record<string, Task[]>;
};

async function readState(store: KeyValueStore): Promise<PlansState> {
  const raw = await store.getItem(STORAGE_KEYS.plans);
  if (!raw) return { plans: [], tasksByPlanId: {} };
  return JSON.parse(raw) as PlansState;
}

async function writeState(store: KeyValueStore, state: PlansState): Promise<void> {
  await store.setItem(STORAGE_KEYS.plans, JSON.stringify(state));
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    allowOverPlan: task.allowOverPlan === true,
  };
}

function normalizePlan(plan: Plan): Plan {
  if (plan.duration === 'unlimited') {
    return { ...plan, endDate: null };
  }
  // Existing plans keep their endDate unchanged.
  return plan;
}

function toWithTasks(plan: Plan, tasks: Task[]): PlanWithTasks {
  const normalized = normalizePlan(plan);
  return {
    ...normalized,
    tasks: [...tasks].map(normalizeTask).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function createAsyncPlanRepository(store: KeyValueStore): PlanRepository {
  return {
    async list(): Promise<PlanWithTasks[]> {
      const state = await readState(store);
      return state.plans.map((p) => toWithTasks(p, state.tasksByPlanId[p.id] ?? []));
    },

    async getById(id: string): Promise<PlanWithTasks | null> {
      const state = await readState(store);
      const plan = state.plans.find((p) => p.id === id);
      if (!plan) return null;
      return toWithTasks(plan, state.tasksByPlanId[plan.id] ?? []);
    },

    async listActive(): Promise<PlanWithTasks[]> {
      const state = await readState(store);
      const today = todayDateOnly();
      return state.plans
        .filter((p) => countsTowardActiveLimit(p, today))
        .map((p) => toWithTasks(p, state.tasksByPlanId[p.id] ?? []));
    },

    async getActive(): Promise<PlanWithTasks | null> {
      const state = await readState(store);
      const today = todayDateOnly();
      const plan = state.plans.find((p) => countsTowardActiveLimit(p, today));
      if (!plan) return null;
      return toWithTasks(plan, state.tasksByPlanId[plan.id] ?? []);
    },

    async save(plan: Plan, tasks: Task[]): Promise<void> {
      const state = await readState(store);
      const index = state.plans.findIndex((p) => p.id === plan.id);
      if (index >= 0) {
        state.plans[index] = plan;
      } else {
        state.plans.push(plan);
      }
      state.tasksByPlanId[plan.id] = tasks;
      await writeState(store, state);
    },

    async setActive(planId: string): Promise<void> {
      const state = await readState(store);
      const target = state.plans.find((p) => p.id === planId);
      if (!target) {
        throw new Error(`Plan not found: ${planId}`);
      }
      const today = todayDateOnly();
      if (countsTowardActiveLimit(target, today)) {
        return; // already active in a counted slot
      }
      const activeCount = state.plans.filter((p) =>
        countsTowardActiveLimit(p, today),
      ).length;
      if (activeCount >= MAX_ACTIVE_PLANS) {
        throw new Error('ACTIVE_PLAN_LIMIT');
      }
      const now = new Date().toISOString();
      state.plans = state.plans.map((p) =>
        p.id === planId ? { ...p, isActive: true, updatedAt: now } : p,
      );
      await writeState(store, state);
    },

    async deactivate(planId: string): Promise<void> {
      const state = await readState(store);
      const exists = state.plans.some((p) => p.id === planId);
      if (!exists) {
        throw new Error(`Plan not found: ${planId}`);
      }
      const now = new Date().toISOString();
      state.plans = state.plans.map((p) =>
        p.id === planId ? { ...p, isActive: false, updatedAt: now } : p,
      );
      await writeState(store, state);
    },

    async delete(planId: string): Promise<void> {
      const state = await readState(store);
      state.plans = state.plans.filter((p) => p.id !== planId);
      delete state.tasksByPlanId[planId];
      await writeState(store, state);
    },
  };
}
