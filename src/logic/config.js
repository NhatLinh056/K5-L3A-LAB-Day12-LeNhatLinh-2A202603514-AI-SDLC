// Dựng cấu hình mô phỏng từ khối "tuning" của game.contract.json (Contract v1.1).
// Việc đọc file nằm ngoài src/logic (headless/render tự đọc rồi truyền vào).

export const TICK_RATE = 60;
const sec = (s) => Math.round(s * TICK_RATE);

// Số chuẩn TICKET-02 Phần 1 không có khóa riêng trong tuning (+ giả định ở phase-2-spec mục 3).
export const STD = Object.freeze({
  jump_velocity: 7,
  gravity: 20,
  charm_speed: 7.2,
  fall_y: -10,
  respawn_wait_ticks: 60,
  mote_cap: 30,
  mote_spawn_every_ticks: 240,
  mote_height_tolerance: 1.5,
  drop_ring_min: 1.5,
  drop_ring_max: 2.5,
  drop_ttl_ticks: 480,
  pulse_center_dy: 0.8,
  pulse_push_ticks: 15,
  shade_height: 1.0,
  shade_detect_m: 12,
  shade_lose_m: 18,
  shade_hit_dy: 1.5,
  shade_spawn_min_dist: 15,
  shade_spawning_ticks: 30,
  shade_wander_speed: 1.5,
  shade_wander_radius: 4,
  recoil_m: 2,
  recoil_ticks: 60,
  safe_evict_ticks: 30,
  step_height: 0.3, // bước lên tối đa; mặt cao hơn là vách đứng
});

const NUMERIC_KEYS = [
  'player_speed', 'carry_capacity', 'lantern_cost', 'lantern_count_night1',
  'pickup_radius', 'interact_radius', 'pulse_cost', 'pulse_radius',
  'night1_duration_s', 'night2_duration_s', 'night3_duration_s',
  'flames', 'invuln_s', 'hit_drop_ratio', 'pulse_stun_s',
  'pulse_push_m', 'pulse_cooldown_s', 'safe_radius', 'shade_speed', 'shade_hit_radius',
  'dash_speed', 'dash_duration_s', 'dash_cooldown_s',
  // v1.2 (TICKET-03 "Đèn cạn dầu")
  'fuel_max', 'fuel_decay_per_s', 'fuel_per_mote', 'relight_cost', 'win_ratio', 'drain_per_s',
  'low_fuel_threshold', 'capacity_max',
];
const SCORE_KEYS = [
  'per_mote', 'per_lantern', 'per_relight', 'per_stun', 'per_stun_drain',
  'per_lantern_dawn', 'per_flame_left', 'per_second_left',
];

// Nhiên liệu lưu số nguyên theo đơn vị 1/60 (fuel 100 = 6000 đơn vị) để không sai số số thực.
export const FUEL_UNIT = TICK_RATE;

export function createConfig(tuning) {
  if (!tuning || typeof tuning !== 'object') throw new Error('tuning missing');
  for (const k of NUMERIC_KEYS) {
    if (typeof tuning[k] !== 'number' || !Number.isFinite(tuning[k])) {
      throw new Error(`tuning.${k} must be a number`);
    }
  }
  const score = tuning.score ?? {};
  for (const k of SCORE_KEYS) {
    if (typeof score[k] !== 'number') throw new Error(`tuning.score.${k} must be a number`);
  }
  const nightTicks = Object.freeze({
    1: sec(tuning.night1_duration_s),
    2: sec(tuning.night2_duration_s),
    3: sec(tuning.night3_duration_s),
  });
  return Object.freeze({
    tuning,
    ...STD,
    player_speed: tuning.player_speed,
    carry_capacity: tuning.carry_capacity,
    lantern_cost: tuning.lantern_cost,
    lantern_count: tuning.lantern_count_night1,
    pickup_radius: tuning.pickup_radius,
    interact_radius: tuning.interact_radius,
    pulse_cost: tuning.pulse_cost,
    pulse_radius: tuning.pulse_radius,
    night_ticks: nightTicks[1],
    night_ticks_by_night: nightTicks,
    flames: tuning.flames,
    invuln_ticks: sec(tuning.invuln_s),
    hit_drop_ratio: tuning.hit_drop_ratio,
    stun_ticks: sec(tuning.pulse_stun_s),
    pulse_push_m: tuning.pulse_push_m,
    pulse_cooldown_ticks: sec(tuning.pulse_cooldown_s),
    safe_radius: tuning.safe_radius,
    shade_speed: tuning.shade_speed,
    shade_hit_radius: tuning.shade_hit_radius,
    fall_enabled: tuning.fall_enabled === true,
    dash_speed: tuning.dash_speed,
    dash_ticks: sec(tuning.dash_duration_s),
    dash_cooldown_ticks: sec(tuning.dash_cooldown_s),
    // Nhiên liệu (đơn vị 1/60): hao/hút tính theo đơn vị mỗi tick.
    fuel_max_u: Math.round(tuning.fuel_max * FUEL_UNIT),
    fuel_decay_u: Math.round((tuning.fuel_decay_per_s * FUEL_UNIT) / TICK_RATE),
    drain_u: Math.round((tuning.drain_per_s * FUEL_UNIT) / TICK_RATE),
    fuel_per_mote_u: Math.round(tuning.fuel_per_mote * FUEL_UNIT),
    low_fuel_u: Math.round(tuning.low_fuel_threshold * FUEL_UNIT),
    relight_cost: tuning.relight_cost,
    win_ratio: tuning.win_ratio,
    capacity_max: tuning.capacity_max,
    capacity_step: 2, // sức chứa = carry_capacity + 2 × successful_lights
    drain_reach_m: 2,
    drain_break_m: 6,
    fuel_drain_event_ticks: 60,
    score: Object.freeze({ ...score }),
  });
}
