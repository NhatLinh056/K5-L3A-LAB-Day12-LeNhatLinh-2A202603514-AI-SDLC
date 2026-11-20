// P3-09: hết lửa ở tick cuối (đủ đèn để thắng) → lost no_flames.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('P3-09: hết lửa đúng tick bình minh vẫn thua no_flames', () => {
  const r = runHeadless({ ticks: 10, scenario: 'p3-09-no-flames-last-tick.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.snapshots[0].lanterns.filter((l) => l.lit).length >= 3, 'đủ ngưỡng 3/5 đèn');
  assert.equal(eventsNamed(r, 'player_hit')[0].tick, 1);
  assert.deepEqual(eventsNamed(r, 'game_over').map((e) => [e.tick, e.data]), [[1, { result: 'lost', reason: 'no_flames' }]]);
});
