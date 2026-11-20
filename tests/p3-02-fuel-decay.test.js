// P3-02: đèn lit fuel 100, không ai hút: sau 600 tick fuel = 90.0.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, snapshotAt } from './helpers.js';

test('P3-02: dầu hao 1/giây', () => {
  const r = runHeadless({ ticks: 600, every: 100, scenario: 'p3-02-decay.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const L1 = (t) => snapshotAt(r, t).lanterns.find((l) => l.id === 'L1');
  assert.equal(L1(0).fuel, 100, 'lit: true không có fuel → mặc định 100');
  assert.equal(L1(600).fuel, 90);
  assert.equal(L1(600).lit, true);
});
