// P2-08: Bóng Mực không vào trong 6 m quanh đèn đã sáng; con đang ở trong lúc đèn vừa thắp
// bị đẩy ra trong ≤ 30 tick và không gây hit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

const EPS = 0.002; // tọa độ output làm tròn 3 chữ số

test('P2-08: đẩy Bóng Mực ra khỏi vùng an toàn khi đèn vừa thắp', () => {
  const r = runHeadless({
    ticks: 200, every: 1, scenario: 'p2-08-safe-zone.scenario.json', inputs: 'p2-08-safe-zone.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const lit = eventsNamed(r, 'lantern_lit');
  assert.deepEqual(lit.map((e) => [e.tick, e.data.lantern_id]), [[1, 'L1']]);
  // S1 đứng sát Mây (1 m) và ở trong vùng lúc đèn thắp, nhưng không được gây hit.
  assert.deepEqual(eventsNamed(r, 'player_hit'), []);

  const dist = (snap, id) => {
    const l = snap.lanterns.find((x) => x.id === 'L1');
    const sh = snap.shades.find((x) => x.id === id);
    return Math.hypot(sh.pos[0] - l.pos[0], sh.pos[2] - l.pos[2]);
  };
  const out = r.snapshots.find((s) => s.tick >= 1 && dist(s, 'S1') >= 6 - EPS);
  assert.ok(out && out.tick <= 30, `S1 ra tới mép ở tick ${out?.tick} (phải ≤ 30)`);
  for (const s of r.snapshots.filter((x) => x.tick >= 30)) {
    assert.ok(dist(s, 'S1') >= 6 - EPS, `tick ${s.tick}: S1 cách L1 ${dist(s, 'S1')} m`);
  }
  // S2 đang đuổi từ ngoài vào: bị chặn ở mép 6 m.
  let minS2 = Infinity;
  for (const s of r.snapshots.filter((x) => x.tick >= 1)) {
    minS2 = Math.min(minS2, dist(s, 'S2'));
    assert.ok(dist(s, 'S2') >= 6 - EPS, `tick ${s.tick}: S2 cách L1 ${dist(s, 'S2')} m`);
  }
  assert.ok(minS2 <= 6 + 0.01, 'S2 phải đuổi tới sát mép');
});
