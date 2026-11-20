// P2-01: contract_version "1.1", tuning đúng phase-2-spec mục 2, đủ khóa dash/night2/night3.
// [v1.2] TICKET-03 nâng contract lên "1.2" và THAY THẾ một phần tuning của v1.1: thời lượng Đêm
// 240/270/300 s và toàn bộ bảng điểm. Test này giữ phần v1.1 còn hiệu lực (các khóa dash/night2/
// night3 vẫn phải có, số chuẩn khác không đổi); khóa và giá trị mới của v1.2 kiểm ở P3-01.
import test from 'node:test';
import assert from 'node:assert/strict';
import { contract } from './helpers.js';
import { createConfig } from '../src/logic/index.js';

const SPEC_TUNING = {
  player_speed: 6, carry_capacity: 10, lantern_cost: 10, lantern_count_night1: 5,
  pickup_radius: 1.0, interact_radius: 2.0, pulse_cost: 3, pulse_radius: 5,
  night1_duration_s: 240, night2_duration_s: 270, night3_duration_s: 300, // [v1.2] v1.1: 300/330/360
  flames: 3, invuln_s: 1.5, hit_drop_ratio: 0.5, pulse_stun_s: 2, pulse_push_m: 4, pulse_cooldown_s: 3,
  safe_radius: 6, shade_speed: 4.0, shade_hit_radius: 1.0, fall_enabled: true,
  dash_speed: 14, dash_duration_s: 0.2, dash_cooldown_s: 1.5,
};

test('P2-01: contract (≥ v1.1) và tuning chuẩn TICKET-02 còn hiệu lực', () => {
  const c = contract();
  // [v1.2] v1.1 → 1.2. [v1.3] TICKET-04 nâng tiếp lên 1.3 (chỉ thêm bench_cmd/soak_cmd, tuning v1.1 vẫn còn hiệu lực).
  assert.equal(c.contract_version, '1.3');
  for (const k of ['dash_speed', 'dash_duration_s', 'dash_cooldown_s', 'night2_duration_s', 'night3_duration_s']) {
    assert.ok(k in c.tuning, `thiếu khóa tuning.${k}`);
  }
  // [v1.2] So từng khóa v1.1 thay vì so toàn bộ tuning (v1.2 thêm khóa; điểm được thay hẳn).
  for (const [k, v] of Object.entries(SPEC_TUNING)) assert.deepEqual(c.tuning[k], v, `tuning.${k}`);

  // Game dùng đúng các số này (đổi sang tick ở 60 tick/giây).
  const cfg = createConfig(c.tuning);
  assert.equal(cfg.dash_speed, 14);
  assert.equal(cfg.dash_ticks, 12);
  assert.equal(cfg.dash_cooldown_ticks, 90);
  assert.equal(cfg.stun_ticks, 120);
  assert.equal(cfg.pulse_cooldown_ticks, 180);
  assert.equal(cfg.invuln_ticks, 90);
  // [v1.2] Đêm 240/270/300 s (v1.1: 18000/19800/21600 tick).
  assert.deepEqual({ ...cfg.night_ticks_by_night }, { 1: 14400, 2: 16200, 3: 18000 });
  assert.equal(cfg.fall_enabled, true);
});
