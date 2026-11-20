// Cảnh benchmark chuẩn (TICKET-04 mục 1), dùng chung cho trình duyệt và test.
// Đêm 1, 200 Bóng Mực "wander" rải đều trên đảo, 100 đom đóm, L1–L3 đang sáng fuel 100.
// Khi s.bench = true, sim.js tắt: sinh thêm thực thể, nhặt, sát thương, hao/hút dầu, xét kết thúc,
// và chuyển wander → chase (giả định: giữ cả 200 con ở wander). Bóng Mực vẫn đi theo luật wander.
import { mulberry32 } from './rng.js';
import { createLevel, addMote, newShade } from './level.js';

export const BENCH = Object.freeze({
  night: 1,
  shades: 200,
  motes: 100,
  lit: ['L1', 'L2', 'L3'],
  spread_radius: 38, // rải đều trên đĩa bán kính 38 m (đảo 40 m)
});

// Điểm ngẫu nhiên phân bố đều theo diện tích trên đĩa bán kính R.
function pointInDisk(rng, R) {
  const r = R * Math.sqrt(rng());
  const a = rng() * Math.PI * 2;
  return [r * Math.cos(a), r * Math.sin(a)];
}

export function createBenchLevel(cfg, seed) {
  const s = createLevel(cfg, seed, BENCH.night);
  s.bench = true;
  s.random_motes = false;
  s.random_shades = false;
  const rng = mulberry32((seed ^ 0x5bd1e995) >>> 0);

  const lit = s.lanterns.filter((l) => BENCH.lit.includes(l.id));
  for (const l of lit) {
    l.lit = true;
    l.ever_lit = true;
    l.fuel = cfg.fuel_max_u;
    l.deposited = cfg.lantern_cost;
  }

  s.motes = [];
  s.nextMoteId = 1;
  for (let i = 0; i < BENCH.motes; i++) {
    const [x, z] = pointInDisk(rng, BENCH.spread_radius);
    addMote(s, x, 0, z, 'random', -1);
  }

  // Bóng Mực không được đặt trong vùng an toàn 6 m của đèn đang sáng (nếu không sẽ bị đẩy ra ngay).
  s.shades = [];
  for (let i = 0; i < BENCH.shades; i++) {
    let x;
    let z;
    do {
      [x, z] = pointInDisk(rng, BENCH.spread_radius);
    } while (lit.some((l) => Math.hypot(x - l.x, z - l.z) < cfg.safe_radius));
    s.shades.push(newShade(s, `S${i + 1}`, x, z, 'wander', 0));
  }
  s.nextShadeId = BENCH.shades + 1;
  return s;
}
