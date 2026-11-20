// P3-08: thắp đủ 5 đèn không kết thúc Đêm; hết giờ với 3/5 đèn sáng → won dawn_survived; 2/5 → lost dawn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed } from './helpers.js';

const over = (r) => eventsNamed(r, 'game_over').map((e) => [e.tick, e.data]);

test('P3-08: đủ 5 đèn sáng vẫn chơi tiếp tới bình minh', () => {
  const r = runHeadless({ ticks: 100, scenario: 'p3-08-all-lit-no-end.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(over(r), []);
  assert.equal(r.end.state, 'playing');
  assert.equal(r.end.ticks, 100);
});

test('P3-08: bình minh với 3/5 đèn sáng → won dawn_survived', () => {
  const r = runHeadless({ ticks: 200, scenario: 'p3-08-dawn-3of5.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(over(r), [[60, { result: 'won', reason: 'dawn_survived' }]]);
  assert.equal(r.end.state, 'won');
});

test('P3-08: bình minh với 2/5 đèn sáng → lost dawn', () => {
  const r = runHeadless({ ticks: 200, scenario: 'p3-08-dawn-2of5.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(over(r), [[60, { result: 'lost', reason: 'dawn' }]]);
  assert.equal(r.end.state, 'lost');
});
