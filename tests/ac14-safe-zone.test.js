// AC14: L1 lit, shade đuổi người đứng cạnh L1 → shade không bao giờ vào trong 6 m quanh L1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, eventsNamed, contract } from './helpers.js';

// [v1.1] Bóng Mực có trạng thái chuẩn: chỉ đuổi khi cách Mây ≤ 12 m. Con S1 cách 13 m nên sẽ ở
// "wander" và không bao giờ tới vùng an toàn. Scenario thêm "state": "chase" (trường mới của v1.1)
// để vẫn kiểm đúng ý AC14; nó không bỏ đuổi vì vẫn cách < 18 m. Kỳ vọng giữ nguyên.

// Tọa độ output đã làm tròn 3 chữ số → cho phép sai số làm tròn.
const ROUNDING_EPS = 0.002;

test('AC14: Bóng Mực không vào vùng an toàn của đèn đã thắp', () => {
  const r = runHeadless({ ticks: 600, every: 1, scenario: 'ac14-safe-zone.scenario.json' });
  assert.equal(r.status, 0, r.stderr);
  const R = contract().tuning.safe_radius;
  let minD = Infinity;
  for (const s of r.snapshots) {
    const l1 = s.lanterns.find((l) => l.id === 'L1');
    const sh = s.shades.find((x) => x.id === 'S1');
    const d = Math.hypot(sh.pos[0] - l1.pos[0], sh.pos[2] - l1.pos[2]);
    minD = Math.min(minD, d);
    assert.ok(d >= R - ROUNDING_EPS, `tick ${s.tick}: S1 cách L1 ${d} m < ${R}`);
  }
  // Bóng Mực đã thực sự đuổi tới mép vùng an toàn.
  assert.ok(minD <= R + 0.01, `S1 phải tới sát mép vùng an toàn (min ${minD})`);
  assert.equal(eventsNamed(r, 'player_hit').length, 0);
});
