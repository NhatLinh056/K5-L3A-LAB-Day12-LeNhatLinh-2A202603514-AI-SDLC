// P2-10 (phần địa hình): --night 2 có 6 đèn và cầu; bục nhảy (20,0,18) đưa Mây đáp xuống đảo B.
// Gió Lạc và Bùa Gió của Đêm 2 CHƯA cài (xem phase-4-spec, mục giả định).
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

const night = 2;

test('P2-10: Đêm 2 có 6 đèn đúng tọa độ chuẩn', () => {
  const r = runHeadless({ night, ticks: 1 });
  assert.equal(r.status, 0, r.stderr);
  const s0 = r.snapshots[0];
  assert.equal(s0.night, 2);
  assert.deepEqual(s0.lanterns.map((l) => [l.id, l.pos]), [
    ['L1', [0, 0, 20]], ['L2', [17, 0, -10]], ['L3', [-17, 0, -10]],
    ['L4', [70, 0, 20]], ['L5', [87, 0, -10]], ['L6', [53, 0, -10]],
  ]);
  assert.equal(s0.time_left_s, 270);
});

test('P2-10: đi qua cầu tre từ đảo A sang đảo B không rơi', () => {
  const r = runHeadless({ night, ticks: 230, every: 1, scenario: 'p2-10-bridge.scenario.json', inputs: 'p2-10-bridge.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'player_hit'), []);
  for (const s of r.snapshots) {
    assert.equal(s.player.pos[1], 0, `tick ${s.tick}: y = ${s.player.pos[1]}`);
    assert.equal(s.player.grounded, true);
  }
  assert.ok(snapshotAt(r, 230).player.pos[0] > 44, 'đã sang tới đảo B');
});

test('P2-10: bục nhảy (20,0,18) đưa Mây đáp xuống đảo B', () => {
  const r = runHeadless({ night, ticks: 150, every: 1, scenario: 'p2-10-pad.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'player_hit'), [], 'không rơi xuống biển mây');
  assert.equal(snapshotAt(r, 1).player.grounded, false, 'bị bắn lên ngay');
  const landed = r.snapshots.find((s) => s.tick > 1 && s.player.grounded);
  assert.ok(landed, 'phải đáp đất');
  // Bay khoảng 1.4 s (vy 14, g 20).
  assert.ok(landed.tick >= 80 && landed.tick <= 90, `đáp ở tick ${landed.tick}`);
  const [x, y, z] = landed.player.pos;
  assert.equal(y, 0);
  assert.ok(Math.hypot(x - 70, z) <= 28, `đáp tại (${x}, ${z}) phải trong đảo B`);
});
