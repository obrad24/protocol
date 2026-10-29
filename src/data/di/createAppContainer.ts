import { createListAchievements } from '../../application/achievements/listAchievements';
import { createGetHomeDashboard } from '../../application/home/getHomeDashboard';
import {
  createEvaluateAndUnlockAchievements,
  createToggleTaskCompletion,
} from '../../application/home/toggleTaskCompletion';
import {
  createGetPendingPeriodOverviews,
  createMarkPeriodOverviewSeen,
} from '../../application/home/periodOverview';
import { createGetYesterdayReview } from '../../application/home/yesterdayReview';
import {
  createCreatePlan,
  createDeactivatePlan,
  createSetActivePlan,
} from '../../application/plans/createPlan';
import { createListPlans } from '../../application/plans/listPlans';
import {
  createDeletePlan,
  createGetPlan,
  createMarkPlanOverviewSeen,
  createUpdatePlan,
} from '../../application/plans/updatePlan';
import {
  createEnsurePlanSummaries,
  createGetPlanOverview,
  createListPendingPlanOverviews,
} from '../../application/plans/planOverview';
import {
  createCompleteOnboarding,
  createGetProfile,
  createUpdateProfile,
} from '../../application/profile/profileUseCases';
import { createUpdateSettings } from '../../application/profile/settingsUseCases';
import { createGetDailyReminderProgress } from '../../application/notifications/getDailyReminderProgress';
import { createSyncDailyReminders } from '../../application/notifications/syncDailyReminders';
import { createGetStatsDashboard } from '../../application/stats/getStatsDashboard';
import { createAsyncAchievementRepository } from '../repositories/AsyncAchievementRepository';
import { createAsyncCompletionRepository } from '../repositories/AsyncCompletionRepository';
import { createAsyncPlanRepository } from '../repositories/AsyncPlanRepository';
import { createAsyncPlanSummaryRepository } from '../repositories/AsyncPlanSummaryRepository';
import { createAsyncProfileRepository } from '../repositories/AsyncProfileRepository';
import { asyncStorageStore } from '../storage/asyncStorageStore';
import type { KeyValueStore } from '../storage/KeyValueStore';

export type AppContainer = ReturnType<typeof createAppContainer>;

export function createAppContainer(store: KeyValueStore = asyncStorageStore) {
  const profileRepo = createAsyncProfileRepository(store);
  const planRepo = createAsyncPlanRepository(store);
  const completionRepo = createAsyncCompletionRepository(store);
  const achievementRepo = createAsyncAchievementRepository(store);
  const planSummaryRepo = createAsyncPlanSummaryRepository(store);

  const evaluateAndUnlockAchievements = createEvaluateAndUnlockAchievements(
    planRepo,
    completionRepo,
    achievementRepo,
    planSummaryRepo,
  );
  const getDailyReminderProgress = createGetDailyReminderProgress(planRepo, completionRepo);
  const syncDailyReminders = createSyncDailyReminders(profileRepo, getDailyReminderProgress);

  return {
    repos: {
      profile: profileRepo,
      plan: planRepo,
      completion: completionRepo,
      achievement: achievementRepo,
      planSummary: planSummaryRepo,
    },
    useCases: {
      getProfile: createGetProfile(profileRepo),
      completeOnboarding: createCompleteOnboarding(profileRepo),
      updateProfile: createUpdateProfile(profileRepo),
      updateSettings: createUpdateSettings(profileRepo),
      createPlan: createCreatePlan(planRepo),
      updatePlan: createUpdatePlan(planRepo, completionRepo),
      deletePlan: createDeletePlan(planRepo, completionRepo, planSummaryRepo),
      getPlan: createGetPlan(planRepo),
      listPlans: createListPlans(planRepo, completionRepo),
      setActivePlan: createSetActivePlan(planRepo),
      deactivatePlan: createDeactivatePlan(planRepo),
      getPlanOverview: createGetPlanOverview(planRepo, completionRepo),
      listPendingPlanOverviews: createListPendingPlanOverviews(planRepo, completionRepo),
      markPlanOverviewSeen: createMarkPlanOverviewSeen(planRepo),
      ensurePlanSummaries: createEnsurePlanSummaries(
        planRepo,
        completionRepo,
        planSummaryRepo,
      ),
      getHomeDashboard: createGetHomeDashboard(profileRepo, planRepo, completionRepo),
      getYesterdayReview: createGetYesterdayReview(planRepo, completionRepo),
      getPendingPeriodOverviews: createGetPendingPeriodOverviews(
        profileRepo,
        planRepo,
        completionRepo,
      ),
      markPeriodOverviewSeen: createMarkPeriodOverviewSeen(profileRepo),
      toggleTaskCompletion: createToggleTaskCompletion(
        planRepo,
        completionRepo,
        evaluateAndUnlockAchievements,
        syncDailyReminders,
      ),
      listAchievements: createListAchievements(achievementRepo, planSummaryRepo),
      getStatsDashboard: createGetStatsDashboard(planRepo, completionRepo),
      getDailyReminderProgress,
      syncDailyReminders,
      evaluateAndUnlockAchievements,
    },
  };
}

/** Singleton for the running app. */
export const appContainer = createAppContainer();
