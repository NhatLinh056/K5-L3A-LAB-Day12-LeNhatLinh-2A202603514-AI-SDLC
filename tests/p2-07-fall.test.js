// P2-07: đi ra ngoài bán kính 40 m → player_hit by fall, lost = số đang mang;
// sau 60 tick hồi sinh tại (0,0,0), vận tốc 0, bất tử.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P2-07: rơi khỏi đảo rồi hồi sinh', () => {
  const r = runHeadless({
    ticks: 300, every: 1, scenario: 'p2-07-fall.scenario.json', inputs: 'p2-07-fall.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const falls = eventsNamed(r, 'player_hit').filter((e) => e.data.by === 'fall');
  assert.equal(falls.length, 1, 'rơi đúng 1 lần');
  const T = falls[0].tick;
  assert.deepEqual(falls[0].data, { by: 'fall', flames: 2, dropped: 0, lost: 4 });

  const atFall = snapshotAt(r, T);
  assert.ok(atFall.player.pos[1] < -10, 'chỉ tính rơi khi Y < −10');
  assert.ok(snapshotAt(r, T - 1).player.pos[1] >= -10);
  assert.equal(atFall.player.carried, 0);

  assert.notDeepEqual(snapshotAt(r, T + 59).player.pos, [0, 0, 0]);
  const back = snapshotAt(r, T + 60);
  assert.deepEqual(back.player.pos, [0, 0, 0]);
  assert.deepEqual(back.player.vel, [0, 0, 0]);
  assert.equal(back.player.invuln, true);
  assert.equal(back.player.grounded, true);
  assert.equal(back.state, 'playing');
});
