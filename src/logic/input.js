// Dòng thời gian input: mỗi frame chỉ đổi các trường có mặt; trường vắng giữ giá trị cũ.

const KEYS = ['cam_yaw_deg', 'jump', 'interact', 'pulse', 'dash', 'pause'];

export function createInputTimeline(frames = []) {
  const cur = {
    move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false, pause: false,
  };
  let i = 0;
  return {
    // Gọi với k tăng dần (0, 1, 2, …); trả về input của tick k.
    at(k) {
      while (i < frames.length && frames[i].tick <= k) {
        const f = frames[i++];
        if ('move' in f) cur.move = [f.move[0], f.move[1]];
        for (const key of KEYS) {
          if (key in f) cur[key] = f[key];
        }
      }
      return cur;
    },
  };
}
