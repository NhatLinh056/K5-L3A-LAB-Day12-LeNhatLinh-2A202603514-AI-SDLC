// P2-06: carried 5 → flames 2, dropped 2, 2 đom đóm "dropped" nằm trong vành 1.5–2.5 m, ttl 8 s;
// bất tử 90 tick; Bóng Mực gây hit chuyển sang recoil.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P2-06: bị đánh rơi đom đóm ra vành, bất tử 90 tick, recoil', () => {
  const r = runHeadless({ ticks: 120, every: 1, scenario: 'p2-06-hit.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const hits = eventsNamed(r, 'player_hit');
  assert.equal(hits[0].tick, 1);
  assert.deepEqual(hits[0].data, { by: 'shade', flames: 2, dropped: 2 });
  assert.deepEqual(hits.filter((h) => h.tick > 1 && h.tick < 91), [], 'không bị đánh lại trong 90 tick');

  const t1 = snapshotAt(r, 1);
  assert.equal(t1.player.carried, 3);
  assert.equal(t1.player.invuln, true);
  assert.equal(snapshotAt(r, 90).player.invuln, true);
  const dropped = t1.motes.filter((m) => m.kind === 'dropped');
  assert.equal(dropped.length, 2);
  for (const m of dropped) {
    const d = Math.hypot(m.pos[0] - t1.player.pos[0], m.pos[2] - t1.player.pos[2]);
    assert.ok(d >= 1.5 - 1e-3 && d <= 2.5 + 1e-3, `đom đóm rơi cách ${d} m`);
    assert.equal(m.ttl_s, 8);
  }
  // TTL đếm ngược: sau 60 tick còn 7 s.
  assert.ok(snapshotAt(r, 61).motes.filter((m) => m.kind === 'dropped').every((m) => m.ttl_s === 7));

  assert.equal(snapshotAt(r, 2).shades.find((s) => s.id === 'S1').state, 'recoil');
});
