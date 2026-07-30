import type { Achievement, AchievementType } from '../entities/Achievement';

export interface AchievementRepository {
  list(): Promise<Achievement[]>;
  unlock(type: AchievementType, unlockedAt: string): Promise<void>;
  isUnlocked(type: AchievementType): Promise<boolean>;
}
