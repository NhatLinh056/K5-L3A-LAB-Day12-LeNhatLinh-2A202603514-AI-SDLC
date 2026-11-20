// Vòng lặp game trong trình duyệt: logic chạy cố định 60 tick/giây (dùng chung src/logic).
import { createConfig, createLevel, step, TICK_RATE, NIGHTS } from '../logic/index.js';
import { createWorld } from './scene.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { createLeaderboardUi } from './leaderboard-ui.js';

const DT = 1 / TICK_RATE;
const MAX_FRAME_S = 0.25;

async function boot() {
  const res = await fetch('./game.contract.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`không tải được game.contract.json (${res.status})`);
  const cfg = createConfig((await res.json()).tuning);

  const world = createWorld(document.getElementById('app'), cfg, NIGHTS[1]);
  const hud = createHud(cfg);
  const canvas = world.renderer.domElement;

  // Chế độ benchmark: index.html?bench=1&seed=42&duration=30 (TICKET-04 mục 1).
  const q = new URLSearchParams(window.location.search);
  if (q.get('bench') === '1') {
    const { startBench } = await import('./bench.js');
    window.addEventListener('resize', () => world.resize());
    startBench({
      world, hud, cfg, seed: Number(q.get('seed') ?? 42) | 0, durationS: Number(q.get('duration') ?? 30),
    });
    return;
  }

  let s = null;
  let running = false;
  let acc = 0;
  let currentSeed = 0;
  const lb = createLeaderboardUi();

  const params = new URLSearchParams(window.location.search);
  const fixedSeed = params.has('seed') ? Number(params.get('seed')) | 0 : null;

  function newGame() {
    // Seed ngẫu nhiên mỗi ván ở phần hiển thị là được; logic vẫn tất định theo seed.
    const seed = fixedSeed ?? Math.floor(Math.random() * 2 ** 31);
    currentSeed = seed;
    s = createLevel(cfg, seed);
    world.reset(s);
    lb.hideBoard();
    input.resetYaw();
    hud.hideEnd();
    acc = 0;
    running = true;
    document.getElementById('start').hidden = true;
    // Bỏ focus khỏi nút để Space (nhảy) không "bấm" lại nút Chơi lại.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  const input = createInput(canvas, { onRestart: () => newGame() });
  document.getElementById('btn-start').addEventListener('click', () => {
    newGame();
    canvas.click();
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    newGame();
    canvas.click();
  });
  window.addEventListener('resize', () => world.resize());

  // Trạng thái nền khi chưa bấm Bắt đầu.
  s = createLevel(cfg, fixedSeed ?? 1);
  world.reset(s);

  function onEvent(ev) {
    switch (ev.name) {
      case 'pulse': world.pulse(s); break;
      case 'player_hit': world.hit(); break;
      case 'lantern_lit': world.lanternLit(); break;
      case 'game_over':
        hud.showEnd(ev.data, s.score);
        // Bảng xếp hạng: score = tổng điểm các Đêm đã thắng (giao diện hiện chơi một Đêm, nên thua thì 0).
        lb.offerEntry({
          score: ev.data.result === 'won' ? s.score : 0,
          nights_won: ev.data.result === 'won' ? 1 : 0,
          seed: currentSeed,
        });
        if (document.pointerLockElement) document.exitPointerLock();
        break;
      default: break;
    }
  }

  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min((now - lastT) / 1000, MAX_FRAME_S);
    lastT = now;
    input.update(dt);
    if (running && s.state === 'playing') {
      acc += dt;
      while (acc >= DT && s.state === 'playing') {
        for (const ev of step(s, input.sample())) onEvent(ev);
        input.consumeLatches();
        acc -= DT;
      }
    }
    world.frame(s, input.yaw, dt);
    hud.update(s);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot().catch((e) => {
  console.error(e);
  const box = document.getElementById('error');
  box.textContent = `Lỗi khởi động game: ${e.message}. Hãy chạy "npm install" rồi "npm start".`;
  box.hidden = false;
});
