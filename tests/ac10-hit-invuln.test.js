// AC10: shade đứng sát, carried 4 → player_hit flames 2 dropped 2;
// trong 1.5 s (90 tick) không bị chạm lần nữa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

test('AC10: bị chạm rồi bất tử 1.5 s', () => {
  const r = runHeadless({ ticks: 120, scenario: 'ac10-hit-invuln.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const hits = eventsNamed(r, 'player_hit');
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].tick, 1);
  assert.deepEqual(hits[0].data, { by: 'shade', flames: 2, dropped: 2 });
  const tooSoon = hits.filter((h) => h.tick > hits[0].tick && h.tick < hits[0].tick + 90);
  assert.deepEqual(tooSoon, [], 'không được bị chạm lần nữa trong 1.5 s');
});
