#!/usr/bin/env node
// Soak test (TICKET-04 mục 2): chạy headless nhiều Đêm liên tiếp trong cùng một tiến trình.
//   node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json
// Đêm thứ i (0-based) là Đêm 1 + (i mod 3), seed = seed + i. Input ngẫu nhiên theo seed (mulberry32):
// mỗi 30 tick chọn lại hướng di chuyển; mỗi tick xác suất 5% nhảy, 3% lướt, 2% tỏa sáng, 10% tương tác.
// Mỗi Đêm chạy tới khi kết thúc (thắng/thua), trần là thời lượng chuẩn của Đêm.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createConfig, createLevel, step, mulberry32, TICK_RATE } from './logic/index.js';

const CONTRACT_PATH = fileURLToPath(new URL('../game.contract.json', import.meta.url));
const MB = 1024 * 1024;

class ArgError extends Error {}

function parseArgs(argv) {
  const raw = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!['--seed', '--nights', '--out'].includes(k)) throw new ArgError(`unknown argument: ${k}`);
    if (v === undefined || v.startsWith('--')) throw new ArgError(`${k} requires a value`);
    raw[k.slice(2)] = v;
  }
  for (const k of ['seed', 'nights', 'out']) if (!(k in raw)) throw new ArgError(`missing required --${k}`);
  if (!/^-?\d+$/.test(raw.seed)) throw new ArgError('--seed requires an integer');
  if (!/^\d+$/.test(raw.nights) || Number(raw.nights) < 1) throw new ArgError('--nights must be an integer >= 1');
  return { seed: Number(raw.seed), nights: Number(raw.nights), out: raw.out };
}

// RSS (MB) sau khi dọn rác nếu có --expose-gc, để số đo ổn định.
function rssMb() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
    globalThis.gc();
  }
  return process.memoryUsage().rss / MB;
}

// Bộ sinh input ngẫu nhiên theo seed, đúng tỉ lệ ticket.
function createRandomInput(seed) {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  let move = [0, 0];
  return (tick) => {
    if (tick % 30 === 0) {
      const a = rng() * Math.PI * 2;
      move = [Math.cos(a), Math.sin(a)];
    }
    return {
      move,
      cam_yaw_deg: 0,
      jump: rng() < 0.05,
      dash: rng() < 0.03,
      pulse: rng() < 0.02,
      interact: rng() < 0.10,
      pause: false,
    };
  };
}

// Chạy một Đêm tới khi kết thúc; trả về { result: 'won' | 'lost', reason, ticks }.
function runNight(cfg, night, seed, onLoaded) {
  const s = createLevel(cfg, seed, night);
  if (onLoaded) onLoaded();
  const input = createRandomInput(seed);
  const maxTicks = cfg.night_ticks_by_night[night];
  for (let k = 0; k < maxTicks && s.state !== 'won' && s.state !== 'lost'; k++) step(s, input(k));
  if (s.state !== 'won' && s.state !== 'lost') throw new Error(`night ${night} did not end after ${maxTicks} ticks`);
  return { result: s.state, reason: s.result.reason, ticks: s.tick };
}

export function soak({ seed, nights }) {
  const cfg = createConfig(JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8')).tuning);
  const t0 = performance.now();
  const results = [];
  const details = [];
  let crashes = 0;
  let memStart = null;
  for (let i = 0; i < nights; i++) {
    const night = 1 + (i % 3);
    try {
      const r = runNight(cfg, night, seed + i, i === 0 ? () => { memStart = rssMb(); } : null);
      results.push(r.result);
      details.push({ night, seed: seed + i, ...r });
    } catch (e) {
      crashes++;
      results.push('crash');
      details.push({ night, seed: seed + i, result: 'crash', error: String(e.message ?? e) });
      process.stderr.write(`soak: night #${i + 1} (Đêm ${night}, seed ${seed + i}) crashed: ${e.stack ?? e}\n`);
      if (memStart === null) memStart = rssMb();
    }
  }
  // Trạng thái Đêm cuối đã ra khỏi phạm vi (reset xong) → đo RSS.
  const memEnd = rssMb();
  const r1 = (v) => Math.round(v * 10) / 10;
  return {
    nights,
    crashes,
    results,
    mem_start_mb: r1(memStart),
    mem_end_mb: r1(memEnd),
    duration_s: r1((performance.now() - t0) / 1000),
    seed,
    night_order: results.map((_, i) => 1 + (i % 3)),
    details,
    gc_exposed: typeof globalThis.gc === 'function',
    tick_rate: TICK_RATE,
  };
}

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const out = soak(opts);
    fs.writeFileSync(opts.out, JSON.stringify(out, null, 2) + '\n');
    process.exit(0);
  } catch (e) {
    process.stderr.write(`soak: ${e.message}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main();
