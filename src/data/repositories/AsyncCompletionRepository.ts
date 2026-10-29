import type { TaskCompletion } from '../../domain/entities/TaskCompletion';
import type { CompletionRepository } from '../../domain/repositories/CompletionRepository';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

async function readAll(store: KeyValueStore): Promise<TaskCompletion[]> {
  const raw = await store.getItem(STORAGE_KEYS.completions);
  if (!raw) return [];
  return JSON.parse(raw) as TaskCompletion[];
}

async function writeAll(store: KeyValueStore, items: TaskCompletion[]): Promise<void> {
  await store.setItem(STORAGE_KEYS.completions, JSON.stringify(items));
}

export function createAsyncCompletionRepository(store: KeyValueStore): CompletionRepository {
  return {
    async listByPlan(planId: string): Promise<TaskCompletion[]> {
      const all = await readAll(store);
      return all.filter((c) => c.planId === planId);
    },

    async listByPlanAndDateRange(
      planId: string,
      fromDate: string,
      toDate: string,
    ): Promise<TaskCompletion[]> {
      const all = await readAll(store);
      return all.filter(
        (c) => c.planId === planId && c.date >= fromDate && c.date <= toDate,
      );
    },

    async upsert(completion: TaskCompletion): Promise<void> {
      const all = await readAll(store);
      const index = all.findIndex(
        (c) => c.taskId === completion.taskId && c.date === completion.date,
      );
      if (index >= 0) {
        all[index] = completion;
      } else {
        all.push(completion);
      }
      await writeAll(store, all);
    },

    async find(taskId: string, date: string): Promise<TaskCompletion | null> {
      const all = await readAll(store);
      return all.find((c) => c.taskId === taskId && c.date === date) ?? null;
    },

    async deleteByPlan(planId: string): Promise<void> {
      const all = await readAll(store);
      await writeAll(
        store,
        all.filter((c) => c.planId !== planId),
      );
    },
  };
}
