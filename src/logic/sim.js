// Một tick mô phỏng, đúng "Thứ tự xử lý trong một tick (bắt buộc)" của TICKET-02 Phần 1,
// bổ sung TICKET-03 (v1.2): bước 2 trừ dầu, ngay sau bước 2 đèn hết dầu tắt; luật thắng dawn_survived.
import { r3, addMote, newShade, groundAt, byId } from './level.js';
import { TICK_RATE, FUEL_UNIT } from './config.js';

const DT = 1 / TICK_RATE;
const EPS = 1e-9;
const distXZ = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
// Vùng an toàn chỉ có ở đèn đang sáng và fuel ≥ ngưỡng (đúng 30 vẫn còn).
export const hasSafeZone = (c, l) => l.lit && l.fuel >= c.low_fuel_u;
export const isWeak = (c, l) => l.lit && l.fuel < c.low_fuel_u;
export const fuelOut = (u) => Math.round(u / 6) / 10; // đơn vị 1/60 → số thực 1 chữ số thập phân
export const capacityOf = (c, p) => Math.min(c.capacity_max, c.carry_capacity + c.capacity_step * p.successful_lights);

// Gần nhất theo XZ trong danh sách (đã theo thứ tự id) → bằng nhau thì id nhỏ hơn.
function nearest(list, x, z) {
  let best = null;
  let bestD = Infinity;
  for (const l of list) {
    const d = distXZ(x, z, l.x, l.z);
    if (d < bestD) {
      best = l;
      bestD = d;
    }
  }
  return best ? { l: best, d: bestD } : null;
}

// Đèn nhận được khi tương tác: chưa sáng, hoặc sáng nhưng chưa đầy dầu; gần nhất trong interact_radius.
export function pickInteractLantern(s) {
  const c = s.cfg;
  const p = s.player;
  const ok = s.lanterns.filter((l) => (!l.lit || l.fuel < c.fuel_max_u)
    && distXZ(p.x, p.z, l.x, l.z) <= c.interact_radius);
  return nearest(ok, p.x, p.z)?.l ?? null;
}

const unit = (dx, dz) => {
  const d = Math.hypot(dx, dz);
  return d === 0 ? [1, 0] : [dx / d, dz / d]; // trùng vị trí → +X
};

// Bóng Mực ở ngoài vùng an toàn của đèn đã sáng bị chặn ở mép.
function blockAtSafeEdge(s, sh) {
  const R = s.cfg.safe_radius;
  for (const l of s.lanterns) {
    if (!hasSafeZone(s.cfg, l)) continue;
    const d = distXZ(sh.x, sh.z, l.x, l.z);
    if (d < R) {
      const [ux, uz] = unit(sh.x - l.x, sh.z - l.z);
      sh.x = l.x + ux * R;
      sh.z = l.z + uz * R;
    }
  }
}

function pushOutOfObstacles(s, e) {
  for (const o of s.level.obstacles) {
    const d = distXZ(e.x, e.z, o.x, o.z);
    if (e.y < o.top && d < o.r) {
      const [ux, uz] = unit(e.x - o.x, e.z - o.z);
      e.x = o.x + ux * o.r;
      e.z = o.z + uz * o.r;
    }
  }
}

function moveShadeBy(s, sh, dx, dz) {
  sh.x += dx;
  sh.z += dz;
  blockAtSafeEdge(s, sh);
  pushOutOfObstacles(s, sh);
  sh.y = (groundAt(s, sh.x, sh.z) ?? 0) + s.cfg.shade_height;
}

function resolveShadeState(s, sh) {
  const p = s.player;
  sh.state = distXZ(sh.x, sh.z, p.x, p.z) <= s.cfg.shade_detect_m ? 'chase' : 'wander';
  sh.t = 0;
  sh.push_left = 0;
  sh.target = null;
}

function moveTowards(s, sh, tx, tz, speed) {
  const dx = tx - sh.x;
  const dz = tz - sh.z;
  const d = Math.hypot(dx, dz);
  if (d <= 0) return 0;
  const len = Math.min(speed * DT, d);
  moveShadeBy(s, sh, (dx / d) * len, (dz / d) * len);
  return d - len;
}

function dropMotes(s, n) {
  const c = s.cfg;
  const p = s.player;
  for (let i = 0; i < n; i++) {
    let placed = null;
    for (let tries = 0; tries < 16 && !placed; tries++) {
      const a = s.rng() * Math.PI * 2;
      const r = c.drop_ring_min + s.rng() * (c.drop_ring_max - c.drop_ring_min);
      const x = p.x + r * Math.cos(a);
      const z = p.z + r * Math.sin(a);
      const g = groundAt(s, x, z);
      if (g !== null) placed = [x, g, z];
    }
    // Không tìm được chỗ có đất trong vành (sát mép đảo): đặt tại chỗ Mây đứng.
    if (!placed) placed = [p.x, groundAt(s, p.x, p.z) ?? p.y, p.z];
    addMote(s, placed[0], placed[1], placed[2], 'dropped', -1, c.drop_ttl_ticks);
  }
}

// Vị trí (x, z) ở độ cao chân y có bị chặn không: vách (mặt cao hơn chân quá step_height) hoặc tháp.
function blockedAt(s, x, z, y) {
  const g = groundAt(s, x, z);
  if (g !== null && g > y + s.cfg.step_height) return true;
  for (const o of s.level.obstacles) {
    if (y < o.top && distXZ(x, z, o.x, o.z) < o.r) return true;
  }
  return false;
}

function movePlayer(s, inp, edges, emit) {
  const c = s.cfg;
  const p = s.player;
  const L = s.level;

  if (p.respawn_wait > 0) {
    p.respawn_wait--;
    if (p.respawn_wait === 0) {
      [p.x, p.y, p.z] = L.start;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.grounded = true;
      p.facing = [...L.facing];
      p.dash_ticks = 0;
      p.launch = null;
      p.invuln = c.invuln_ticks;
    }
    return;
  }

  let [mx, mz] = inp.move;
  const len = Math.hypot(mx, mz);
  if (len > 1) {
    mx /= len;
    mz /= len;
  }
  const th = (inp.cam_yaw_deg * Math.PI) / 180;
  const wx = mx * Math.cos(th) + mz * Math.sin(th);
  const wz = -mx * Math.sin(th) + mz * Math.cos(th);
  const wlen = Math.hypot(wx, wz);
  const moving = wlen > 1e-9;
  if (moving) p.facing = [wx / wlen, wz / wlen];

  // Lướt: nhấn khi đang lướt bị bỏ qua; bùa → không hồi chiêu.
  if (edges.dash && p.dash_ticks === 0 && (p.dash_cd === 0 || p.charm > 0)) {
    p.dash_ticks = c.dash_ticks;
    p.dash_dir = moving ? [wx / wlen, wz / wlen] : [...p.facing];
    p.dash_cd = p.charm > 0 ? 0 : c.dash_cooldown_ticks;
    emit('dash', {});
  }

  const prevY = p.y;
  const prev = [p.x, p.z];
  let dashing = false;
  if (p.dash_ticks > 0) {
    // Lướt trên không giữ nguyên độ cao (cả khi đang bay từ bục nhảy).
    p.vx = p.dash_dir[0] * c.dash_speed;
    p.vz = p.dash_dir[1] * c.dash_speed;
    p.vy = 0;
    p.dash_ticks--;
    dashing = true;
  } else if (p.launch) {
    // Bay từ bục nhảy: vận tốc phóng giữ nguyên tới khi chạm đất (phím di chuyển không ghi đè).
    [p.vx, p.vz] = p.launch;
  } else {
    const speed = p.charm > 0 ? c.charm_speed : c.player_speed;
    p.vx = wx * speed; // tăng tốc/dừng tức thời (≤ 0.1 s), điều khiển trên không đầy đủ
    p.vz = wz * speed;
    if (edges.jump && p.grounded) {
      p.vy = c.jump_velocity;
      p.grounded = false;
    }
  }
  if (!dashing && !p.grounded) {
    p.vy -= c.gravity * DT;
    p.y += p.vy * DT;
  }

  // Di chuyển ngang, bị vách/tháp chặn (trượt theo từng trục).
  const nx = p.x + p.vx * DT;
  const nz = p.z + p.vz * DT;
  if (!blockedAt(s, nx, nz, p.y)) {
    p.x = nx;
    p.z = nz;
  } else if (!blockedAt(s, nx, p.z, p.y)) {
    p.x = nx;
  } else if (!blockedAt(s, p.x, nz, p.y)) {
    p.z = nz;
  }

  const g = groundAt(s, p.x, p.z);
  if (g === null && !c.fall_enabled) {
    // fall_enabled = false: chặn ở mép đảo.
    [p.x, p.z] = prev;
  } else if (p.grounded) {
    if (g === null || g < p.y - c.step_height) {
      // Bước ra khỏi mép (biển mây hoặc tầng thấp hơn) → rơi.
      p.grounded = false;
      if (!dashing) p.vy = 0;
    } else {
      p.y = g; // đi trên mặt phẳng hoặc dốc
    }
  } else if (g !== null && p.vy <= 0 && p.y <= g && prevY >= g - EPS) {
    p.y = g;
    p.vy = 0;
    p.grounded = true;
    p.launch = null;
  }

  // Bục nhảy: chân Mây chạm bục thì được bắn lên.
  if (p.grounded) {
    for (const pad of L.pads) {
      if (distXZ(p.x, p.z, pad.x, pad.z) <= pad.r && Math.abs(p.y - pad.y) < 0.05) {
        p.vy = pad.vy;
        p.launch = [...pad.h];
        p.grounded = false;
        break;
      }
    }
  }

  // Rơi khỏi đảo: đúng 1 lần, bỏ qua bất tử.
  if (p.y < c.fall_y) {
    const lost = p.carried;
    p.carried = 0;
    p.flames = Math.max(0, p.flames - 1);
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.dash_ticks = 0;
    p.launch = null;
    p.respawn_wait = c.respawn_wait_ticks;
    emit('player_hit', { by: 'fall', flames: p.flames, dropped: 0, lost });
  }
}

function moveShades(s) {
  const c = s.cfg;
  const p = s.player;
  for (const sh of s.shades) {
    if (sh.evict || sh.state === 'spawning') continue;
    if (sh.state === 'stunned') {
      if (sh.push_left > 0) {
        const step = c.pulse_push_m / c.pulse_push_ticks;
        moveShadeBy(s, sh, sh.push_dir[0] * step, sh.push_dir[1] * step);
        sh.push_left--;
      }
      continue;
    }
    if (sh.state === 'recoil') {
      const step = c.recoil_m / c.recoil_ticks;
      moveShadeBy(s, sh, sh.recoil_dir[0] * step, sh.recoil_dir[1] * step);
      sh.t--;
      if (sh.t <= 0) resolveShadeState(s, sh);
      continue;
    }
    const d = distXZ(sh.x, sh.z, p.x, p.z);
    if (sh.state === 'drain') {
      const l = s.lanterns.find((x) => x.id === sh.drain_lantern);
      if (d <= c.drain_break_m) {
        sh.state = 'chase';
        sh.drain_lantern = null;
      } else if (!l || !isWeak(c, l) || distXZ(sh.x, sh.z, l.x, l.z) > c.drain_reach_m) {
        sh.state = 'wander';
        sh.drain_lantern = null;
      } else {
        continue; // đứng yên hút dầu (lượng hút trừ ở bước 2)
      }
    }
    if (sh.state === 'wander' && d <= c.shade_detect_m && !s.bench) sh.state = 'chase'; // bench: giữ wander
    else if (sh.state === 'chase' && d > c.shade_lose_m) {
      sh.state = 'wander';
      sh.target = null;
    }
    if (sh.state === 'chase') {
      moveTowards(s, sh, p.x, p.z, s.shade_speed);
      continue;
    }
    // wander: đèn sáng có fuel < 30 gần nhất → tới hút; không có thì đi về đèn tắt gần nhất;
    // không còn đèn tắt thì lượn quanh điểm sinh.
    const weak = nearest(s.lanterns.filter((l) => isWeak(c, l)), sh.x, sh.z);
    if (weak) {
      if (weak.d > c.drain_reach_m) moveTowards(s, sh, weak.l.x, weak.l.z, c.shade_wander_speed);
      if (distXZ(sh.x, sh.z, weak.l.x, weak.l.z) <= c.drain_reach_m) {
        sh.state = 'drain';
        sh.drain_lantern = weak.l.id;
        sh.drain_ticks = 0;
        sh.target = null;
      }
      continue;
    }
    const dark = nearest(s.lanterns.filter((l) => !l.lit), sh.x, sh.z);
    if (dark) {
      if (dark.d > c.drain_reach_m) {
        const [ux, uz] = unit(dark.l.x - sh.x, dark.l.z - sh.z);
        moveTowards(s, sh, dark.l.x - ux * c.drain_reach_m, dark.l.z - uz * c.drain_reach_m, c.shade_wander_speed);
      }
      sh.target = null;
    } else {
      if (!sh.target) {
        const a = s.rng() * Math.PI * 2;
        const r = s.rng() * c.shade_wander_radius;
        sh.target = [sh.home[0] + r * Math.cos(a), sh.home[1] + r * Math.sin(a)];
      }
      const left = moveTowards(s, sh, sh.target[0], sh.target[1], c.shade_wander_speed);
      if (left <= EPS) sh.target = null;
    }
  }
}

function updateSafeZones(s) {
  const R = s.cfg.safe_radius;
  for (const sh of s.shades) {
    if (!sh.evict) {
      for (const l of s.lanterns) {
        if (hasSafeZone(s.cfg, l) && distXZ(sh.x, sh.z, l.x, l.z) < R - EPS) {
          sh.evict = { lantern: l, left: s.cfg.safe_evict_ticks };
          if (sh.state === 'drain') {
            sh.state = 'wander';
            sh.drain_lantern = null;
          }
          break;
        }
      }
    }
    if (!sh.evict) continue;
    const l = sh.evict.lantern;
    const d = distXZ(sh.x, sh.z, l.x, l.z);
    const need = R - d;
    if (need > EPS) {
      const [ux, uz] = unit(sh.x - l.x, sh.z - l.z);
      const len = need / sh.evict.left; // đều tay, tới mép đúng sau tối đa safe_evict_ticks tick
      sh.x += ux * len;
      sh.z += uz * len;
      sh.y = (groundAt(s, sh.x, sh.z) ?? 0) + s.cfg.shade_height;
      sh.evict.left--;
    }
    if (R - distXZ(sh.x, sh.z, l.x, l.z) <= 1e-6 || sh.evict.left <= 0) sh.evict = null;
  }
}

function spawnShades(s, st, emit) {
  const c = s.cfg;
  const sched = s.level.shade_schedule;
  if (st < sched.first_tick || (st - sched.first_tick) % sched.every_ticks !== 0) return;
  const count = st === sched.first_tick ? sched.first_count : 1;
  const p = s.player;
  const used = new Set();
  for (let i = 0; i < count; i++) {
    if (s.shades.length >= sched.max) return;
    const valid = [];
    s.level.shade_points.forEach(([x, , z], idx) => {
      if (!used.has(idx) && distXZ(x, z, p.x, p.z) >= c.shade_spawn_min_dist) valid.push(idx);
    });
    if (valid.length === 0) return; // hết điểm hợp lệ thì bỏ lượt
    const idx = valid[Math.floor(s.rng() * valid.length)];
    used.add(idx);
    const [x, , z] = s.level.shade_points[idx];
    const sh = newShade(s, `S${s.nextShadeId++}`, x, z, 'spawning', c.shade_spawning_ticks);
    s.shades.push(sh);
    emit('shade_spawned', { id: sh.id });
  }
}

function spawnMote(s, st) {
  const c = s.cfg;
  if (st % c.mote_spawn_every_ticks !== 0 || s.motes.length >= c.mote_cap) return;
  const taken = new Set(s.motes.filter((m) => m.point >= 0).map((m) => m.point));
  const free = [];
  s.level.mote_points.forEach((_, i) => {
    if (!taken.has(i)) free.push(i);
  });
  if (free.length === 0) return; // hết điểm trống thì bỏ lượt
  const i = free[Math.floor(s.rng() * free.length)];
  const [x, y, z] = s.level.mote_points[i];
  addMote(s, x, y, z, 'random', i);
}

export function step(s, inp) {
  if (s.state === 'won' || s.state === 'lost') return [];
  const c = s.cfg;
  const p = s.player;
  s.tick += 1;
  const t = s.tick;
  const events = [];
  const emit = (name, data) => events.push({ type: 'event', tick: t, name, data });

  // 1. Đọc input; xử lý pause trước.
  const edge = (k) => inp[k] === true && !s.prevButtons[k];
  const edges = {
    jump: edge('jump'), interact: edge('interact'), pulse: edge('pulse'), dash: edge('dash'), pause: edge('pause'),
  };
  s.prevButtons = {
    jump: !!inp.jump, interact: !!inp.interact, pulse: !!inp.pulse, dash: !!inp.dash, pause: !!inp.pause,
  };
  if (edges.pause) {
    if (!s.paused) {
      s.paused = true;
      s.state = 'paused';
      emit('paused', {});
      return events; // vừa tạm dừng thì dừng bước ở đây
    }
    s.paused = false;
    s.state = 'playing';
    emit('resumed', {});
  } else if (s.paused) {
    return events; // tick tăng, sim_tick/thời gian/hồi chiêu/spawn/TTL đứng yên
  }
  s.sim_tick += 1;
  const st = s.sim_tick;

  // 2. Bộ đếm.
  if (s.time_left_ticks > 0) s.time_left_ticks--;
  if (p.dash_cd > 0) p.dash_cd--;
  if (p.pulse_cd > 0) p.pulse_cd--;
  if (p.invuln > 0) p.invuln--;
  if (p.charm > 0) p.charm--;
  for (const sh of s.shades) {
    if (sh.state === 'spawning' || sh.state === 'stunned') {
      sh.t--;
      if (sh.t <= 0) {
        // Hết spawning hoặc hết choáng → wander (TICKET-03: "Hết choáng thì về wander").
        sh.state = 'wander';
        sh.t = 0;
        sh.push_left = 0;
        sh.target = null;
      }
    }
  }
  // Dầu: hao fuel_decay mỗi tick + mỗi Bóng Mực đang drain hút thêm drain_u (cộng dồn). Bench: tắt hao dầu.
  for (const l of s.lanterns) {
    if (!l.lit || s.bench) continue;
    const drainers = s.shades.filter((sh) => sh.state === 'drain' && sh.drain_lantern === l.id);
    l.fuel -= c.fuel_decay_u + c.drain_u * drainers.length;
    for (const sh of drainers) {
      sh.drain_ticks++;
      if (sh.drain_ticks % c.fuel_drain_event_ticks === 0) {
        emit('fuel_drain', { lantern_id: l.id, shade_id: sh.id, fuel: fuelOut(Math.max(0, l.fuel)) });
      }
    }
  }
  // Ngay sau bước 2: đèn có fuel ≤ 0 tắt (nhớ ever_lit).
  for (const l of s.lanterns) {
    if (l.lit && l.fuel <= 0) {
      l.lit = false;
      l.fuel = 0;
      l.deposited = 0;
      l.ever_lit = true;
      emit('lantern_out', { lantern_id: l.id });
    }
  }
  for (const m of s.motes) if (m.kind === 'dropped') m.ttl--;
  s.motes = s.motes.filter((m) => m.kind !== 'dropped' || m.ttl > 0);

  // 3. Di chuyển Mây (nhảy, lướt) rồi kiểm tra rơi khỏi đảo.
  movePlayer(s, inp, edges, emit);
  const active = p.respawn_wait === 0;

  // 4. Nhặt đom đóm (XZ ≤ pickup_radius và chênh cao ≤ 1.5 m), theo id tăng dần.
  if (active && !s.bench) {
    s.motes = s.motes.filter((m) => {
      if (p.carried >= capacityOf(c, p)) return true;
      if (distXZ(p.x, p.z, m.x, m.z) > c.pickup_radius) return true;
      if (Math.abs(p.y - m.y) > c.mote_height_tolerance) return true;
      p.carried++;
      emit('mote_picked', { carried: p.carried });
      return false;
    });
  }

  // 5. Tương tác với đèn: chưa sáng, gần nhất trong interact_radius, bằng nhau → id nhỏ hơn.
  if (active && edges.interact) {
    const best = pickInteractLantern(s);
    if (best && best.lit) {
      // Châm dầu: used = min(đang mang, ceil((100 − fuel) / 10)).
      const used = Math.min(p.carried, Math.ceil((c.fuel_max_u - best.fuel) / c.fuel_per_mote_u));
      if (used > 0) {
        p.carried -= used;
        best.fuel = Math.min(c.fuel_max_u, best.fuel + used * c.fuel_per_mote_u);
        s.score += c.score.per_mote * used;
        emit('refuel', { lantern_id: best.id, amount: used, fuel: fuelOut(best.fuel) });
      }
    } else if (best) {
      const relight = best.ever_lit;
      const cost = relight ? c.relight_cost : c.lantern_cost;
      const amount = Math.min(p.carried, cost - best.deposited);
      if (amount > 0) {
        p.carried -= amount;
        best.deposited += amount;
        s.score += c.score.per_mote * amount;
        emit('deposit', { lantern_id: best.id, amount, deposited: best.deposited });
        if (best.deposited >= cost) {
          best.lit = true;
          best.fuel = c.fuel_max_u;
          best.ever_lit = true;
          if (relight) best.relit_count++;
          p.successful_lights++;
          s.score += relight ? c.score.per_relight : c.score.per_lantern;
          emit('lantern_lit', { lantern_id: best.id, relight });
        }
      }
    }
  }

  // 6. Vùng an toàn.
  updateSafeZones(s);

  // 7. Tỏa Sáng: tâm = chân Mây + 0.8 m, khoảng cách 3D tới tâm Bóng Mực ≤ pulse_radius.
  if (active && edges.pulse && p.pulse_cd === 0 && p.carried >= c.pulse_cost) {
    p.carried -= c.pulse_cost;
    const cy = p.y + c.pulse_center_dy;
    const ids = [];
    for (const sh of s.shades) {
      const d3 = Math.hypot(sh.x - p.x, sh.y - cy, sh.z - p.z);
      if (d3 > c.pulse_radius) continue;
      s.score += sh.state === 'drain' ? c.score.per_stun_drain : c.score.per_stun;
      sh.drain_lantern = null;
      sh.state = 'stunned';
      sh.t = c.stun_ticks;
      sh.push_left = c.pulse_push_ticks;
      sh.push_dir = unit(sh.x - p.x, sh.z - p.z);
      sh.target = null;
      ids.push(sh.id);
    }
    p.pulse_cd = c.pulse_cooldown_ticks;
    emit('pulse', { stunned_ids: ids });
  }

  // 8. Di chuyển Bóng Mực.
  moveShades(s);

  // 9. Chạm: Bóng Mực gây hit theo id tăng dần, tối đa 1 lần mỗi tick.
  if (active && !s.bench && p.invuln === 0 && p.flames > 0) {
    const hitter = [...s.shades].sort(byId).find((sh) => !sh.evict
      && (sh.state === 'wander' || sh.state === 'chase')
      && distXZ(p.x, p.z, sh.x, sh.z) <= c.shade_hit_radius
      && Math.abs(sh.y - p.y) <= c.shade_hit_dy);
    if (hitter) {
      p.flames -= 1;
      const dropped = Math.floor(p.carried * c.hit_drop_ratio);
      p.carried -= dropped;
      dropMotes(s, dropped);
      p.invuln = c.invuln_ticks;
      emit('player_hit', { by: 'shade', flames: p.flames, dropped });
      hitter.state = 'recoil';
      hitter.t = c.recoil_ticks;
      hitter.recoil_dir = unit(hitter.x - p.x, hitter.z - p.z);
      hitter.target = null;
    }
  }

  // 10. Sinh đom đóm, Bóng Mực theo lịch (thực thể mới chỉ tương tác được từ tick sau).
  if (s.random_motes && !s.bench) spawnMote(s, st);
  if (s.random_shades) spawnShades(s, st, emit);

  // 11. Thắng/thua (sau mọi cập nhật của tick, kể cả tick bình minh):
  //     hết lửa → luôn thua no_flames trước; hết giờ → thắng dawn_survived nếu số đèn đang sáng
  //     ≥ ceil(win_ratio × tổng đèn), ngược lại thua dawn. Không còn thắng sớm khi thắp đủ đèn.
  let over = null;
  if (s.bench) {
    // Bench: tắt điều kiện kết thúc Đêm.
  } else if (p.flames <= 0) {
    over = { result: 'lost', reason: 'no_flames' };
  } else if (s.time_left_ticks <= 0) {
    const lit = s.lanterns.filter((l) => l.lit);
    if (lit.length >= Math.ceil(c.win_ratio * s.lanterns.length)) {
      over = { result: 'won', reason: 'dawn_survived' };
      for (const l of lit) s.score += c.score.per_lantern_dawn + Math.floor(l.fuel / FUEL_UNIT);
      s.score += c.score.per_flame_left * p.flames;
    } else {
      over = { result: 'lost', reason: 'dawn' };
    }
  }
  if (over) {
    s.state = over.result;
    s.result = over;
    emit('game_over', over);
  }
  return events;
}

export function snapshot(s) {
  const p = s.player;
  return {
    type: 'snapshot',
    tick: s.tick,
    sim_tick: s.sim_tick,
    night: s.night,
    state: s.state,
    time_left_s: r3(s.time_left_ticks / TICK_RATE),
    score: s.score,
    wind: { active: s.wind.active, dir_deg: s.wind.dir_deg },
    player: {
      pos: [r3(p.x), r3(p.y), r3(p.z)],
      vel: [r3(p.vx), r3(p.vy), r3(p.vz)],
      grounded: p.grounded,
      invuln: p.invuln > 0 || p.respawn_wait > 0,
      flames: p.flames,
      carried: p.carried,
      capacity: capacityOf(s.cfg, p),
      dash_cd_s: r3(p.dash_cd / TICK_RATE),
      pulse_cd_s: r3(p.pulse_cd / TICK_RATE),
      charm_s: r3(p.charm / TICK_RATE),
    },
    lanterns: s.lanterns.map((l) => ({
      id: l.id,
      pos: [r3(l.x), r3(l.y), r3(l.z)],
      lit: l.lit,
      deposited: l.deposited,
      fuel: l.lit ? fuelOut(l.fuel) : 0,
      ever_lit: l.ever_lit,
      relit_count: l.relit_count,
    })),
    shades: s.shades.map((sh) => ({ id: sh.id, pos: [r3(sh.x), r3(sh.y), r3(sh.z)], state: sh.state })),
    motes_active: s.motes.length,
    motes: s.motes.map((m) => ({
      id: m.id,
      pos: [r3(m.x), r3(m.y), r3(m.z)],
      kind: m.kind,
      ttl_s: m.kind === 'dropped' ? r3(m.ttl / TICK_RATE) : null,
    })),
    drifters: s.drifters.map((d) => ({ id: d.id, pos: [r3(d.x), r3(d.y), r3(d.z)], state: d.state, stolen: d.stolen })),
    charms: s.charms.map((ch) => ({ id: ch.id, available: ch.available, respawn_s: r3(ch.respawn / TICK_RATE) })),
  };
}
