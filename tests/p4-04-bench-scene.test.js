// P4-04: cảnh bench đúng chuẩn: 200 Bóng Mực wander, 100 đom đóm, L1–L3 sáng fuel 100;
// không sinh thêm, không nhặt, không sát thương, không hao dầu, không kết thúc; Bóng Mực vẫn di chuyển.
import test from 'node:test';
import assert from 'node:assert/strict';
import { contract } from './helpers.js';
import { createConfig, createLevel, createBenchLevel, step, snapshot } from '../src/logic/index.js';

const cfg = createConfig(contract().tuning);
const idle = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false, pause: false };

function run(ticks) {
  const s = createBenchLevel(cfg, 42);
  const start = snapshot(s);
  const events = [];
  for (let k = 0; k < ticks; k++) events.push(...step(s, idle));
  return { s, start, end: snapshot(s), events };
}

test('P4-04: cảnh bench ban đầu', () => {
  const { start } = run(0);
  assert.equal(start.shades.length, 200);
  assert.ok(start.shades.every((sh) => sh.state === 'wander'));
  assert.equal(start.motes.length, 100);
  assert.deepEqual(start.player.pos, [0, 0, 0]);
  const lit = start.lanterns.filter((l) => l.lit);
  assert.deepEqual(lit.map((l) => [l.id, l.fuel]), [['L1', 100], ['L2', 100], ['L3', 100]]);
  for (const sh of start.shades) {
    assert.ok(Math.hypot(sh.pos[0], sh.pos[2]) <= 38 + 1e-3, 'rải trên đảo');
    for (const l of lit) {
      assert.ok(Math.hypot(sh.pos[0] - l.pos[0], sh.pos[2] - l.pos[2]) >= 6 - 1e-3, 'không đặt trong vùng an toàn');
    }
  }
});

test('P4-04: sau 600 tick cảnh không đổi số lượng, Bóng Mực vẫn di chuyển theo wander', () => {
  const { start, end, events } = run(600);
  assert.equal(end.shades.length, 200, 'không sinh thêm Bóng Mực');
  assert.ok(end.shades.every((sh) => sh.state === 'wander'), 'không chuyển chase');
  assert.equal(end.motes.length, 100, 'không nhặt, không sinh thêm đom đóm');
  assert.deepEqual(end.lanterns.filter((l) => l.lit).map((l) => l.fuel), [100, 100, 100], 'không hao dầu');
  assert.equal(end.state, 'playing');
  assert.equal(end.player.flames, 3);
  const names = new Set(events.map((e) => e.name));
  for (const n of ['shade_spawned', 'player_hit', 'mote_picked', 'game_over', 'lantern_out', 'fuel_drain']) {
    assert.ok(!names.has(n), `không được có event ${n}`);
  }
  const moved = end.shades.filter((sh, i) => sh.pos[0] !== start.shades[i].pos[0] || sh.pos[2] !== start.shades[i].pos[2]);
  assert.ok(moved.length > 100, `chỉ ${moved.length} con di chuyển`);
});

test('P4-04: cảnh bench tất định theo seed', () => {
  assert.deepEqual(run(120).end, run(120).end);
});

test('P4-04: cờ bench chỉ có ở cảnh bench, game thường không bị tắt luật', () => {
  assert.equal(run(0).s.bench, true);
  assert.equal(createLevel(cfg, 42, 1).bench, undefined);
});
