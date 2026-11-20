// AC5: move [0,1], yaw 0, 60 tick → player z = 6.000 tại tick 60.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, snapshotAt } from './helpers.js';

test('AC5: đi thẳng +Z 60 tick', () => {
  const r = runHeadless({
    ticks: 60, scenario: 'ac05-move-forward.scenario.json', inputs: 'ac05-move-forward.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const s = snapshotAt(r, 60);
  assert.ok(s, 'phải có snapshot tick 60');
  assert.equal(s.player.pos[0], 0);
  assert.equal(s.player.pos[2], 6);
});
