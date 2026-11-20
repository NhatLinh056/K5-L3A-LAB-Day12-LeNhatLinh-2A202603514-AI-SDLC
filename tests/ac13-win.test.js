// AC13 (gốc Phase 1): L1–L4 lit sẵn, carried 10 cạnh L5, interact → won all_lit;
// không cộng điểm cho đèn đặt sẵn.
//
// [v1.1] Điểm chuẩn hóa TICKET-02: thêm per_mote × 10 đom đóm nạp; per_second_left = 2
// (100 + 100 + 299×2 + 3×50 = 948; Phase 1: 549).
// [v1.2] TICKET-03 THAY THẾ luật "thắng ngay khi tất cả đèn sáng": thắp đủ đèn không kết thúc Đêm,
// lý do all_lit không còn dùng. Phần "thắng" của AC13 bị bỏ (luật thắng mới được kiểm ở P3-08).
// Giữ phần còn đúng của AC13: đèn đặt sẵn bằng scenario không được cộng điểm, và chỉ L5 phát
// lantern_lit. Điểm mới: +5 × 10 đom đóm nạp + 100 thắp lần đầu = 150.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, contract } from './helpers.js';

test('AC13: thắp L5 (L1–L4 đặt sẵn) không kết thúc Đêm, đèn đặt sẵn không được cộng điểm', () => {
  const r = runHeadless({ ticks: 10, scenario: 'ac13-win.scenario.json', inputs: 'ac13-win.inputs.json' });
  assert.equal(r.status, 0, r.stderr);

  assert.equal(r.snapshots[0].score, 0, 'dựng scenario không cộng điểm');
  const lit = eventsNamed(r, 'lantern_lit');
  assert.deepEqual(lit.map((e) => e.data.lantern_id), ['L5']);

  assert.deepEqual(eventsNamed(r, 'game_over'), [], 'thắp đủ 5 đèn không kết thúc Đêm');
  assert.equal(r.end.state, 'playing');
  assert.equal(r.end.ticks, 10);

  const { tuning } = contract();
  assert.equal(r.end.score, tuning.score.per_mote * tuning.lantern_cost + tuning.score.per_lantern);
});
