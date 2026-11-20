// P2-04: lướt từ (0,0,0) hướng +Z (đứng yên → theo hướng quay mặt): sau 12 tick z ≈ 2.8;
// lướt lại trước 90 tick thì bị bỏ qua.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P2-04: lướt 14 m/s trong 12 tick, hồi chiêu 90 tick', () => {
  const r = runHeadless({
    ticks: 120, every: 1, scenario: 'p2-04-dash.scenario.json', inputs: 'p2-04-dash.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  // Bấm ở tick 0, 30, 100 → chỉ lần 0 và 100 kích hoạt (lần 30 còn hồi chiêu).
  assert.deepEqual(eventsNamed(r, 'dash').map((e) => e.tick), [1, 101]);

  const s1 = snapshotAt(r, 1);
  assert.equal(s1.player.dash_cd_s, 1.5);
  assert.deepEqual(s1.player.vel, [0, 0, 14]);
  const s12 = snapshotAt(r, 12);
  assert.ok(Math.abs(s12.player.pos[2] - 2.8) < 1e-3, `z = ${s12.player.pos[2]}`);
  assert.equal(s12.player.pos[0], 0);
  assert.equal(snapshotAt(r, 13).player.pos[2], s12.player.pos[2], 'hết lướt thì đứng yên');
  assert.equal(snapshotAt(r, 99).player.pos[2], s12.player.pos[2], 'lần bấm ở tick 30 bị bỏ qua');
  assert.ok(Math.abs(snapshotAt(r, 112).player.pos[2] - 5.6) < 1e-3);
});
