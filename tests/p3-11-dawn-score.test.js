// P3-11: điểm bình minh: mỗi đèn đang sáng +50 + floor(fuel), mỗi lửa còn lại +50; bỏ thưởng thời gian.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('P3-11: điểm khi thắng ở bình minh', () => {
  const r = runHeadless({ ticks: 100, scenario: 'p3-11-dawn-score.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'game_over').map((e) => e.data), [{ result: 'won', reason: 'dawn_survived' }]);
  // Hết giờ ở tick 60: L1 50 → 49, L2 và L3 100 → 99 (hao 1/s).
  // (50 + 49) + 2 × (50 + 99) + 2 lửa × 50 = 497.
  assert.equal(r.end.score, 497);
});
