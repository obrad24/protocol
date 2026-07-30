import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
} from '../../domain/entities/Achievement';
import type { AchievementRepository } from '../../domain/repositories/AchievementRepository';

export type AchievementListItem = AchievementDefinition & {
  unlockedAt: string | null;
  unlocked: boolean;
};

export function createListAchievements(achievementRepo: AchievementRepository) {
  return async function listAchievements(): Promise<AchievementListItem[]> {
    const stored = await achievementRepo.list();
    const byType = new Map(stored.map((a) => [a.type, a]));

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const row = byType.get(def.type);
      const unlockedAt = row?.unlockedAt ?? null;
      return {
        ...def,
        unlockedAt,
        unlocked: Boolean(unlockedAt),
      };
    });
  };
}
