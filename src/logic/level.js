// Dựng trạng thái ban đầu của một Đêm và áp scenario (không phát event, không cộng điểm).
import { mulberry32 } from './rng.js';
import { validateScenario } from './validate.js';
import { getNight, UnsupportedError } from './levels.js';
import { FUEL_UNIT } from './config.js';

export const r3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? 0 : r; // chuẩn hóa -0
};

export const idNum = (id) => {
  const m = /(\d+)$/.exec(id);
  return m ? Number(m[1]) : 0;
};

export const byId = (a, b) => idNum(a.id) - idNum(b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function groundAt(s, x, z) {
  return s.level.ground(x, z);
}

export function addMote(s, x, y, z, kind, point = -1, ttl = null) {
  const m = { id: `M${s.nextMoteId++}`, x, y, z, kind, point, ttl };
  s.motes.push(m);
  return m;
}

export function newShade(s, id, x, z, state, ticksLeft) {
  const sh = {
    id,
    x,
    y: (groundAt(s, x, z) ?? 0) + s.cfg.shade_height,
    z,
    state,
    t: ticksLeft,
    home: [x, z],
    target: null,
    push_dir: [1, 0],
    push_left: 0,
    recoil_dir: [1, 0],
    evict: null,
    drain_lantern: null, // id đèn đang hút (trạng thái drain)
    drain_ticks: 0,
  };
  return sh;
}

// Chọn ngẫu nhiên (theo PRNG) k phần tử khác nhau trong n chỉ số.
function pickDistinct(rng, n, k) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k && i < n; i++) {
    const j = i + Math.floor(rng() * (n - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(k, n));
}

export function createLevel(cfg, seed, night = 1) {
  const L = getNight(night);
  const s = {
    cfg,
    level: L,
    night,
    rng: mulberry32(seed),
    tick: 0,
    sim_tick: 0,
    state: 'playing',
    paused: false,
    result: null,
    score: 0,
    time_left_ticks: cfg.night_ticks_by_night[night],
    shade_speed: L.shade_speed ?? cfg.shade_speed, // Đêm 3: 4.5 m/s
    random_motes: true,
    random_shades: true,
    wind: { active: false, dir_deg: 0 },
    nextMoteId: 1,
    nextShadeId: 1,
    prevButtons: { jump: false, interact: false, pulse: false, dash: false, pause: false },
    player: {
      x: L.start[0], y: L.start[1], z: L.start[2],
      vx: 0, vy: 0, vz: 0,
      grounded: true,
      facing: [...L.facing],
      flames: cfg.flames,
      carried: 0,
      invuln: 0,
      pulse_cd: 0,
      dash_cd: 0,
      dash_ticks: 0,
      dash_dir: [...L.facing],
      launch: null, // vận tốc ngang từ bục nhảy, giữ tới khi chạm đất
      charm: 0,
      respawn_wait: 0,
      successful_lights: 0, // số lần thắp thành công trong Đêm (cả thắp lại)
    },
    lanterns: L.lanterns.map(([id, x, y, z]) => ({
      id, x, y, z, lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0,
    })),
    motes: [],
    shades: [],
    drifters: [],
    charms: [],
  };
  for (const i of pickDistinct(s.rng, L.mote_points.length, L.mote_initial)) {
    const [x, y, z] = L.mote_points[i];
    addMote(s, x, y, z, 'random', i);
  }
  return s;
}

export function applyScenario(s, sc) {
  validateScenario(sc, s.lanterns.map((l) => l.id));
  const c = s.cfg;
  if (sc.player) {
    const p = s.player;
    const d = sc.player;
    if (d.pos) {
      [p.x, p.y, p.z] = d.pos;
      const g = groundAt(s, p.x, p.z);
      p.grounded = g !== null && Math.abs(p.y - g) < 1e-9;
    }
    if ('carried' in d) p.carried = d.carried;
    if ('flames' in d) p.flames = d.flames;
    if ('invuln_ticks' in d) p.invuln = d.invuln_ticks;
    if ('dash_cd_ticks' in d) p.dash_cd = d.dash_cd_ticks;
    if ('pulse_cd_ticks' in d) p.pulse_cd = d.pulse_cd_ticks;
    if ('charm_ticks' in d) p.charm = d.charm_ticks;
    if ('successful_lights' in d) p.successful_lights = d.successful_lights;
  }
  for (const k of ['random_motes', 'random_shades']) if (k in sc) s[k] = sc[k];
  if ('wind_enabled' in sc && sc.wind_enabled) {
    throw new UnsupportedError('scenario.wind_enabled: gió (Đêm 3) thuộc phạm vi P1, chưa cài');
  }
  for (const k of ['drifters', 'charms']) {
    if (sc[k] && sc[k].length > 0) {
      throw new UnsupportedError(`scenario.${k}: tính năng này thuộc phạm vi P1, chưa cài`);
    }
  }
  if (sc.motes) {
    s.motes = [];
    s.nextMoteId = 1;
    for (const [x, y, z] of sc.motes) addMote(s, x, y, z, 'random', -1);
  }
  if (sc.shades) {
    s.shades = [];
    const explicit = sc.shades.filter((d) => d.id).map((d) => idNum(d.id));
    let next = Math.max(0, ...explicit) + 1;
    const p = s.player;
    for (const d of sc.shades) {
      const id = d.id ?? `S${next++}`;
      const state = d.state ?? 'wander';
      const defaults = { spawning: c.shade_spawning_ticks, stunned: c.stun_ticks, recoil: c.recoil_ticks };
      const t = d.state_ticks_left ?? defaults[state] ?? 0;
      const sh = newShade(s, id, d.pos[0], d.pos[2], state, t);
      if (state === 'recoil') {
        const dx = sh.x - p.x;
        const dz = sh.z - p.z;
        const len = Math.hypot(dx, dz);
        sh.recoil_dir = len === 0 ? [1, 0] : [dx / len, dz / len];
      }
      if (state === 'drain') sh.drain_lantern = d.target_lantern_id;
      s.shades.push(sh);
    }
    s.shades.sort(byId);
    s.nextShadeId = Math.max(next, ...s.shades.map((x) => idNum(x.id) + 1));
  }
  if (sc.lanterns) {
    for (const d of sc.lanterns) {
      const l = s.lanterns.find((x) => x.id === d.id);
      if (d.pos) [l.x, l.y, l.z] = d.pos;
      if ('lit' in d) l.lit = d.lit;
      // Đèn đặt lit: true mà không có fuel thì mặc định fuel 100. Đèn tắt luôn có fuel 0.
      if (l.lit) l.fuel = 'fuel' in d ? Math.round(d.fuel * FUEL_UNIT) : c.fuel_max_u;
      else l.fuel = 0;
      // Đèn đang sáng thì đã từng sáng; deposited giữ bằng chi phí đã thắp.
      l.ever_lit = 'ever_lit' in d ? d.ever_lit || l.lit : l.lit;
      if ('deposited' in d) l.deposited = d.deposited;
      else if (l.lit) l.deposited = c.lantern_cost;
    }
  }
  if ('time_left_s' in sc) s.time_left_ticks = Math.round(sc.time_left_s * 60);
  return s;
}
