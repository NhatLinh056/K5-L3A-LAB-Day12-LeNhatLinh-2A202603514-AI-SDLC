// P2-05: carried 3, Bóng Mực cách 4 m → stunned 120 tick, bị đẩy 4 m trong 15 tick, +5 điểm;
// carried 2 → không kích hoạt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt } from './helpers.js';

const s1Of = (snap) => snap.shades.find((s) => s.id === 'S1');

test('P2-05: Tỏa Sáng choáng 120 tick và đẩy 4 m trong 15 tick', () => {
  const r = runHeadless({
    ticks: 130, every: 1, scenario: 'p2-05-pulse.scenario.json', inputs: 'p2-05-pulse.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  const pulses = eventsNamed(r, 'pulse');
  assert.equal(pulses.length, 1);
  assert.equal(pulses[0].tick, 1);
  assert.deepEqual(pulses[0].data, { stunned_ids: ['S1'] });

  const t1 = snapshotAt(r, 1);
  assert.equal(t1.score, 5);
  assert.equal(t1.player.carried, 0);
  assert.equal(t1.player.pulse_cd_s, 3);

  // Choáng đúng 120 tick: tick 1…120 là stunned, tick 121 thì không.
  for (let t = 1; t <= 120; t++) assert.equal(s1Of(snapshotAt(r, t)).state, 'stunned', `tick ${t}`);
  assert.notEqual(s1Of(snapshotAt(r, 121)).state, 'stunned');

  // Đẩy lùi tổng 4 m theo +X (ra xa Mây) trong 15 tick đầu, rồi đứng yên.
  assert.ok(s1Of(snapshotAt(r, 14)).pos[0] < 8);
  assert.ok(Math.abs(s1Of(snapshotAt(r, 15)).pos[0] - 8) < 1e-3);
  assert.ok(Math.abs(s1Of(snapshotAt(r, 60)).pos[0] - 8) < 1e-3);
});

test('P2-05: thiếu đom đóm (carried 2) thì không kích hoạt', () => {
  const r = runHeadless({
    ticks: 5, every: 1, scenario: 'p2-05-pulse-not-enough.scenario.json', inputs: 'p2-05-pulse.inputs.json',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(eventsNamed(r, 'pulse').length, 0);
  const t1 = snapshotAt(r, 1);
  assert.equal(t1.player.carried, 2);
  assert.equal(t1.score, 0);
  assert.notEqual(s1Of(t1).state, 'stunned');
});
