import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateAchievements } from './AchievementEvaluator';
import type { ProgressSnapshot } from './ProgressCalculator';

const baseProgress = (overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  dailyPercent: 0,
  weeklyPercent: 0,
  monthlyPercent: 0,
  planCompletionPercent: 0,
  dailyCompleted: 0,
  dailyTotal: 1,
  ...overrides,
});

describe('AchievementEvaluator', () => {
  it('unlocks perfect_day when daily is 100%', () => {
    const result = evaluateAchievements({
      progress: baseProgress({ dailyPercent: 100, dailyTotal: 2 }),
      streak: 0,
      planFullyComplete: false,
      planDuration: null,
      alreadyUnlocked: new Set(),
    });
    assert.ok(result.includes('perfect_day'));
  });

  it('does not re-unlock already unlocked medals', () => {
    const result = evaluateAchievements({
      progress: baseProgress({ dailyPercent: 100, dailyTotal: 1 }),
      streak: 3,
      planFullyComplete: false,
      planDuration: null,
      alreadyUnlocked: new Set(['perfect_day', 'streak_3']),
    });
    assert.equal(result.includes('perfect_day'), false);
    assert.equal(result.includes('streak_3'), false);
  });

  it('unlocks plan completion medal by duration', () => {
    const result = evaluateAchievements({
      progress: baseProgress({ planCompletionPercent: 100 }),
      streak: 0,
      planFullyComplete: true,
      planDuration: 'monthly',
      alreadyUnlocked: new Set(),
    });
    assert.ok(result.includes('plan_completed_monthly'));
    assert.equal(result.includes('plan_completed_weekly'), false);
  });

  it('unlocks streak medals by threshold', () => {
    const result = evaluateAchievements({
      progress: baseProgress({ dailyPercent: 100, dailyTotal: 1 }),
      streak: 7,
      planFullyComplete: false,
      planDuration: null,
      alreadyUnlocked: new Set(),
    });
    assert.ok(result.includes('streak_3'));
    assert.ok(result.includes('streak_7'));
    assert.equal(result.includes('streak_30'), false);
  });
});
