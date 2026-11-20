// P4-01: contract v1.3 có bench_cmd, soak_cmd; build_cmd cài Chromium cho Playwright.
// (Test Phase 1–3 vẫn chạy cùng `npm test`.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { contract } from './helpers.js';

test('P4-01: contract v1.3', () => {
  const c = contract();
  assert.equal(c.contract_version, '1.3');
  assert.equal(c.bench_cmd, 'node tools/bench.js');
  assert.equal(c.soak_cmd, 'node --expose-gc src/soak.js');
  assert.match(c.build_cmd, /npm install/);
  assert.match(c.build_cmd, /playwright install chromium/);
  for (const k of ['run_cmd', 'headless_cmd']) assert.ok(c[k], `thiếu ${k}`);
  // Tuning v1.2 giữ nguyên (TICKET-04: "Mọi yêu cầu của v1.0–v1.2 vẫn giữ nguyên").
  assert.equal(c.tuning.fuel_max, 100);
  assert.equal(c.tuning.night1_duration_s, 240);
});
