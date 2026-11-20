// Kiểm tra định dạng file inputs / scenario (Contract v1.1). Sai định dạng → FormatError (headless thoát mã 2).

export class FormatError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'FormatError';
  }
}

const fail = (msg) => {
  throw new FormatError(msg);
};
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;

function checkVec3(v, where) {
  if (!Array.isArray(v) || v.length !== 3 || !v.every(isNum)) fail(`${where} must be [x, y, z] numbers`);
}

export const BUTTONS = ['jump', 'interact', 'pulse', 'dash', 'pause'];
export const SHADE_STATES = ['spawning', 'wander', 'chase', 'recoil', 'stunned', 'drain'];

export function validateInputs(obj) {
  if (!isObj(obj) || !Array.isArray(obj.frames)) fail('inputs: "frames" array required');
  let prev = -1;
  obj.frames.forEach((f, i) => {
    const w = `inputs.frames[${i}]`;
    if (!isObj(f)) fail(`${w} must be an object`);
    if (!isNonNegInt(f.tick)) fail(`${w}.tick must be a non-negative integer`);
    if (f.tick <= prev) fail(`${w}.tick must be strictly increasing (got ${f.tick} after ${prev})`);
    prev = f.tick;
    if ('move' in f) {
      const m = f.move;
      if (!Array.isArray(m) || m.length !== 2 || !m.every(isNum)) fail(`${w}.move must be [x, z] numbers`);
      if (m.some((c) => c < -1 || c > 1)) fail(`${w}.move components must be in [-1, 1]`);
    }
    if ('cam_yaw_deg' in f && !isNum(f.cam_yaw_deg)) fail(`${w}.cam_yaw_deg must be a number`);
    for (const b of BUTTONS) {
      if (b in f && typeof f[b] !== 'boolean') fail(`${w}.${b} must be boolean`);
    }
  });
  return obj.frames;
}

export function validateScenario(obj, lanternIds) {
  if (!isObj(obj)) fail('scenario must be an object');
  if ('player' in obj) {
    const p = obj.player;
    if (!isObj(p)) fail('scenario.player must be an object');
    if ('pos' in p) checkVec3(p.pos, 'scenario.player.pos');
    for (const k of ['carried', 'flames', 'invuln_ticks', 'dash_cd_ticks', 'pulse_cd_ticks', 'charm_ticks', 'successful_lights']) {
      if (k in p && !isNonNegInt(p[k])) fail(`scenario.player.${k} must be a non-negative integer`);
    }
  }
  for (const k of ['random_motes', 'random_shades', 'random_drifters', 'wind_enabled']) {
    if (k in obj && typeof obj[k] !== 'boolean') fail(`scenario.${k} must be boolean`);
  }
  if ('motes' in obj) {
    if (!Array.isArray(obj.motes)) fail('scenario.motes must be an array');
    obj.motes.forEach((m, i) => checkVec3(m, `scenario.motes[${i}]`));
  }
  if ('shades' in obj) {
    if (!Array.isArray(obj.shades)) fail('scenario.shades must be an array');
    const seen = new Set();
    obj.shades.forEach((s, i) => {
      const w = `scenario.shades[${i}]`;
      if (!isObj(s)) fail(`${w} must be an object`);
      checkVec3(s.pos, `${w}.pos`);
      if ('id' in s) {
        if (typeof s.id !== 'string' || s.id === '') fail(`${w}.id must be a non-empty string`);
        if (seen.has(s.id)) fail(`${w}.id duplicated: ${s.id}`);
        seen.add(s.id);
      }
      if ('state' in s && !SHADE_STATES.includes(s.state)) fail(`${w}.state must be one of ${SHADE_STATES.join(', ')}`);
      if ('target_lantern_id' in s && !lanternIds.includes(s.target_lantern_id)) {
        fail(`${w}.target_lantern_id must be one of ${lanternIds.join(', ')}`);
      }
      if (s.state === 'drain' && !('target_lantern_id' in s)) fail(`${w}: state drain requires target_lantern_id`);
      if ('state_ticks_left' in s && !isNonNegInt(s.state_ticks_left)) {
        fail(`${w}.state_ticks_left must be a non-negative integer`);
      }
    });
  }
  for (const k of ['drifters', 'charms']) {
    if (k in obj && !Array.isArray(obj[k])) fail(`scenario.${k} must be an array`);
  }
  if ('lanterns' in obj) {
    if (!Array.isArray(obj.lanterns)) fail('scenario.lanterns must be an array');
    obj.lanterns.forEach((l, i) => {
      const w = `scenario.lanterns[${i}]`;
      if (!isObj(l)) fail(`${w} must be an object`);
      if (typeof l.id !== 'string' || !lanternIds.includes(l.id)) {
        fail(`${w}.id must be one of ${lanternIds.join(', ')}`);
      }
      if ('pos' in l) checkVec3(l.pos, `${w}.pos`);
      if ('deposited' in l && !isNonNegInt(l.deposited)) fail(`${w}.deposited must be a non-negative integer`);
      if ('lit' in l && typeof l.lit !== 'boolean') fail(`${w}.lit must be boolean`);
      if ('ever_lit' in l && typeof l.ever_lit !== 'boolean') fail(`${w}.ever_lit must be boolean`);
      if ('fuel' in l && !(isNum(l.fuel) && l.fuel >= 0 && l.fuel <= 100)) fail(`${w}.fuel must be a number in [0, 100]`);
    });
  }
  if ('time_left_s' in obj && !(isNum(obj.time_left_s) && obj.time_left_s >= 0)) {
    fail('scenario.time_left_s must be a non-negative number');
  }
  return obj;
}
