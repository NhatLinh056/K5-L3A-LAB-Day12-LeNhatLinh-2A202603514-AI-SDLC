// P2-11 (phần địa hình): --night 3 có 7 đèn; đi lên dốc 30° tới Y=3; bục (0,3,13) đưa Mây lên tầng 2 (Y=6);
// mép tầng là vách đứng. Gió mạnh, Gió Lạc, Bùa Gió của Đêm 3 CHƯA cài.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

const night = 3;

test('P2-11: Đêm 3 có 7 đèn đúng tọa độ chuẩn', () => {
  const r = runHeadless({ night, ticks: 1 });
  assert.equal(r.status, 0, r.stderr);
  const s0 = r.snapshots[0];
  assert.deepEqual(s0.lanterns.map((l) => [l.id, l.pos]), [
    ['L1', [0, 6, 6]], ['L2', [18, 3, 10]], ['L3', [-18, 3, 10]],
    ['L4', [35, 0, -10]], ['L5', [-35, 0, -10]], ['L6', [20, 0, -35]], ['L7', [-20, 0, -35]],
  ]);
  // Giả định: (0,0,0) nằm trong tháp chuông nên Đêm 3 xuất phát ở (0,0,−30).
  assert.deepEqual(s0.player.pos, [0, 0, -30]);
});

test('P2-11: đi lên dốc 30° tới tầng 1 (Y = 3)', () => {
  const r = runHeadless({ night, ticks: 130, every: 1, scenario: 'p2-11-ramp.scenario.json', inputs: 'p2-11-ramp.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'player_hit'), []);
  const ys = r.snapshots.map((s) => s.player.pos[1]);
  assert.ok(ys.some((y) => y > 0.5 && y < 2.5), 'có lúc ở giữa dốc');
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] >= ys[i - 1] - 1e-3, 'đi lên đều, không rơi');
  const end = snapshotAt(r, 130).player;
  assert.equal(end.pos[1], 3);
  assert.equal(end.grounded, true);
});

test('P2-11: bục (0,3,13) đưa Mây lên tầng 2 (Y = 6)', () => {
  const r = runHeadless({ night, ticks: 120, every: 1, scenario: 'p2-11-pad.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const landed = r.snapshots.find((s) => s.tick > 1 && s.player.grounded);
  assert.ok(landed, 'phải đáp đất');
  const [x, y, z] = landed.player.pos;
  assert.equal(y, 6);
  assert.ok(Math.hypot(x, z) <= 8, 'đáp trên đĩa tầng 2');
});

test('P2-11: mép tầng 2 là vách đứng, đi từ tầng 0 bị chặn', () => {
  const r = runHeadless({ night, ticks: 90, every: 1, scenario: 'p2-11-wall.scenario.json', inputs: 'p2-11-wall.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  for (const s of r.snapshots) {
    const [x, y, z] = s.player.pos;
    assert.equal(y, 0, `tick ${s.tick}: không được leo lên vách`);
    assert.ok(Math.hypot(x, z) >= 8 - 1e-3, `tick ${s.tick}: lọt vào trong vách (r = ${Math.hypot(x, z)})`);
  }
  assert.ok(snapshotAt(r, 90).player.pos[2] > -8.2, 'đã đi tới sát vách');
});
