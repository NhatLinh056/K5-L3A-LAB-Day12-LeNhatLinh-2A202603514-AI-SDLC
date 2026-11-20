// AC8: carried 10, đứng cạnh L1, interact → deposit amount 10, lantern_lit L1, score 100.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('AC8: nạp 10 đom đóm thắp L1', () => {
  const r = runHeadless({
    ticks: 5, every: 1, scenario: 'ac08-deposit.scenario.json', inputs: 'ac08-deposit.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const dep = eventsNamed(r, 'deposit');
  assert.equal(dep.length, 1);
  assert.equal(dep[0].tick, 1);
  assert.deepEqual(dep[0].data, { lantern_id: 'L1', amount: 10, deposited: 10 });
  const lit = eventsNamed(r, 'lantern_lit');
  assert.equal(lit.length, 1);
  // [v1.2] lantern_lit có thêm trường relight (false khi thắp lần đầu).
  assert.deepEqual(lit[0].data, { lantern_id: 'L1', relight: false });
  // [v1.1] Điểm chuẩn hóa: +10 × 10 đom đóm nạp + 100 thắp đèn = 200 (Phase 1 chỉ tính 100 cho đèn).
  // [v1.2] Điểm mới TICKET-03: +5 × 10 đom đóm nạp + 100 thắp lần đầu = 150 (v1.1: 200).
  assert.equal(r.end.score, 150);
  const last = r.snapshots[r.snapshots.length - 1];
  assert.equal(last.player.carried, 0);
  assert.equal(last.lanterns.find((l) => l.id === 'L1').lit, true);
});
