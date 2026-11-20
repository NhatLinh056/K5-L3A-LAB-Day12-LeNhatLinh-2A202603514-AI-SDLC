// AC11: flames 1, shade đứng sát → game_over lost no_flames.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('AC11: hết lửa thì thua', () => {
  const r = runHeadless({ ticks: 100, scenario: 'ac11-no-flames.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const over = eventsNamed(r, 'game_over');
  assert.equal(over.length, 1);
  assert.deepEqual(over[0].data, { result: 'lost', reason: 'no_flames' });
  assert.equal(r.end.type, 'end');
  assert.equal(r.end.state, 'lost');
  assert.equal(r.end.ticks, over[0].tick, 'dừng ngay khi game kết thúc');
});
