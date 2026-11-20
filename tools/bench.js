#!/usr/bin/env node
// Benchmark (TICKET-04 mục 1): node tools/bench.js --seed 42 --duration 30 --out bench.json
// Tự chạy server tĩnh (tools/serve.js), mở Chromium CÓ CỬA SỔ 1280×720 qua Playwright với cờ tắt vsync,
// tới index.html?bench=1&seed=…&duration=…; trang dựng cảnh chuẩn và ghi dt từng khung (bỏ 3 s đầu).
// Số đo tính bằng src/bench-stats.js. Cần: npm install && npx playwright install chromium.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { computeStats, round1 } from '../src/bench-stats.js';

// Mốc "tiến trình bắt đầu" cho load_ms.
const PROCESS_START_MS = Date.now() - process.uptime() * 1000;
const SERVE = fileURLToPath(new URL('./serve.js', import.meta.url));
const CHROMIUM_ARGS = ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--window-size=1280,800'];

class ArgError extends Error {}

function parseArgs(argv) {
  const raw = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!['--seed', '--duration', '--out'].includes(k)) throw new ArgError(`unknown argument: ${k}`);
    if (v === undefined || v.startsWith('--')) throw new ArgError(`${k} requires a value`);
    raw[k.slice(2)] = v;
  }
  for (const k of ['seed', 'duration', 'out']) if (!(k in raw)) throw new ArgError(`missing required --${k}`);
  if (!/^-?\d+$/.test(raw.seed)) throw new ArgError('--seed requires an integer');
  const duration = Number(raw.duration);
  if (!(duration > 0)) throw new ArgError('--duration must be a positive number of seconds');
  return { seed: Number(raw.seed), duration, out: raw.out };
}

// Chạy tools/serve.js trên một cổng trống, chờ dòng in ra URL.
function startServer() {
  return new Promise((resolve, reject) => {
    const port = 18000 + Math.floor(process.pid % 1000);
    const child = spawn(process.execPath, [SERVE], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    const timer = setTimeout(() => reject(new Error('server did not start in 10 s')), 10_000);
    child.stdout.on('data', (d) => {
      buf += d;
      const m = /http:\/\/[^:]+:(\d+)\//.exec(buf);
      if (m) {
        clearTimeout(timer);
        resolve({ child, base: `http://127.0.0.1:${m[1]}/` });
      }
    });
    child.on('exit', (code) => reject(new Error(`server exited with code ${code}`)));
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('thiếu playwright: chạy "npm install && npx playwright install chromium"');
  }

  const { child, base } = await startServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: false, args: CHROMIUM_ARGS });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    // Bộ nhớ: CDP chỉ cho JS heap của trang, không phải RSS của các tiến trình Chromium.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    let heapPeak = 0;
    const poll = setInterval(async () => {
      try {
        const { metrics } = await cdp.send('Performance.getMetrics');
        const used = metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0;
        heapPeak = Math.max(heapPeak, used);
      } catch { /* trang đang đóng */ }
    }, 500);

    const url = `${base}index.html?bench=1&seed=${opts.seed}&duration=${opts.duration}`;
    await page.goto(url);
    await page.waitForFunction(() => window.__bench, null, { timeout: (opts.duration + 60) * 1000, polling: 250 });
    clearInterval(poll);
    if (pageErrors.length) throw new Error(`lỗi trong trang: ${pageErrors.join('; ')}`);
    const data = await page.evaluate(() => window.__bench);
    const st = computeStats(data.dts);

    const result = {
      contract_version: '1.3',
      avg_fps: round1(st.avg_fps),
      p1_low_fps: round1(st.p1_low_fps),
      frame_ms_p95: round1(st.frame_ms_p95),
      frames: st.frames,
      load_ms: Math.round(data.firstFrameEpochMs - PROCESS_START_MS),
      peak_mem_mb: null,
      peak_mem_note: 'Bản web: không đo được RSS của các tiến trình Chromium một cách đa nền tảng từ Playwright; '
        + 'js_heap_peak_mb là JS heap đỉnh của trang (CDP Performance.getMetrics), không phải RSS.',
      js_heap_peak_mb: round1(heapPeak / (1024 * 1024)),
      vsync_off: true,
      vsync_note: `Chromium chạy với ${CHROMIUM_ARGS.slice(0, 2).join(' ')}`,
      renderer: `${data.renderer} · Chromium ${browser.version()} (Playwright, có cửa sổ)`,
      os: `${os.type()} ${os.release()} ${os.arch()} · ${(os.cpus()[0]?.model ?? 'CPU?').trim()} · ${Math.round(os.totalmem() / 2 ** 30)} GB RAM`,
      seed: opts.seed,
      duration_s: opts.duration,
      measured_ms: Math.round(data.measured_ms),
      viewport: data.viewport,
      scene: { shades: data.shades, motes: data.motes },
    };
    fs.writeFileSync(opts.out, JSON.stringify(result, null, 2) + '\n');
    console.log(`bench: ${result.frames} khung, avg ${result.avg_fps} fps, 1% low ${result.p1_low_fps} fps, p95 ${result.frame_ms_p95} ms, load ${result.load_ms} ms`);
  } finally {
    if (browser) await browser.close();
    child.kill();
  }
}

main().then(() => process.exit(0)).catch((e) => {
  process.stderr.write(`bench: ${e.message}\n`);
  process.exit(1);
});
