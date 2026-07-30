import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import { calculateProgress, isTaskDueOnDate } from './ProgressCalculator';

const baseTask = (overrides: Partial<Task> & Pick<Task, 'id' | 'recurrence'>): Task => ({
  planId: 'plan-1',
  title: 'Task',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('ProgressCalculator', () => {
  it('marks daily tasks due every day', () => {
    const task = baseTask({ id: 't1', recurrence: { type: 'daily' } });
    assert.equal(isTaskDueOnDate(task, '2026-07-28', []), true);
  });

  it('respects weekday recurrence', () => {
    const task = baseTask({
      id: 't1',
      recurrence: { type: 'weekdays', days: [2, 4] }, // Tue, Thu
    });
    // 2026-07-28 is Tuesday
    assert.equal(isTaskDueOnDate(task, '2026-07-28', []), true);
    assert.equal(isTaskDueOnDate(task, '2026-07-29', []), false);
  });

  it('computes 100% daily when all due tasks completed', () => {
    const tasks = [
      baseTask({ id: 't1', recurrence: { type: 'daily' } }),
      baseTask({ id: 't2', recurrence: { type: 'daily' } }),
    ];
    const completions: TaskCompletion[] = [
      {
        id: 'c1',
        taskId: 't1',
        planId: 'plan-1',
        date: '2026-07-28',
        completed: true,
        updatedAt: '2026-07-28T10:00:00.000Z',
      },
      {
        id: 'c2',
        taskId: 't2',
        planId: 'plan-1',
        date: '2026-07-28',
        completed: true,
        updatedAt: '2026-07-28T10:00:00.000Z',
      },
    ];

    const progress = calculateProgress({
      tasks,
      completions,
      date: '2026-07-28',
      planStartDate: '2026-07-01',
      planEndDate: '2026-07-31',
    });

    assert.equal(progress.dailyTotal, 2);
    assert.equal(progress.dailyCompleted, 2);
    assert.equal(progress.dailyPercent, 100);
  });

  it('returns 0% daily when nothing completed', () => {
    const tasks = [baseTask({ id: 't1', recurrence: { type: 'daily' } })];
    const progress = calculateProgress({
      tasks,
      completions: [],
      date: '2026-07-28',
      planStartDate: '2026-07-01',
      planEndDate: '2026-07-31',
    });
    assert.equal(progress.dailyPercent, 0);
    assert.equal(progress.dailyTotal, 1);
  });
});
