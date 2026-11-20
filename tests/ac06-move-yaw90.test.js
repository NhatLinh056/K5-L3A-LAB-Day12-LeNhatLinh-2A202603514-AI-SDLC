// AC6: move [0,1], yaw 90, 60 tick → player x = 6.000, z = 0.000.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, snapshotAt } from './helpers.js';

test('AC6: đi với cam_yaw_deg 90', () => {
  const r = runHeadless({
    ticks: 60, scenario: 'ac06-move-yaw90.scenario.json', inputs: 'ac06-move-yaw90.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const s = snapshotAt(r, 60);
  assert.ok(s, 'phải có snapshot tick 60');
  assert.equal(s.player.pos[0], 6);
  assert.equal(s.player.pos[2], 0);
});
