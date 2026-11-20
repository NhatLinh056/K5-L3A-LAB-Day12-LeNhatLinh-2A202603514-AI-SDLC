// AC9: shade cách 5 m và 10 m, carried 4, pulse 2 lần liền →
// lần 1 chỉ choáng con 5 m; lần 2 bị cooldown chặn.
// [v1.1] Số chuẩn: pulse_radius 5 m đo 3D từ chân Mây + 0.8 m tới tâm Bóng Mực (cao 1.0 m), nên con
// cách 5 m (3D ≈ 5.004 m) nằm NGOÀI tầm. Scenario đổi: con gần đặt ở 4 m (con xa vẫn 10 m).
// pulse_cost 3: carried 4 sau lần 1 chỉ còn 1, lần 2 sẽ bị chặn vì thiếu đom đóm chứ không phải
// cooldown. Để vẫn kiểm đúng ý "bị cooldown chặn", scenario đổi carried 4 → 6.
// per_stun 5: điểm sau lần 1 là 5 (Phase 1: 20); carried còn 3 (Phase 1: 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('AC9: pulse lần 1 choáng S1, lần 2 bị cooldown chặn', () => {
  const r = runHeadless({
    ticks: 10, every: 1,
    scenario: 'ac09-pulse-cooldown.scenario.json', inputs: 'ac09-pulse-cooldown.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const pulses = eventsNamed(r, 'pulse');
  assert.equal(pulses.length, 1, 'chỉ có 1 lần pulse thành công');
  assert.equal(pulses[0].tick, 1);
  assert.deepEqual(pulses[0].data, { stunned_ids: ['S1'] });

  const s1 = snapshotAt(r, 1);
  assert.equal(s1.player.carried, 3);
  assert.equal(s1.score, 5);
  assert.equal(s1.shades.find((s) => s.id === 'S1').state, 'stunned');
  assert.notEqual(s1.shades.find((s) => s.id === 'S2').state, 'stunned');

  // Lần bấm thứ 2 (tick 2): đủ 3 đom đóm nhưng đang hồi chiêu → không trừ đom đóm, không cộng điểm.
  const s3 = snapshotAt(r, 3);
  assert.ok(s3.player.carried >= 3, 'vẫn đủ đom đóm, nên chỉ có cooldown chặn lần 2');
  assert.equal(s3.player.carried, 3);
  assert.equal(s3.score, 5);
});
