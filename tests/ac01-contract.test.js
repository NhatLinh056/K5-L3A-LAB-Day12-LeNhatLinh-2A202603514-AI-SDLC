// AC1: game.contract.json hợp lệ, tuning trùng với config game dùng.
// [v1.1] File kỳ vọng scenarios/ac01-contract.expected.json đổi sang contract 1.1 và tuning chuẩn
// TICKET-02 (phase-2-spec mục 2). Các khóa mới (dash_*, night2/3) được kiểm thêm ở P2-01.
// [v1.2] File kỳ vọng đổi tiếp sang contract 1.2 (TICKET-03): thời lượng Đêm 240/270/300 s,
// điểm mới, thêm các khóa nhiên liệu. Khóa mới được kiểm thêm ở P3-01.
// [v1.3] File kỳ vọng đổi contract_version sang "1.3" (TICKET-04 thêm bench_cmd/soak_cmd, tuning giữ nguyên).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contract, scenario } from './helpers.js';
import { createConfig } from '../src/logic/index.js';

test('AC1: game.contract.json hợp lệ và tuning khớp config', () => {
  const c = contract();
  const expected = JSON.parse(fs.readFileSync(scenario('ac01-contract.expected.json'), 'utf8'));
  assert.equal(c.contract_version, expected.contract_version);
  assert.equal(c.team, expected.team);
  for (const k of ['build_cmd', 'run_cmd', 'headless_cmd']) {
    assert.equal(typeof c[k], 'string', `${k} phải là chuỗi`);
    assert.ok(c[k].length > 0, `${k} không được rỗng`);
  }
  assert.deepEqual(c.tuning, expected.tuning);

  const cfg = createConfig(c.tuning);
  const t = c.tuning;
  assert.equal(cfg.player_speed, t.player_speed);
  assert.equal(cfg.carry_capacity, t.carry_capacity);
  assert.equal(cfg.lantern_cost, t.lantern_cost);
  assert.equal(cfg.lantern_count, t.lantern_count_night1);
  assert.equal(cfg.pickup_radius, t.pickup_radius);
  assert.equal(cfg.interact_radius, t.interact_radius);
  assert.equal(cfg.pulse_cost, t.pulse_cost);
  assert.equal(cfg.pulse_radius, t.pulse_radius);
  assert.equal(cfg.night_ticks, t.night1_duration_s * 60);
  assert.equal(cfg.flames, t.flames);
  assert.equal(cfg.invuln_ticks, t.invuln_s * 60);
  assert.equal(cfg.hit_drop_ratio, t.hit_drop_ratio);
  assert.equal(cfg.stun_ticks, t.pulse_stun_s * 60);
  assert.equal(cfg.pulse_push_m, t.pulse_push_m);
  assert.equal(cfg.pulse_cooldown_ticks, t.pulse_cooldown_s * 60);
  assert.equal(cfg.safe_radius, t.safe_radius);
  assert.equal(cfg.shade_speed, t.shade_speed);
  assert.equal(cfg.shade_hit_radius, t.shade_hit_radius);
  assert.equal(cfg.fall_enabled, t.fall_enabled);
  assert.deepEqual({ ...cfg.score }, t.score);
});
