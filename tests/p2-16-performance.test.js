// P2-16: một Đêm (tối đa 21.600 tick) chạy headless xong trong ≤ 30 s. Ghi thời gian đo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless } from './helpers.js';

const LIMIT_MS = 30_000;

test('P2-16: headless 21.600 tick ≤ 30 s', (t) => {
  const t0 = performance.now();
  // time_left_s 360 để Đêm 1 kéo dài đủ 21.600 tick (bằng Đêm 3), giữ đom đóm và Bóng Mực ngẫu nhiên.
  const r = runHeadless({ seed: 42, ticks: 21600, scenario: 'p2-16-long-night.scenario.json' });
  const ms = performance.now() - t0;
  assert.equal(r.status, 0, r.stderr);
  t.diagnostic(`Đêm 1, seed 42, --ticks 21600: chạy ${r.end.ticks} tick (${r.end.state}) trong ${(ms / 1000).toFixed(2)} s`);
  assert.equal(r.end.ticks, 21600, 'phải chạy đủ 21.600 tick');
  assert.ok(ms <= LIMIT_MS,`mất ${ms.toFixed(0)} ms (giới hạn ${LIMIT_MS} ms)`);
});
