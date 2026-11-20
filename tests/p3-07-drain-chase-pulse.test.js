// P3-07: drain → chase khi Mây vào 6 m; pulse trúng con đang drain → +15.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

const S1 = (snap) => snap.shades.find((x) => x.id === 'S1');
const dXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

test('P3-07: drain → chase khi Mây vào trong 6 m', () => {
  const r = runHeadless({
    ticks: 60, every: 1, scenario: 'p3-07-drain-to-chase.scenario.json', inputs: 'p3-07-drain-to-chase.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(S1(snapshotAt(r, 1)).state, 'drain', 'Mây còn cách 9 m → vẫn hút');
  const first = r.snapshots.find((s) => S1(s).state === 'chase');
  assert.ok(first, 'S1 phải chuyển sang chase');
  const prev = snapshotAt(r, first.tick - 1);
  assert.equal(S1(prev).state, 'drain');
  assert.ok(dXZ(first.player.pos, S1(prev).pos) <= 6 + 1e-3, 'chuyển khi Mây vào trong 6 m');
  assert.ok(dXZ(prev.player.pos, S1(prev).pos) > 6, 'trước đó Mây còn ngoài 6 m');
});

test('P3-07: Tỏa Sáng trúng con đang drain được +15', () => {
  const r = runHeadless({ ticks: 5, every: 1, scenario: 'p3-07-pulse-drain.scenario.json', inputs: 'p3-pulse.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'pulse').map((e) => e.data), [{ stunned_ids: ['S1'] }]);
  const t1 = snapshotAt(r, 1);
  assert.equal(t1.score, 15);
  assert.equal(S1(t1).state, 'stunned');
});
