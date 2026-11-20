// P2-09: hết lửa → no_flames; đèn cuối thắp đúng tick hết giờ → won;
// hết lửa luôn thua, kể cả khi mọi đèn đã sáng cùng tick.
// [v1.2] TICKET-03: lý do thắng đổi all_lit → dawn_survived (thắng chỉ xét ở bình minh, ngưỡng 3/5 đèn);
// điểm thắng tính theo đèn đang sáng + lửa, bỏ thưởng thời gian.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

const over = (r) => eventsNamed(r, 'game_over');

test('P2-09: hết lửa → lost no_flames', () => {
  const r = runHeadless({ ticks: 50, scenario: 'p2-09-no-flames.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(over(r).map((e) => [e.tick, e.data]), [[1, { result: 'lost', reason: 'no_flames' }]]);
  assert.equal(r.end.state, 'lost');
});

test('P2-09: thắp đèn cuối đúng tick hết giờ → won', () => {
  const r = runHeadless({
    ticks: 50, scenario: 'p2-09-win-at-timeout.scenario.json', inputs: 'p2-09-interact.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(over(r).map((e) => [e.tick, e.data]), [[1, { result: 'won', reason: 'dawn_survived' }]]);
  assert.equal(r.end.state, 'won');
  // [v1.2] Điểm mới: 10 đom đóm nạp ×5 + thắp lần đầu 100
  //   + bình minh: L1–L4 (fuel 100 − 1 tick hao → floor 99) mỗi đèn 50 + 99, L5 vừa thắp (fuel 100) 50 + 100
  //   + 3 lửa × 50.  (v1.1: 100 + 100 + 0 + 150 = 350)
  assert.equal(r.end.score, 50 + 100 + 4 * (50 + 99) + (50 + 100) + 150);
});

// Không thể dựng "thắp đèn cuối + bị Bóng Mực đánh" cùng tick: muốn nạp thì Mây phải cách đèn ≤ 2 m,
// nên con đứng sát Mây (≤ 1 m) chắc chắn nằm trong vùng 6 m và bị đẩy ra, không gây hit (P2-08).
// Vì vậy scenario đặt sẵn cả 5 đèn đã sáng; Mây ở giữa đảo, xa mọi vùng an toàn.
test('P2-09: mọi đèn đã sáng nhưng hết lửa ở tick đó → vẫn thua no_flames', () => {
  const r = runHeadless({ ticks: 50, scenario: 'p2-09-all-lit-but-no-flames.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.snapshots[0].lanterns.every((l) => l.lit));
  assert.deepEqual(over(r).map((e) => [e.tick, e.data]), [[1, { result: 'lost', reason: 'no_flames' }]]);
  assert.equal(r.end.state, 'lost');
});
