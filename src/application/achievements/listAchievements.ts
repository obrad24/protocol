import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
} from '../../domain/entities/Achievement';
import type { PlanSummary } from '../../domain/entities/PlanSummary';
import type { AchievementRepository } from '../../domain/repositories/AchievementRepository';
import type { PlanSummaryRepository } from '../../domain/repositories/PlanSummaryRepository';

export type AchievementListItem = AchievementDefinition & {
  unlockedAt: string | null;
  unlocked: boolean;
};

export type AchievementsDashboard = {
  medals: AchievementListItem[];
  planSummaries: PlanSummary[];
};

export function createListAchievements(
  achievementRepo: AchievementRepository,
  planSummaryRepo: PlanSummaryRepository,
) {
  return async function listAchievements(): Promise<AchievementsDashboard> {
    const stored = await achievementRepo.list();
    const byType = new Map(stored.map((a) => [a.type, a]));

    const medals = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const row = byType.get(def.type);
      const unlockedAt = row?.unlockedAt ?? null;
      return {
        ...def,
        unlockedAt,
        unlocked: Boolean(unlockedAt),
      };
    });

    const planSummaries = await planSummaryRepo.list();
    return { medals, planSummaries };
  };
}
