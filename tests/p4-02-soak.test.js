// P4-02: soak với số Đêm nhỏ (3 Đêm = đủ Đêm 1, 2, 3): crashes 0, mem_end ≤ 1.2 × mem_start,
// tất định theo seed. Bản chạy thật 10 Đêm lưu ở docs/proof/phase-4/soak.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './helpers.js';

function runSoak(args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddl-soak-'));
  const out = path.join(dir, 'soak.json');
  const r = spawnSync(process.execPath, ['--expose-gc', path.join(ROOT, 'src', 'soak.js'), ...args, '--out', out], {
    encoding: 'utf8',
  });
  const json = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  fs.rmSync(dir, { recursive: true, force: true });
  return { status: r.status, stderr: r.stderr, json };
}

test('P4-02: soak 3 Đêm (1 → 2 → 3) không crash, bộ nhớ không phình', () => {
  const r = runSoak(['--seed', '7', '--nights', '3']);
  assert.equal(r.status, 0, r.stderr);
  const j = r.json;
  assert.equal(j.nights, 3);
  assert.equal(j.crashes, 0, r.stderr);
  assert.deepEqual(j.night_order, [1, 2, 3]);
  assert.equal(j.results.length, 3);
  for (const x of j.results) assert.ok(['won', 'lost'].includes(x), x);
  for (const k of ['mem_start_mb', 'mem_end_mb', 'duration_s']) assert.equal(typeof j[k], 'number', k);
  assert.ok(j.mem_end_mb <= 1.2 * j.mem_start_mb, `mem_end ${j.mem_end_mb} > 1.2 × mem_start ${j.mem_start_mb}`);

  // Cùng seed → cùng kết quả.
  const again = runSoak(['--seed', '7', '--nights', '3']);
  assert.deepEqual(again.json.results, j.results);
});

test('P4-02: tham số sai → exit khác 0', () => {
  assert.notEqual(runSoak(['--seed', '7', '--nights', '0']).status, 0);
  assert.notEqual(runSoak(['--nights', '2']).status, 0);
});
