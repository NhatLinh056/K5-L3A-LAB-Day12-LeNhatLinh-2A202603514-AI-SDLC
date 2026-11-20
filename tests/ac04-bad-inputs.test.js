// AC4: inputs có tick giảm dần → exit 2.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless } from './helpers.js';

test('AC4: tick giảm dần trong inputs → exit 2', () => {
  const r = runHeadless({ ticks: 20, inputs: 'ac04-bad-inputs.inputs.json' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /strictly increasing/);
});
