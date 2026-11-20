// P4-03: công thức avg_fps / p1_low_fps / frame_ms_p95 trên mảng dt mẫu (tính tay).
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../src/bench-stats.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

test('P4-03: 99 khung 10 ms + 1 khung 100 ms', () => {
  const dts = [...Array(99).fill(10), 100];
  const s = computeStats(dts);
  assert.equal(s.frames, 100);
  close(s.avg_fps, (1000 * 100) / 1090); // 91.743…
  close(s.p1_low_fps, 10); // k = ceil(1) = 1 → 1000 / 100
  assert.equal(s.frame_ms_p95, 10); // sorted[ceil(95) − 1] = sorted[94]
});

test('P4-03: N nhỏ → k = 1, p95 là khung chậm nhất', () => {
  const s = computeStats([5, 20, 10]);
  assert.equal(s.frames, 3);
  close(s.avg_fps, 3000 / 35);
  close(s.p1_low_fps, 1000 / 20);
  assert.equal(s.frame_ms_p95, 20); // sorted[ceil(2.85) − 1] = sorted[2]
});

test('P4-03: N = 200 → k = 2, lấy trung bình 2 khung chậm nhất', () => {
  const dts = [...Array(198).fill(8), 40, 60];
  const s = computeStats(dts);
  close(s.p1_low_fps, 1000 / 50);
  close(s.avg_fps, (1000 * 200) / (198 * 8 + 100));
  assert.equal(s.frame_ms_p95, 8); // sorted[189]
});

test('P4-03: thứ tự khung không ảnh hưởng kết quả; mảng rỗng báo lỗi', () => {
  const a = [16, 17, 33, 16, 50, 16];
  assert.deepEqual(computeStats(a), computeStats([...a].reverse()));
  assert.throws(() => computeStats([]));
});
