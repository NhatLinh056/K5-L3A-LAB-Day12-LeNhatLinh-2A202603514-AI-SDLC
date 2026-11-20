// P3-10: sức chứa = 10 + 2 × successful_lights, tối đa 20.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P3-10: sau 2 lần thắp thành công, capacity = 14', () => {
  const r = runHeadless({
    ticks: 60, every: 1, scenario: 'p3-10-capacity.scenario.json', inputs: 'p3-10-capacity.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'lantern_lit').map((e) => [e.tick, e.data.lantern_id]), [[1, 'L1'], [51, 'L2']]);
  assert.equal(snapshotAt(r, 0).player.capacity, 10);
  assert.equal(snapshotAt(r, 1).player.capacity, 12);
  assert.equal(snapshotAt(r, 51).player.capacity, 14);
});

test('P3-10: sức chứa tối đa 20', () => {
  const r = runHeadless({ ticks: 1, every: 1, scenario: 'p3-10-capacity-max.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.snapshots[0].player.capacity, 20, '10 + 2 × 10 = 30 → kẹp ở 20');
});

test('P3-10: nhặt không vượt sức chứa', () => {
  const r = runHeadless({ ticks: 3, every: 1, scenario: 'p3-10-capacity-pickup.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const t1 = snapshotAt(r, 1);
  assert.equal(t1.player.capacity, 12);
  assert.equal(t1.player.carried, 12, 'chỉ nhặt thêm 1 con (11 → 12)');
  assert.equal(t1.motes_active, 1);
});
