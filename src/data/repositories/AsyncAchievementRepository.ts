import {
  ACHIEVEMENT_DEFINITIONS,
  type Achievement,
  type AchievementType,
} from '../../domain/entities/Achievement';
import type { AchievementRepository } from '../../domain/repositories/AchievementRepository';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

function defaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((d) => ({
    type: d.type,
    unlockedAt: null,
  }));
}

async function readAll(store: KeyValueStore): Promise<Achievement[]> {
  const raw = await store.getItem(STORAGE_KEYS.achievements);
  if (!raw) {
    const defaults = defaultAchievements();
    await store.setItem(STORAGE_KEYS.achievements, JSON.stringify(defaults));
    return defaults;
  }
  const stored = JSON.parse(raw) as Achievement[];
  // Ensure new definition types appear if app updates
  const byType = new Map(stored.map((a) => [a.type, a]));
  return ACHIEVEMENT_DEFINITIONS.map(
    (d) => byType.get(d.type) ?? { type: d.type, unlockedAt: null },
  );
}

async function writeAll(store: KeyValueStore, items: Achievement[]): Promise<void> {
  await store.setItem(STORAGE_KEYS.achievements, JSON.stringify(items));
}

export function createAsyncAchievementRepository(
  store: KeyValueStore,
): AchievementRepository {
  return {
    async list(): Promise<Achievement[]> {
      return readAll(store);
    },

    async unlock(type: AchievementType, unlockedAt: string): Promise<void> {
      const all = await readAll(store);
      const next = all.map((a) =>
        a.type === type && a.unlockedAt === null ? { ...a, unlockedAt } : a,
      );
      await writeAll(store, next);
    },

    async isUnlocked(type: AchievementType): Promise<boolean> {
      const all = await readAll(store);
      const item = all.find((a) => a.type === type);
      return Boolean(item?.unlockedAt);
    },
  };
}
