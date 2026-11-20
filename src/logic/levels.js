// Bản đồ chuẩn (TICKET-02 Phần 2). Góc đo từ trục +X, ngược chiều kim đồng hồ nhìn từ trên xuống:
// x = r·cos(θ), z = r·sin(θ)  (nhờ vậy các điểm 20°…160° của Đêm 3 nằm ở nửa z > 0).
//
// Mỗi Đêm khai báo:
//   ground(x, z)  độ cao mặt đất cao nhất tại (x, z); null = không có đất (biển mây → rơi).
//                 Chênh lệch giữa các mặt là vách đứng (không đi lên được; bước ra thì rơi xuống).
//   obstacles     trụ đứng không leo được {x, z, r, top}.
//   pads          bục nhảy {x, y, z, r, vy, h:[vx, vz]}: vận tốc phóng giữ tới khi chạm đất.
//
// CHƯA CÀI (TICKET-02 Phần 3): Gió Lạc, Bùa Gió, gió mạnh Đêm 3. Đêm 2/3 hiện chỉ có địa hình,
// đèn, đom đóm và Bóng Mực; charms rỗng, drifters/wind tắt.

const rad = (d) => (d * Math.PI) / 180;

export function ring(r, startDeg, stepDeg, n, y = 0, cx = 0, cz = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rad(startDeg + i * stepDeg);
    pts.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]);
  }
  return pts;
}

const inDisk = (x, z, cx, cz, r) => Math.hypot(x - cx, z - cz) <= r;

function toward(fromX, fromZ, toX, toZ, speed) {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const d = Math.hypot(dx, dz);
  return [(dx / d) * speed, (dz / d) * speed];
}

const NOT_YET = { charms: [], drifters_default: false, wind_default: false };

// ---------------- Đêm 1 – Đảo Bến ----------------
const NIGHT1 = Object.freeze({
  night: 1,
  name: 'Đảo Bến',
  radius: 40,
  start: [0, 0, 0],
  facing: [0, 1], // quay mặt về +Z
  lanterns: [
    ['L1', 0, 0, 25],
    ['L2', 23.8, 0, 7.7],
    ['L3', 14.7, 0, -20.2],
    ['L4', -14.7, 0, -20.2],
    ['L5', -23.8, 0, 7.7],
  ],
  mote_points: [...ring(12, 0, 45, 8), ...ring(33, 0, 22.5, 16)],
  mote_initial: 20,
  shade_points: ring(37, 15, 30, 12),
  shade_schedule: { first_tick: 300, first_count: 2, every_ticks: 480, max: 6 },
  shade_speed: null, // null = tuning.shade_speed
  ...NOT_YET,
  pads: [],
  obstacles: [],
  ground(x, z) {
    return Math.hypot(x, z) <= 40 ? 0 : null;
  },
});

// ---------------- Đêm 2 – Đảo Cau ----------------
const NIGHT2 = Object.freeze({
  night: 2,
  name: 'Đảo Cau',
  radius: 28,
  start: [0, 0, 0],
  facing: [0, 1],
  lanterns: [
    ['L1', 0, 0, 20],
    ['L2', 17, 0, -10],
    ['L3', -17, 0, -10],
    ['L4', 70, 0, 20],
    ['L5', 87, 0, -10],
    ['L6', 53, 0, -10],
  ],
  mote_points: [
    ...ring(10, 0, 90, 4, 0, 0, 0), ...ring(22, 0, 45, 8, 0, 0, 0),
    ...ring(10, 0, 90, 4, 0, 70, 0), ...ring(22, 0, 45, 8, 0, 70, 0),
  ],
  mote_initial: 20,
  shade_points: [...ring(26, 22.5, 45, 8, 0, 0, 0), ...ring(26, 22.5, 45, 8, 0, 70, 0)],
  shade_schedule: { first_tick: 300, first_count: 2, every_ticks: 420, max: 8 },
  shade_speed: null,
  ...NOT_YET, // ticket: Bùa Gió C1 tại (35,0,0), Gió Lạc từ tick 1200 — chưa cài
  pads: [
    { x: 20, y: 0, z: 18, r: 1, vy: 14, h: toward(20, 18, 70, 0, 24) },
    { x: 50, y: 0, z: -18, r: 1, vy: 14, h: toward(50, -18, 0, 0, 24) },
  ],
  obstacles: [],
  ground(x, z) {
    if (inDisk(x, z, 0, 0, 28) || inDisk(x, z, 70, 0, 28)) return 0;
    if (x >= 26 && x <= 44 && z >= -2 && z <= 2) return 0; // cầu tre, không lan can
    return null;
  },
});

// ---------------- Đêm 3 – Đảo Chuông ----------------
const RAMPS = [30, 150].map((deg) => ({ ux: Math.cos(rad(deg)), uz: Math.sin(rad(deg)) }));

const NIGHT3 = Object.freeze({
  night: 3,
  name: 'Đảo Chuông',
  radius: 45,
  // Giả định: (0,0,0) nằm trong tháp chuông nên Đêm 3 xuất phát ở (0,0,−30) trên tầng 0, quay về +Z.
  start: [0, 0, -30],
  facing: [0, 1],
  lanterns: [
    ['L1', 0, 6, 6],
    ['L2', 18, 3, 10],
    ['L3', -18, 3, 10],
    ['L4', 35, 0, -10],
    ['L5', -35, 0, -10],
    ['L6', 20, 0, -35],
    ['L7', -20, 0, -35],
  ],
  mote_points: [...ring(34, 0, 20, 18, 0), ...ring(18, 20, 20, 8, 3), ...ring(5, 45, 90, 4, 6)],
  mote_initial: 20,
  shade_points: ring(43, 0, 22.5, 16),
  shade_schedule: { first_tick: 300, first_count: 2, every_ticks: 360, max: 10 },
  shade_speed: 4.5,
  ...NOT_YET, // ticket: Bùa Gió C1/C2, Gió Lạc, gió mạnh mỗi 30 s — chưa cài
  pads: [{ x: 0, y: 3, z: 13, r: 1, vy: 12, h: [0, -8] }],
  obstacles: [{ x: 0, z: 0, r: 2, top: 14 }], // tháp chuông cao 8 m trên tầng 2 (Y=6)
  ground(x, z) {
    const r = Math.hypot(x, z);
    if (r > 45) return null;
    let h = 0; // tầng 0
    for (const { ux, uz } of RAMPS) {
      const s = x * ux + z * uz; // dọc theo bán kính
      const w = -x * uz + z * ux; // ngang dốc
      if (Math.abs(w) <= 1.5 && s >= 24 && s <= 30) h = Math.max(h, (3 * (30 - s)) / 6);
    }
    if (z > 0 && r >= 12 && r <= 24) h = Math.max(h, 3); // tầng 1
    if (r <= 8) h = 6; // tầng 2
    return h;
  },
});

export const NIGHTS = Object.freeze({ 1: NIGHT1, 2: NIGHT2, 3: NIGHT3 });

export class UnsupportedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'UnsupportedError';
  }
}

export function getNight(n) {
  const L = NIGHTS[n];
  if (!L) throw new UnsupportedError(`night ${n} does not exist (chỉ có Đêm 1, 2, 3)`);
  return L;
}
