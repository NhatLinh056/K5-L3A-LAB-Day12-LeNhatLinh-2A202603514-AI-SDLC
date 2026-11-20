// P3-03: đèn lit fuel 1 → tắt đúng tick 60: lantern_out, deposited 0, ever_lit true.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P3-03: hết dầu thì tắt và nhớ ever_lit', () => {
  const r = runHeadless({ ticks: 70, every: 1, scenario: 'p3-03-out.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'lantern_out').map((e) => [e.tick, e.data]), [[60, { lantern_id: 'L1' }]]);
  const L1 = (t) => snapshotAt(r, t).lanterns.find((l) => l.id === 'L1');
  assert.equal(L1(59).lit, true);
  assert.deepEqual(
    { lit: L1(60).lit, deposited: L1(60).deposited, ever_lit: L1(60).ever_lit, fuel: L1(60).fuel },
    { lit: false, deposited: 0, ever_lit: true, fuel: 0 },
  );
});
