// AC3: chạy 2 lần, seed 42, 3000 tick → 2 file giống hệt nhau.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless } from './helpers.js';

test('AC3: cùng seed 42 cho output giống hệt', () => {
  const opts = { seed: 42, ticks: 3000, scenario: 'ac03-determinism.scenario.json' };
  const a = runHeadless(opts);
  const b = runHeadless(opts);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.ok(a.text.length > 0);
  assert.equal(a.text, b.text);
});
