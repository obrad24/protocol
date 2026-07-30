import type { AchievementType } from '../entities/Achievement';
import type { PlanDuration } from '../entities/Plan';
import type { ProgressSnapshot } from './ProgressCalculator';

export type AchievementEvaluationInput = {
  progress: ProgressSnapshot;
  streak: number;
  /** Plan marked fully complete (100% over full plan period). */
  planFullyComplete: boolean;
  planDuration: PlanDuration | null;
  alreadyUnlocked: Set<AchievementType>;
};

/**
 * Returns achievement types that should newly unlock given current state.
 */
export function evaluateAchievements(
  input: AchievementEvaluationInput,
): AchievementType[] {
  const { progress, streak, planFullyComplete, planDuration, alreadyUnlocked } =
    input;
  const newly: AchievementType[] = [];

  const tryUnlock = (type: AchievementType, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(type)) {
      newly.push(type);
    }
  };

  tryUnlock('perfect_day', progress.dailyPercent === 100 && progress.dailyTotal > 0);
  tryUnlock('perfect_week', progress.weeklyPercent === 100);
  tryUnlock('perfect_month', progress.monthlyPercent === 100);
  tryUnlock('streak_3', streak >= 3);
  tryUnlock('streak_7', streak >= 7);
  tryUnlock('streak_30', streak >= 30);

  if (planFullyComplete && planDuration) {
    if (planDuration === 'weekly') {
      tryUnlock('plan_completed_weekly', true);
    } else if (planDuration === 'monthly') {
      tryUnlock('plan_completed_monthly', true);
    } else if (planDuration === 'multi_month') {
      tryUnlock('plan_completed_multi_month', true);
    }
  }

  return newly;
}
