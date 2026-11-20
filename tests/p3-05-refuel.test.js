// P3-05: châm dầu: fuel 55, carried 10 → used 5, fuel 100, event refuel, +25;
// đèn đầy dầu không được chọn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, snapshotAt, contract } from './helpers.js';
import { createConfig, createLevel, pickInteractLantern } from '../src/logic/index.js';

test('P3-05: châm dầu dùng ceil((100 − fuel)/10) đom đóm', () => {
  const r = runHeadless({ ticks: 5, every: 1, scenario: 'p3-05-refuel.scenario.json', inputs: 'p3-interact.inputs.json' });
  assert.equal(r.status, 0, r.stderr);
  // Bước 2 hao trước (fuel 54.983), nên used = ceil(45.017 / 10) = 5 và fuel = min(100, 104.98) = 100.
  assert.deepEqual(eventsNamed(r, 'refuel').map((e) => [e.tick, e.data]), [[1, { lantern_id: 'L1', amount: 5, fuel: 100 }]]);
  assert.deepEqual(eventsNamed(r, 'deposit'), [], 'châm dầu không phát deposit');
  const t1 = snapshotAt(r, 1);
  assert.equal(t1.player.carried, 5);
  assert.equal(t1.score, 25);
  assert.equal(t1.lanterns.find((l) => l.id === 'L1').fuel, 100);
});

// Ghi chú: qua headless không dựng được "đèn đầy dầu lúc tương tác", vì bước 2 (hao dầu) luôn chạy
// trước bước 5 (tương tác): đèn sáng có fuel ≤ 99.983 khi bấm E, nên ceil((100 − fuel)/10) = 1.
// Vì vậy luật chọn đèn được kiểm trực tiếp trên hàm chọn đèn của logic.
test('P3-05: đèn đầy dầu (fuel 100) không được chọn khi tương tác', () => {
  const cfg = createConfig(contract().tuning);
  const s = createLevel(cfg, 1, 1);
  s.player.x = 0;
  s.player.z = 23;
  const L1 = s.lanterns.find((l) => l.id === 'L1');
  L1.lit = true;
  L1.fuel = cfg.fuel_max_u;
  assert.equal(pickInteractLantern(s), null, 'đèn đầy dầu không được chọn');
  L1.fuel = cfg.fuel_max_u - 1;
  assert.equal(pickInteractLantern(s)?.id, 'L1', 'thiếu dầu thì được chọn');
  L1.lit = false;
  L1.fuel = 0;
  assert.equal(pickInteractLantern(s)?.id, 'L1', 'đèn chưa sáng thì được chọn');
});
