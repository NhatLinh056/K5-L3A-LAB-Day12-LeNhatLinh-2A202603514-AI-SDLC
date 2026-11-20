// AC12: time_left_s 1 → game_over lost dawn ở tick 60.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('AC12: hết giờ thì thua (dawn) ở tick 60', () => {
  const r = runHeadless({ ticks: 200, scenario: 'ac12-dawn.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const over = eventsNamed(r, 'game_over');
  assert.equal(over.length, 1);
  assert.equal(over[0].tick, 60);
  assert.deepEqual(over[0].data, { result: 'lost', reason: 'dawn' });
  assert.equal(r.end.state, 'lost');
  assert.equal(r.end.ticks, 60);
});
