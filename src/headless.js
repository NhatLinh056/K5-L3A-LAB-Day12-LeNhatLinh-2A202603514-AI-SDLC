#!/usr/bin/env node
// Headless theo Test Contract v1.1 (TICKET-02 Phần 4; nền v1.0 ở PRD-0 mục B–E).
// node src/headless.js --seed <int> --night 1|2|3 [--scenario f] [--inputs f] --ticks N --out f.jsonl [--snapshot-every n]
// Exit: 0 xong · 1 tham số sai / không đọc được file / tính năng chưa cài · 2 file inputs/scenario sai định dạng.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  createConfig, createLevel, applyScenario, createInputTimeline, validateInputs,
  step, snapshot, FormatError,
} from './logic/index.js';

const CONTRACT_PATH = fileURLToPath(new URL('../game.contract.json', import.meta.url));
const EXIT_ARGS = 1;
const EXIT_FORMAT = 2;

class ArgError extends Error {}

function parseIntArg(name, v, min) {
  if (v === undefined || !/^-?\d+$/.test(v)) throw new ArgError(`--${name} requires an integer`);
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < min) throw new ArgError(`--${name} must be an integer >= ${min}`);
  return n;
}

function parseArgs(argv) {
  const known = new Set(['seed', 'night', 'scenario', 'inputs', 'ticks', 'out', 'snapshot-every']);
  const raw = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--') || !known.has(a.slice(2))) throw new ArgError(`unknown argument: ${a}`);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new ArgError(`${a} requires a value`);
    raw[a.slice(2)] = v;
    i++;
  }
  for (const req of ['seed', 'night', 'ticks', 'out']) {
    if (!(req in raw)) throw new ArgError(`missing required --${req}`);
  }
  const night = parseIntArg('night', raw.night, 1);
  if (![1, 2, 3].includes(night)) throw new ArgError('--night must be 1, 2 or 3');
  return {
    night,
    seed: parseIntArg('seed', raw.seed, Number.MIN_SAFE_INTEGER),
    ticks: parseIntArg('ticks', raw.ticks, 0),
    every: 'snapshot-every' in raw ? parseIntArg('snapshot-every', raw['snapshot-every'], 1) : 10,
    scenario: raw.scenario,
    inputs: raw.inputs,
    out: raw.out,
  };
}

function readJson(path, label) {
  let text;
  try {
    text = fs.readFileSync(path, 'utf8');
  } catch (e) {
    throw new ArgError(`cannot read ${label} file ${path}: ${e.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new FormatError(`${label} file is not valid JSON: ${e.message}`);
  }
}

export function run(opts) {
  const cfg = createConfig(readJson(CONTRACT_PATH, 'contract').tuning);
  const s = createLevel(cfg, opts.seed, opts.night);
  if (opts.scenario) applyScenario(s, readJson(opts.scenario, 'scenario'));
  const frames = opts.inputs ? validateInputs(readJson(opts.inputs, 'inputs')) : [];
  const timeline = createInputTimeline(frames);

  const ended = () => s.state === 'won' || s.state === 'lost';
  const lines = [
    JSON.stringify(snapshot(s)),
    JSON.stringify({ type: 'event', tick: 0, name: 'night_start', data: { night: s.night } }),
  ];
  for (let k = 0; k < opts.ticks && !ended(); k++) {
    for (const ev of step(s, timeline.at(k))) lines.push(JSON.stringify(ev));
    if (s.tick % opts.every === 0) lines.push(JSON.stringify(snapshot(s)));
  }
  lines.push(JSON.stringify({ type: 'end', ticks: s.tick, state: s.state, score: s.score }));
  return lines.join('\n') + '\n';
}

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const out = run(opts);
    fs.writeFileSync(opts.out, out);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`headless: ${e.message}\n`);
    process.exit(e instanceof FormatError ? EXIT_FORMAT : EXIT_ARGS);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main();
