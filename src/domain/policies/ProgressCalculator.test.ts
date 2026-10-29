import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Task } from '../entities/Task';
import type { TaskCompletion } from '../entities/TaskCompletion';
import {
  calculateProgress,
  getTaskPeriodProgress,
  isTaskActiveOnDate,
  isTaskDueOnDate,
  shouldShowInPlanFulfilledSection,
} from './ProgressCalculator';

const baseTask = (overrides: Partial<Task> & Pick<Task, 'id' | 'recurrence'>): Task => ({
  planId: 'plan-1',
  title: 'Task',
  allowOverPlan: false,
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

  it('tracks weekly_count period progress with original target', () => {
    const task = baseTask({
      id: 'run',
      recurrence: { type: 'weekly_count', timesPerWeek: 3 },
      allowOverPlan: true,
    });
    const completions: TaskCompletion[] = [
      {
        id: 'c1',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-27',
        completed: true,
        updatedAt: '2026-07-27T10:00:00.000Z',
      },
      {
        id: 'c2',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-28',
        completed: true,
        count: 2,
        updatedAt: '2026-07-28T10:00:00.000Z',
      },
    ];
    // 2026-07-28 is Tuesday; week Mon 27 – Sun 2 Aug
    const period = getTaskPeriodProgress(task, '2026-07-28', completions);
    assert.ok(period);
    assert.equal(period!.done, 3);
    assert.equal(period!.target, 3);
    assert.equal(period!.bonus, 0);
    assert.equal(period!.fulfilled, true);
    assert.equal(shouldShowInPlanFulfilledSection(task, '2026-07-28', completions), true);
    assert.equal(isTaskActiveOnDate(task, '2026-07-28', completions), false);
  });

  it('keeps original target when bonus exceeds plan', () => {
    const task = baseTask({
      id: 'run',
      recurrence: { type: 'weekly_count', timesPerWeek: 3 },
      allowOverPlan: true,
    });
    const completions: TaskCompletion[] = [
      {
        id: 'c1',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-27',
        completed: true,
        updatedAt: '2026-07-27T10:00:00.000Z',
      },
      {
        id: 'c2',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-28',
        completed: true,
        updatedAt: '2026-07-28T10:00:00.000Z',
      },
      {
        id: 'c3',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-29',
        completed: true,
        count: 2,
        updatedAt: '2026-07-29T10:00:00.000Z',
      },
    ];
    const period = getTaskPeriodProgress(task, '2026-07-29', completions);
    assert.ok(period);
    assert.equal(period!.done, 4);
    assert.equal(period!.target, 3);
    assert.equal(period!.bonus, 1);
  });

  it('hides fulfilled weekly task when over-plan is off', () => {
    const task = baseTask({
      id: 'run',
      recurrence: { type: 'weekly_count', timesPerWeek: 2 },
      allowOverPlan: false,
    });
    const completions: TaskCompletion[] = [
      {
        id: 'c1',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-27',
        completed: true,
        updatedAt: '2026-07-27T10:00:00.000Z',
      },
      {
        id: 'c2',
        taskId: 'run',
        planId: 'plan-1',
        date: '2026-07-28',
        completed: true,
        updatedAt: '2026-07-28T10:00:00.000Z',
      },
    ];
    assert.equal(isTaskDueOnDate(task, '2026-07-29', completions), false);
    assert.equal(shouldShowInPlanFulfilledSection(task, '2026-07-29', completions), false);
  });
});
