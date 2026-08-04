import { createListAchievements } from '../../application/achievements/listAchievements';
import { createGetHomeDashboard } from '../../application/home/getHomeDashboard';
import {
  createEvaluateAndUnlockAchievements,
  createToggleTaskCompletion,
} from '../../application/home/toggleTaskCompletion';
import { createCreatePlan, createSetActivePlan } from '../../application/plans/createPlan';
import { createListPlans } from '../../application/plans/listPlans';
import {
  createCompleteOnboarding,
  createGetProfile,
  createUpdateProfile,
} from '../../application/profile/profileUseCases';
import { createGetStatsDashboard } from '../../application/stats/getStatsDashboard';
import { createAsyncAchievementRepository } from '../repositories/AsyncAchievementRepository';
import { createAsyncCompletionRepository } from '../repositories/AsyncCompletionRepository';
import { createAsyncPlanRepository } from '../repositories/AsyncPlanRepository';
import { createAsyncProfileRepository } from '../repositories/AsyncProfileRepository';
import { asyncStorageStore } from '../storage/asyncStorageStore';
import type { KeyValueStore } from '../storage/KeyValueStore';

export type AppContainer = ReturnType<typeof createAppContainer>;

export function createAppContainer(store: KeyValueStore = asyncStorageStore) {
  const profileRepo = createAsyncProfileRepository(store);
  const planRepo = createAsyncPlanRepository(store);
  const completionRepo = createAsyncCompletionRepository(store);
  const achievementRepo = createAsyncAchievementRepository(store);

  const evaluateAndUnlockAchievements = createEvaluateAndUnlockAchievements(
    planRepo,
    completionRepo,
    achievementRepo,
  );

  return {
    repos: {
      profile: profileRepo,
      plan: planRepo,
      completion: completionRepo,
      achievement: achievementRepo,
    },
    useCases: {
      getProfile: createGetProfile(profileRepo),
      completeOnboarding: createCompleteOnboarding(profileRepo),
      updateProfile: createUpdateProfile(profileRepo),
      createPlan: createCreatePlan(planRepo),
      listPlans: createListPlans(planRepo, completionRepo),
      setActivePlan: createSetActivePlan(planRepo),
      getHomeDashboard: createGetHomeDashboard(profileRepo, planRepo, completionRepo),
      toggleTaskCompletion: createToggleTaskCompletion(
        planRepo,
        completionRepo,
        evaluateAndUnlockAchievements,
      ),
      listAchievements: createListAchievements(achievementRepo),
      getStatsDashboard: createGetStatsDashboard(planRepo, completionRepo),
      evaluateAndUnlockAchievements,
    },
  };
}

/** Singleton for the running app. */
export const appContainer = createAppContainer();
