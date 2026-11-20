// AC2: chạy headless 100 tick → exit 0, dòng cuối type:end, có snapshot tick 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, snapshotAt } from './helpers.js';

test('AC2: headless 100 tick', () => {
  const r = runHeadless({ seed: 7, ticks: 100, scenario: 'ac02-smoke.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.end.type, 'end');
  assert.equal(r.end.ticks, 100);
  const s0 = snapshotAt(r, 0);
  assert.ok(s0, 'phải có snapshot tick 0');
  assert.equal(r.lines[0], s0, 'snapshot tick 0 là dòng đầu tiên');
  assert.equal(s0.state, 'playing');
  assert.deepEqual(s0.player.pos, [0, 0, 0]);
  // [v1.2] TICKET-03 rút Đêm 1 xuống 240 s (trước đó 300 s).
  assert.equal(s0.time_left_s, 240);
  assert.equal(s0.lanterns.length, 5);
  // [v1.1] Số chuẩn TICKET-02: đầu Đêm có 20 đom đóm (Phase 1 tự chọn 60), và Bóng Mực
  // chỉ sinh từ tick 300 (Phase 1 có sẵn 2 con ở tick 0). Đổi kỳ vọng 60 → 20 và 2 → 0.
  assert.equal(s0.motes_active, 20);
  assert.equal(s0.shades.length, 0);
  // snapshot mặc định mỗi 10 tick: 0, 10, …, 100
  assert.deepEqual(r.snapshots.map((s) => s.tick), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
});
