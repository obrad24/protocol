import type { PlanSummary } from '../../domain/entities/PlanSummary';
import type { PlanSummaryRepository } from '../../domain/repositories/PlanSummaryRepository';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

async function readAll(store: KeyValueStore): Promise<PlanSummary[]> {
  const raw = await store.getItem(STORAGE_KEYS.planSummaries);
  if (!raw) return [];
  return JSON.parse(raw) as PlanSummary[];
}

async function writeAll(store: KeyValueStore, items: PlanSummary[]): Promise<void> {
  await store.setItem(STORAGE_KEYS.planSummaries, JSON.stringify(items));
}

export function createAsyncPlanSummaryRepository(store: KeyValueStore): PlanSummaryRepository {
  return {
    async list(): Promise<PlanSummary[]> {
      const all = await readAll(store);
      return [...all].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    },

    async upsert(summary: PlanSummary): Promise<void> {
      const all = await readAll(store);
      const index = all.findIndex((s) => s.planId === summary.planId);
      if (index >= 0) {
        all[index] = summary;
      } else {
        all.push(summary);
      }
      await writeAll(store, all);
    },

    async getByPlanId(planId: string): Promise<PlanSummary | null> {
      const all = await readAll(store);
      return all.find((s) => s.planId === planId) ?? null;
    },

    async deleteByPlanId(planId: string): Promise<void> {
      const all = await readAll(store);
      await writeAll(
        store,
        all.filter((s) => s.planId !== planId),
      );
    },
  };
}
