// AC7: mote tại (0,0,1) → mote_picked ở tick 1, score 10.
// [v1.1] Điểm chuẩn hóa TICKET-02: +10 mỗi đom đóm được NẠP vào đèn, nhặt không còn được điểm.
// Kỳ vọng score đổi 10 → 0; phần "mote_picked ở tick 1" giữ nguyên (khoảng cách 1.0 ≤ pickup_radius 1.0).
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('AC7: nhặt đom đóm ở tick 1', () => {
  const r = runHeadless({ ticks: 10, every: 1, scenario: 'ac07-pickup.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const picks = eventsNamed(r, 'mote_picked');
  assert.equal(picks.length, 1);
  assert.equal(picks[0].tick, 1);
  assert.deepEqual(picks[0].data, { carried: 1 });
  const s1 = snapshotAt(r, 1);
  assert.equal(s1.score, 0);
  assert.equal(s1.motes_active, 0);
  assert.equal(s1.player.carried, 1);
  assert.equal(r.end.score, 0);
});
