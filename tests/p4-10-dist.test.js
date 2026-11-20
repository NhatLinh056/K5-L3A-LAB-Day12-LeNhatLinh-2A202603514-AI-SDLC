// P4-10 (phần đóng gói): npm run dist tạo thư mục web chạy được + zip hợp lệ.
// (Release v1.0.0 và video là bước cuối, kiểm bằng checklist.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT } from './helpers.js';
import { buildDist, crc32 } from '../tools/dist.js';

// Đọc zip bằng central directory (độc lập với cách ghi), trả về {tên: Buffer}.
function readZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(eocd >= 0, 'thiếu End Of Central Directory');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(local + 26);
    const lExtra = buf.readUInt16LE(local + 28);
    const comp = buf.subarray(local + 30 + lNameLen + lExtra, local + 30 + lNameLen + lExtra + compSize);
    const data = method === 8 ? zlib.inflateRawSync(comp) : comp;
    assert.equal(crc32(data), crc, `CRC sai: ${name}`);
    out[name] = data;
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return out;
}

test('P4-10: npm run dist tạo thư mục + zip đúng nội dung, chạy được bằng node tools/serve.js', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ddl-dist-'));
  try {
    const { folder, zipPath } = buildDist(tmp);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert.equal(path.basename(zipPath), `dao-den-long-web-v${pkg.version}.zip`);
    for (const f of ['index.html', 'tools/serve.js', 'src/render/main.js', 'src/logic/sim.js', 'game.contract.json',
      'node_modules/three/build/three.module.js', 'node_modules/three/build/three.core.js', 'LICENSE', 'CREDITS.md', 'README.md']) {
      assert.ok(fs.existsSync(path.join(folder, f)), `thiếu ${f}`);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')).type, 'module');

    const files = readZip(fs.readFileSync(zipPath));
    const prefix = `${path.basename(folder)}/`;
    assert.ok(Object.keys(files).every((n) => n.startsWith(prefix)), 'mọi file nằm trong một thư mục gốc');
    assert.deepEqual(files[`${prefix}index.html`], fs.readFileSync(path.join(ROOT, 'index.html')));

    // Chạy server từ bản đóng gói (không có npm install) và tải được trang + three.js + API.
    const port = 30000 + Math.floor(Math.random() * 20000);
    const child = spawn(process.execPath, [path.join(folder, 'tools', 'serve.js')], {
      env: { ...process.env, PORT: String(port), LEADERBOARD_FILE: path.join(tmp, 'lb.json') }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      const base = await new Promise((resolve, reject) => {
        let buf = '';
        child.stdout.on('data', (d) => {
          buf += d;
          const m = /:(\d+)\//.exec(buf);
          if (m) resolve(`http://127.0.0.1:${m[1]}`);
        });
        child.on('exit', (c) => reject(new Error(`server exited ${c}`)));
      });
      for (const u of ['/', '/node_modules/three/build/three.module.js', '/src/render/main.js', '/game.contract.json', '/api/leaderboard']) {
        assert.equal((await fetch(base + u)).status, 200, u);
      }
    } finally {
      child.kill();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
