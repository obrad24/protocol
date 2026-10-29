import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDailyReminderBody } from './reminderMessages';

describe('reminderMessages', () => {
  it('builds Bosnian remaining copy with correct plural', () => {
    assert.match(buildDailyReminderBody('bs', 4)!, /još 4 zadatka/);
    assert.match(buildDailyReminderBody('bs', 1)!, /još 1 zadatak/);
    assert.match(buildDailyReminderBody('bs', 0)!, /Savršen dan/);
  });

  it('builds English remaining copy', () => {
    assert.match(buildDailyReminderBody('en', 4)!, /4 tasks left/);
    assert.match(buildDailyReminderBody('en', 1)!, /1 task left/);
    assert.match(buildDailyReminderBody('en', 0)!, /Perfect day/);
  });
});
