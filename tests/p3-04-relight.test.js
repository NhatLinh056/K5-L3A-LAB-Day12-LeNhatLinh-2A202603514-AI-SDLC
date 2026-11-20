// P3-04: thắp lại đèn ever_lit cần 5 đom đóm, lantern_lit relight true, +40 +25.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

test('P3-04: thắp lại chỉ cần 5 đom đóm', () => {
  const r = runHeadless({ ticks: 5, every: 1, scenario: 'p3-04-relight.scenario.json', inputs: 'p3-interact.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'deposit').map((e) => e.data), [{ lantern_id: 'L1', amount: 5, deposited: 5 }]);
  assert.deepEqual(eventsNamed(r, 'lantern_lit').map((e) => [e.tick, e.data]), [[1, { lantern_id: 'L1', relight: true }]]);
  const t1 = snapshotAt(r, 1);
  assert.equal(t1.score, 40 + 5 * 5);
  const L1 = t1.lanterns.find((l) => l.id === 'L1');
  assert.equal(L1.lit, true);
  assert.equal(L1.fuel, 100);
  assert.equal(L1.relit_count, 1);
  assert.equal(t1.player.carried, 0);
});

test('P3-04: đèn chưa từng sáng vẫn cần 10 (5 đom đóm chưa đủ)', () => {
  const r = runHeadless({
    ticks: 5, every: 1, scenario: 'p3-04-first-light-needs-10.scenario.json', inputs: 'p3-interact.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(eventsNamed(r, 'deposit').map((e) => e.data), [{ lantern_id: 'L1', amount: 5, deposited: 5 }]);
  assert.deepEqual(eventsNamed(r, 'lantern_lit'), []);
  assert.equal(snapshotAt(r, 1).lanterns.find((l) => l.id === 'L1').lit, false);
});
