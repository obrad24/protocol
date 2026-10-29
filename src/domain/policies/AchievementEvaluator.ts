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
  /** When false, skip perfect day/week/month and streak unlocks. */
  evaluateActivePlanAchievements?: boolean;
};

function planCompletedType(duration: PlanDuration): AchievementType | null {
  switch (duration) {
    case 'weekly':
    case 'end_of_week':
      return 'plan_completed_weekly';
    case 'monthly':
    case 'end_of_month':
    case 'custom':
      return 'plan_completed_monthly';
    case 'multi_month':
      return 'plan_completed_multi_month';
    case 'unlimited':
      return null;
    default:
      return null;
  }
}

/**
 * Returns achievement types that should newly unlock given current state.
 * Perfect Day/Week/Month and Streak only unlock when evaluateActivePlanAchievements is true (default).
 */
export function evaluateAchievements(
  input: AchievementEvaluationInput,
): AchievementType[] {
  const {
    progress,
    streak,
    planFullyComplete,
    planDuration,
    alreadyUnlocked,
    evaluateActivePlanAchievements = true,
  } = input;
  const newly: AchievementType[] = [];

  const tryUnlock = (type: AchievementType, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(type)) {
      newly.push(type);
    }
  };

  if (evaluateActivePlanAchievements) {
    tryUnlock('perfect_day', progress.perfectDay);
    tryUnlock('perfect_week', progress.perfectWeek);
    tryUnlock('perfect_month', progress.perfectMonth);
    tryUnlock('streak_3', streak >= 3);
    tryUnlock('streak_7', streak >= 7);
    tryUnlock('streak_30', streak >= 30);
  }

  if (planFullyComplete && planDuration) {
    const type = planCompletedType(planDuration);
    if (type) {
      tryUnlock(type, true);
    }
  }

  return newly;
}
