import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import { calculateStreak } from './StreakCalculator';

const dailyTask = (id: string): Task => ({
  id,
  planId: 'plan-1',
  title: 'Daily',
  recurrence: { type: 'daily' },
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
});

function completion(taskId: string, date: string): TaskCompletion {
  return {
    id: `${taskId}-${date}`,
    taskId,
    planId: 'plan-1',
    date,
    completed: true,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe('StreakCalculator', () => {
  it('counts consecutive perfect days', () => {
    const tasks = [dailyTask('t1')];
    const completions = [
      completion('t1', '2026-07-26'),
      completion('t1', '2026-07-27'),
      completion('t1', '2026-07-28'),
    ];

    const streak = calculateStreak({
      tasks,
      completions,
      date: '2026-07-28',
      planStartDate: '2026-07-01',
    });

    assert.equal(streak, 3);
  });

  it('breaks streak on incomplete day', () => {
    const tasks = [dailyTask('t1')];
    const completions = [
      completion('t1', '2026-07-26'),
      // 27 missing
      completion('t1', '2026-07-28'),
    ];

    const streak = calculateStreak({
      tasks,
      completions,
      date: '2026-07-28',
      planStartDate: '2026-07-01',
    });

    assert.equal(streak, 1);
  });

  it('returns 0 when today is incomplete', () => {
    const tasks = [dailyTask('t1')];
    const streak = calculateStreak({
      tasks,
      completions: [],
      date: '2026-07-28',
      planStartDate: '2026-07-01',
    });
    assert.equal(streak, 0);
  });
});
