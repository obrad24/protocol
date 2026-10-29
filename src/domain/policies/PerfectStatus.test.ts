import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import { isPerfectDay, isPerfectMonth, isPerfectWeek } from './PerfectStatus';

const task = (overrides: Partial<Task> & Pick<Task, 'id' | 'recurrence'>): Task => ({
  planId: 'plan-1',
  title: 'Task',
  allowOverPlan: false,
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

function done(taskId: string, date: string, count = 1): TaskCompletion {
  return {
    id: `${taskId}-${date}`,
    taskId,
    planId: 'plan-1',
    date,
    completed: true,
    count: count > 1 ? count : undefined,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe('PerfectStatus', () => {
  it('Perfect Day requires all daily tasks; ignores incomplete weekly', () => {
    const tasks = [
      task({ id: 'read', title: 'Čitanje', recurrence: { type: 'daily' } }),
      task({ id: 'med', title: 'Meditacija', recurrence: { type: 'daily' } }),
      task({
        id: 'run',
        title: 'Trčanje',
        recurrence: { type: 'weekly_count', timesPerWeek: 3 },
      }),
    ];
    const completions = [done('read', '2026-07-28'), done('med', '2026-07-28')];
    // weekly not done today — still Perfect Day
    assert.equal(isPerfectDay(tasks, completions, '2026-07-28'), true);
  });

  it('Perfect Day fails when one daily is missing', () => {
    const tasks = [
      task({ id: 'read', recurrence: { type: 'daily' } }),
      task({ id: 'med', recurrence: { type: 'daily' } }),
    ];
    assert.equal(isPerfectDay(tasks, [done('read', '2026-07-28')], '2026-07-28'), false);
  });

  it('Perfect Day is false when there are no daily tasks', () => {
    const tasks = [
      task({ id: 'run', recurrence: { type: 'weekly_count', timesPerWeek: 3 } }),
    ];
    assert.equal(isPerfectDay(tasks, [done('run', '2026-07-28')], '2026-07-28'), false);
  });

  it('Perfect Week is met when weekly target reached regardless of which days', () => {
    const tasks = [
      task({ id: 'run', recurrence: { type: 'weekly_count', timesPerWeek: 3 } }),
    ];
    // Tue=28, Thu=30, Sun=Aug 2 2026 (week Mon 27 – Sun 2)
    const completions = [
      done('run', '2026-07-28'),
      done('run', '2026-07-30'),
      done('run', '2026-08-02'),
    ];
    assert.equal(isPerfectWeek(tasks, completions, '2026-08-02'), true);
  });

  it('Perfect Week fails when weekly target not met', () => {
    const tasks = [
      task({ id: 'run', recurrence: { type: 'weekly_count', timesPerWeek: 3 } }),
    ];
    const completions = [done('run', '2026-07-28'), done('run', '2026-07-30')];
    assert.equal(isPerfectWeek(tasks, completions, '2026-08-02'), false);
  });

  it('Perfect Week still true when over-plan exceeds target', () => {
    const tasks = [
      task({
        id: 'run',
        recurrence: { type: 'weekly_count', timesPerWeek: 3 },
        allowOverPlan: true,
      }),
    ];
    const completions = [
      done('run', '2026-07-27'),
      done('run', '2026-07-28'),
      done('run', '2026-07-29', 2), // 4 total
    ];
    assert.equal(isPerfectWeek(tasks, completions, '2026-07-29'), true);
  });

  it('monthly tasks do not block Perfect Day or Perfect Week', () => {
    const tasks = [
      task({ id: 'read', recurrence: { type: 'daily' } }),
      task({ id: 'run', recurrence: { type: 'weekly_count', timesPerWeek: 1 } }),
      task({ id: 'gym', recurrence: { type: 'monthly_count', timesPerMonth: 8 } }),
    ];
    const completions = [done('read', '2026-07-27'), done('run', '2026-07-27')];
    assert.equal(isPerfectDay(tasks, completions, '2026-07-27'), true);
    // Weekly-only plan (no dailies) + unmet monthly still allows Perfect Week
    const weeklyOnly = tasks.filter((t) => t.id !== 'read');
    assert.equal(isPerfectWeek(weeklyOnly, completions, '2026-07-27'), true);
    assert.equal(isPerfectMonth(tasks, completions, '2026-07-27'), false);
  });
});
