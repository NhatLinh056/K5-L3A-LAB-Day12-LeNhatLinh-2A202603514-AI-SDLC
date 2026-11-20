// P3-01: contract v1.2 đủ khóa (phase-3-spec mục 2); snapshot đèn có fuel/ever_lit/relit_count,
// player có capacity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { contract, runHeadless } from './helpers.js';

const V12 = {
  fuel_max: 100, fuel_decay_per_s: 1.0, fuel_per_mote: 10, relight_cost: 5, win_ratio: 0.6,
  drain_per_s: 5, low_fuel_threshold: 30, capacity_max: 20,
  night1_duration_s: 240, night2_duration_s: 270, night3_duration_s: 300,
};
const SCORE = {
  per_mote: 5, per_lantern: 100, per_relight: 40, per_stun: 5, per_stun_drain: 15,
  per_lantern_dawn: 50, per_flame_left: 50, per_second_left: 0,
};

test('P3-01: contract v1.2 và snapshot có trường mới', () => {
  const c = contract();
  // [v1.3] TICKET-04 nâng contract lên 1.3; mọi khóa v1.2 giữ nguyên nên chỉ đổi version.
  assert.equal(c.contract_version, '1.3');
  for (const [k, v] of Object.entries(V12)) assert.equal(c.tuning[k], v, `tuning.${k}`);
  assert.deepEqual(c.tuning.score, SCORE);

  const r = runHeadless({ ticks: 5 });
  assert.equal(r.status, 0, r.stderr);
  for (const s of r.snapshots) {
    assert.equal(s.player.capacity, 10);
    for (const l of s.lanterns) {
      assert.equal(typeof l.fuel, 'number');
      assert.equal(typeof l.ever_lit, 'boolean');
      assert.equal(typeof l.relit_count, 'number');
      assert.equal(l.fuel, 0, 'đèn tắt có fuel 0');
    }
  }
});
