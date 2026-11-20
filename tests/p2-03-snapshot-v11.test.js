// P2-03: snapshot v1.1 có night, wind, các trường mới của player, các mảng motes/drifters/charms;
// trạng thái Bóng Mực dùng đúng tên chuẩn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

const SHADE_STATES = ['spawning', 'wander', 'chase', 'recoil', 'stunned'];

test('P2-03: snapshot đủ trường v1.1', () => {
  const r = runHeadless({ seed: 3, ticks: 400 });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'night_start').map((e) => [e.tick, e.data]), [[0, { night: 1 }]]);

  for (const s of r.snapshots) {
    assert.equal(s.night, 1);
    assert.equal(typeof s.sim_tick, 'number');
    assert.equal(typeof s.wind.active, 'boolean');
    assert.equal(typeof s.wind.dir_deg, 'number');
    const p = s.player;
    assert.equal(p.vel.length, 3);
    assert.equal(typeof p.grounded, 'boolean');
    assert.equal(typeof p.invuln, 'boolean');
    for (const k of ['dash_cd_s', 'pulse_cd_s', 'charm_s', 'flames', 'carried']) assert.equal(typeof p[k], 'number', k);
    assert.ok(Array.isArray(s.motes) && Array.isArray(s.drifters) && Array.isArray(s.charms));
    assert.equal(s.motes_active, s.motes.length);
    for (const m of s.motes) {
      assert.ok(typeof m.id === 'string' && m.pos.length === 3);
      assert.ok(['random', 'dropped'].includes(m.kind));
      assert.ok('ttl_s' in m);
    }
    for (const sh of s.shades) assert.ok(SHADE_STATES.includes(sh.state), `trạng thái lạ: ${sh.state}`);
  }
  // Bóng Mực sinh ở tick 300 với trạng thái "spawning".
  const s300 = r.snapshots.find((s) => s.tick === 300);
  assert.equal(s300.shades.length, 2);
  assert.ok(s300.shades.every((sh) => sh.state === 'spawning'));
});
