// Bàn phím + chuột → input theo đúng định dạng của logic (move, cam_yaw_deg, nút).
// WASD/↑↓ đi, chuột hoặc Q/Z (←/→) xoay camera, Space nhảy, Shift lướt, E nạp đèn, F tỏa sáng, R chơi lại.

const ROTATE_DEG_PER_S = 120;
const MOUSE_DEG_PER_PX = 0.25;
const BLOCK_DEFAULT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function createInput(canvas, { onRestart } = {}) {
  const held = new Set();
  // Nút bấm-nhả nhanh giữa hai tick vẫn được tính: giữ "true" ít nhất 1 tick.
  const latched = new Set();
  let yaw = 0;
  let dragging = false;

  window.addEventListener('keydown', (e) => {
    // Đang gõ tên (ô nhập bảng xếp hạng): không coi phím là lệnh điều khiển (R, Space, …).
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (BLOCK_DEFAULT.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    latched.add(e.code);
    if (e.code === 'KeyR' && onRestart) onRestart();
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
      try {
        const p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch {
        /* trình duyệt không cho khóa chuột: vẫn kéo chuột để xoay được */
      }
    }
  });
  canvas.addEventListener('mousedown', () => { dragging = true; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas || dragging) yaw -= e.movementX * MOUSE_DEG_PER_PX;
  });

  const down = (code) => held.has(code) || latched.has(code);
  const wrap = (d) => ((d % 360) + 540) % 360 - 180;

  return {
    get yaw() {
      return yaw;
    },
    // Xoay camera bằng phím, gọi mỗi khung hình.
    update(dt) {
      if (held.has('KeyQ') || held.has('ArrowLeft')) yaw += ROTATE_DEG_PER_S * dt;
      if (held.has('KeyZ') || held.has('ArrowRight')) yaw -= ROTATE_DEG_PER_S * dt;
      yaw = wrap(yaw);
    },
    // Input cho 1 tick. Quy ước logic: yaw 0 nhìn về +Z; move z>0 là tiến,
    // move x>0 là +X = bên TRÁI màn hình khi nhìn về +Z (Three.js tay phải), nên D → x = −1.
    sample() {
      let x = 0;
      let z = 0;
      if (down('KeyW') || down('ArrowUp')) z += 1;
      if (down('KeyS') || down('ArrowDown')) z -= 1;
      if (down('KeyA')) x += 1;
      if (down('KeyD')) x -= 1;
      return {
        move: [x, z],
        cam_yaw_deg: yaw,
        jump: down('Space'),
        interact: down('KeyE'),
        pulse: down('KeyF'),
        dash: down('ShiftLeft') || down('ShiftRight'),
      };
    },
    consumeLatches() {
      latched.clear();
    },
    resetYaw() {
      yaw = 0;
    },
  };
}
