// Tiện ích chạy headless thật (tiến trình con) và đọc JSONL.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const HEADLESS = path.join(ROOT, 'src', 'headless.js');
export const scenario = (name) => path.join(ROOT, 'scenarios', name);
export const contract = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'game.contract.json'), 'utf8'));

export function runHeadless({ seed = 1, night = 1, ticks, scenario: sc, inputs, every } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddl-'));
  const out = path.join(dir, 'out.jsonl');
  const args = [HEADLESS, '--seed', String(seed), '--night', String(night), '--ticks', String(ticks), '--out', out];
  if (sc) args.push('--scenario', scenario(sc));
  if (inputs) args.push('--inputs', scenario(inputs));
  if (every) args.push('--snapshot-every', String(every));
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const text = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  fs.rmSync(dir, { recursive: true, force: true });
  const lines = text.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return {
    status: r.status,
    stderr: r.stderr,
    text,
    lines,
    events: lines.filter((l) => l.type === 'event'),
    snapshots: lines.filter((l) => l.type === 'snapshot'),
    end: lines[lines.length - 1],
  };
}

export const eventsNamed = (res, name) => res.events.filter((e) => e.name === name);
export const snapshotAt = (res, tick) => res.snapshots.find((s) => s.tick === tick);
