// P3-06: Bóng Mực wander đi tới đèn fuel < 30, cách ≤ 2 m → drain, hút 5/s (+1/s tự hao);
// fuel = 30 vẫn còn vùng an toàn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

const at = (snap, id, kind) => snap[kind].find((x) => x.id === id);
const dXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

test('P3-06: wander → tới đèn yếu → drain, dầu giảm 6/giây', () => {
  const r = runHeadless({ ticks: 300, every: 1, scenario: 'p3-06-drain.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const first = r.snapshots.find((s) => at(s, 'S1', 'shades').state === 'drain');
  assert.ok(first, 'S1 phải chuyển sang drain');
  const T = first.tick;
  assert.equal(at(snapshotAt(r, T - 1), 'S1', 'shades').state, 'wander');
  assert.ok(dXZ(at(first, 'S1', 'shades').pos, at(first, 'L1', 'lanterns').pos) <= 2 + 1e-3);

  // 60 tick drain: 5/s hút + 1/s hao = 6.0 (fuel xuất 1 chữ số thập phân → sai số làm tròn ≤ 0.1).
  const f0 = at(snapshotAt(r, T), 'L1', 'lanterns').fuel;
  const f60 = at(snapshotAt(r, T + 60), 'L1', 'lanterns').fuel;
  assert.ok(Math.abs(f0 - f60 - 6) <= 0.11, `giảm ${f0 - f60}`);
  // S1 đứng yên trong lúc hút.
  assert.deepEqual(at(snapshotAt(r, T + 60), 'S1', 'shades').pos, at(first, 'S1', 'shades').pos);

  const drains = eventsNamed(r, 'fuel_drain');
  assert.ok(drains.length >= 1);
  assert.equal(drains[0].tick, T + 60, 'fuel_drain ghi sau 60 tick hút liên tục');
  assert.equal(drains[0].data.lantern_id, 'L1');
  assert.equal(drains[0].data.shade_id, 'S1');

  // Đèn hết dầu → tắt, S1 về wander.
  const out = eventsNamed(r, 'lantern_out');
  assert.equal(out.length, 1);
  assert.equal(at(snapshotAt(r, out[0].tick + 1), 'S1', 'shades').state, 'wander');
});

test('P3-06: fuel đúng 30 vẫn còn vùng an toàn, dưới 30 thì mất', () => {
  const r = runHeadless({ ticks: 70, every: 1, scenario: 'p3-06-fuel30-still-safe.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const dist = (t) => {
    const s = snapshotAt(r, t);
    return dXZ(at(s, 'S1', 'shades').pos, at(s, 'L1', 'lanterns').pos);
  };
  assert.equal(at(snapshotAt(r, 60), 'L1', 'lanterns').fuel, 30);
  for (let t = 1; t <= 60; t++) assert.ok(dist(t) >= 6 - 0.002, `tick ${t}: ${dist(t)}`);
  assert.ok(dist(59) <= 6 + 0.01, 'S1 đã áp sát mép vùng');
  assert.ok(dist(62) < 6 - 0.05, 'fuel < 30: Bóng Mực vào được trong 6 m');
});
