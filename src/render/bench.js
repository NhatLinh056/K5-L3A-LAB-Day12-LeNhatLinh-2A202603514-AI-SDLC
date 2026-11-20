// Chế độ benchmark trong trình duyệt (index.html?bench=1&seed=42&duration=30), TICKET-04 mục 1.
// Cảnh chuẩn lấy từ src/logic/bench.js. Không có input; Mây đứng yên tại (0,0,0).
// Camera bay vòng tròn tâm (0,0,0), bán kính 30 m, cao 15 m, xuất phát ở góc 0° (30,15,0),
// ngược chiều kim đồng hồ nhìn từ trên xuống (cùng quy ước góc với bản đồ: x = r·cosθ, z = r·sinθ),
// 15 s một vòng. 3 s đầu khởi động (không đo), sau đó ghi dt từng khung trong đúng `duration` giây.
// Xong thì đặt window.__bench để tools/bench.js đọc.
import * as THREE from 'three';
import { createBenchLevel, step, TICK_RATE } from '../logic/index.js';

const DT = 1 / TICK_RATE;
const WARMUP_MS = 3000;
const ORBIT = { radius: 30, height: 15, period_s: 15 };
const IDLE = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false, pause: false };

function rendererName(renderer) {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return `${name} · WebGL${renderer.capabilities.isWebGL2 ? '2' : '1'} · three.js r${THREE.REVISION}`;
}

export function startBench({ world, hud, cfg, seed, durationS }) {
  const s = createBenchLevel(cfg, seed);
  world.reset(s);
  for (const id of ['start', 'end']) document.getElementById(id).hidden = true;

  const dts = [];
  let firstFrameEpochMs = null;
  let t0 = null; // mốc khung đầu tiên (ms, performance.now)
  let last = null;
  let acc = 0;
  let measureStart = null;
  let done = false;

  function frame(now) {
    if (done) return;
    if (t0 === null) {
      t0 = now;
      firstFrameEpochMs = performance.timeOrigin + now;
    }
    const elapsed = now - t0;
    const dtMs = last === null ? 0 : now - last;
    if (last !== null) {
      // Khung này được đo nếu đã qua 3 s khởi động.
      if (elapsed >= WARMUP_MS) {
        if (measureStart === null) measureStart = last;
        dts.push(dtMs);
      }
      // Logic vẫn chạy cố định 60 tick/giây.
      acc += Math.min(dtMs / 1000, 0.25);
      while (acc >= DT) {
        step(s, IDLE);
        acc -= DT;
      }
    }
    last = now;

    const th = (2 * Math.PI * (elapsed / 1000)) / ORBIT.period_s;
    const cam = { pos: [ORBIT.radius * Math.cos(th), ORBIT.height, ORBIT.radius * Math.sin(th)], lookAt: [0, 0, 0] };
    world.frame(s, 0, Math.min(dtMs / 1000, 0.25), cam);
    hud.update(s);

    if (measureStart !== null && now - measureStart >= durationS * 1000) {
      done = true;
      window.__bench = {
        dts,
        firstFrameEpochMs,
        warmup_ms: WARMUP_MS,
        measured_ms: now - measureStart,
        renderer: rendererName(world.renderer),
        viewport: [window.innerWidth, window.innerHeight],
        shades: s.shades.length,
        motes: s.motes.length,
      };
      document.title = 'bench done';
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
