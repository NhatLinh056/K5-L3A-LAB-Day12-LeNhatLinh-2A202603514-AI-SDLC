// P4-05: bảng xếp hạng: tên sai bị từ chối; top 10; sắp score giảm dần, bằng điểm thì ai đạt trước đứng trên;
// export đúng thứ tự. P4-06: còn dữ liệu sau khi tắt/mở lại server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './helpers.js';
import { validateName, validateEntry, addEntry, isoWithOffset, MAX_ENTRIES } from '../src/leaderboard.js';

const SERVE = path.join(ROOT, 'tools', 'serve.js');
const entry = (name, score, achieved_at, extra = {}) => ({ name, score, nights_won: 1, achieved_at, seed: 1, ...extra });

test('P4-05: kiểm tra tên', () => {
  for (const ok of ['Moc', 'May_2026', 'ABCDEFGHIJKL', 'Mây_Đêm', 'Đăng']) assert.equal(validateName(ok), null, ok);
  for (const bad of ['ab', 'ABCDEFGHIJKLM', 'có dấu cách', 'a-b-c', 'tên!', '', '   ', 123, null]) {
    assert.notEqual(validateName(bad), null, String(bad));
  }
});

test('P4-05: kiểm tra mục (score, nights_won, achieved_at có múi giờ, seed)', () => {
  const t = '2026-11-20T10:00:00+07:00';
  assert.equal(validateEntry(entry('Moc', 10, t)), null);
  assert.notEqual(validateEntry(entry('Moc', -1, t)), null);
  assert.notEqual(validateEntry(entry('Moc', 1.5, t)), null);
  assert.notEqual(validateEntry(entry('Moc', 10, t, { nights_won: 4 })), null);
  assert.notEqual(validateEntry(entry('Moc', 10, '2026-11-20T10:00:00')), null, 'thiếu múi giờ');
  assert.notEqual(validateEntry(entry('Moc', 10, t, { seed: 'x' })), null);
  assert.match(isoWithOffset(new Date()), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
});

test('P4-05: sắp xếp, bằng điểm thì ai đạt trước đứng trên, giữ top 10', () => {
  let entries = [];
  const add = (e) => {
    const r = addEntry(entries, e);
    entries = r.entries;
    return r.rank;
  };
  add(entry('Bao', 100, '2026-11-20T10:05:00+07:00'));
  add(entry('Anh', 100, '2026-11-20T10:00:00+07:00')); // cùng điểm, đạt sớm hơn
  add(entry('Cuc', 300, '2026-11-20T11:00:00+07:00'));
  assert.deepEqual(entries.map((e) => e.name), ['Cuc', 'Anh', 'Bao']);
  // Cùng thời điểm → mục có trước đứng trên (sort ổn định).
  add(entry('Dau', 100, '2026-11-20T10:00:00+07:00'));
  assert.deepEqual(entries.map((e) => e.name), ['Cuc', 'Anh', 'Dau', 'Bao']);
  // Múi giờ khác nhau vẫn so đúng thời điểm thật: 03:59Z sớm hơn 11:00+07:00 (04:00Z).
  add(entry('Gio', 300, '2026-11-20T03:59:00Z'));
  assert.equal(entries[0].name, 'Gio');

  for (let i = 0; i < 12; i++) add(entry(`P_${i}`, 50 + i, `2026-11-20T12:${String(i).padStart(2, '0')}:00+07:00`));
  assert.equal(entries.length, MAX_ENTRIES);
  const scores = entries.map((e) => e.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.equal(add(entry('Thap', 1, '2026-11-20T13:00:00+07:00')), null, 'điểm thấp không vào top 10');
  assert.equal(add(entry('Cao', 1000, '2026-11-20T13:00:00+07:00')), 1);
});

// ---------- Server thật (API + lưu file + export) ----------
function startServer(file) {
  return new Promise((resolve, reject) => {
    const port = 20000 + Math.floor(Math.random() * 20000);
    const child = spawn(process.execPath, [SERVE], {
      env: { ...process.env, PORT: String(port), LEADERBOARD_FILE: file }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let buf = '';
    child.stdout.on('data', (d) => {
      buf += d;
      const m = /:(\d+)\//.exec(buf);
      if (m) resolve({ child, base: `http://127.0.0.1:${m[1]}` });
    });
    child.on('exit', (c) => reject(new Error(`server exited ${c}`)));
    setTimeout(() => reject(new Error('server timeout')), 10_000);
  });
}
const stop = (child) => new Promise((r) => {
  child.once('exit', r);
  child.kill();
});
const post = (base, body) => fetch(`${base}/api/leaderboard`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('P4-05/P4-06: API lưu điểm, từ chối tên sai, còn sau khi khởi động lại, export đúng thứ tự', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddl-lb-'));
  const file = path.join(dir, 'data', 'leaderboard.json');
  try {
    let srv = await startServer(file);
    assert.deepEqual(await (await fetch(`${srv.base}/api/leaderboard`)).json(), { entries: [] });

    const bad = await post(srv.base, { name: 'x!', score: 10, nights_won: 1, seed: 1 });
    assert.equal(bad.status, 400);
    assert.ok((await bad.json()).error);
    assert.equal((await post(srv.base, { name: 'Moc', score: -5, nights_won: 1, seed: 1 })).status, 400);
    assert.equal((await fetch(`${srv.base}/api/leaderboard`, { method: 'POST', body: '{hỏng' })).status, 400);

    const r1 = await post(srv.base, { name: 'Bao', score: 120, nights_won: 1, seed: 3 });
    assert.equal(r1.status, 201);
    assert.equal((await r1.json()).rank, 1);
    const r2 = await (await post(srv.base, { name: 'Mây_01', score: 450, nights_won: 1, seed: 4 })).json();
    assert.equal(r2.rank, 1);
    assert.deepEqual(r2.entries.map((e) => e.name), ['Mây_01', 'Bao']);
    for (const e of r2.entries) assert.match(e.achieved_at, /[+-]\d{2}:\d{2}$|Z$/);

    // Tắt rồi mở lại server: dữ liệu vẫn còn (P4-06).
    await stop(srv.child);
    srv = await startServer(file);
    const again = await (await fetch(`${srv.base}/api/leaderboard`)).json();
    assert.deepEqual(again.entries.map((e) => [e.name, e.score]), [['Mây_01', 450], ['Bao', 120]]);
    await stop(srv.child);

    // Export: npm start -- --export-leaderboard out.json → {"entries": [...]} đúng thứ tự.
    const out = path.join(dir, 'out.json');
    const ex = spawnSync(process.execPath, [SERVE, '--export-leaderboard', out], {
      env: { ...process.env, LEADERBOARD_FILE: file }, encoding: 'utf8',
    });
    assert.equal(ex.status, 0, ex.stderr);
    const exported = JSON.parse(fs.readFileSync(out, 'utf8'));
    assert.deepEqual(Object.keys(exported), ['entries']);
    assert.deepEqual(exported.entries.map((e) => e.name), ['Mây_01', 'Bao']);
    for (const k of ['name', 'score', 'nights_won', 'achieved_at', 'seed']) assert.ok(k in exported.entries[0], k);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
