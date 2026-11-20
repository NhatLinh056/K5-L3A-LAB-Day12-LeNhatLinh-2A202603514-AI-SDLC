#!/usr/bin/env node
// Đóng gói bản web chạy được (TICKET-04 mục 5): npm run dist
//   → dist/dao-den-long-web-v<version>/      thư mục web tĩnh + server (không cần npm install)
//   → dist/dao-den-long-web-v<version>.zip   cùng nội dung, để đính kèm GitHub Release
// Chạy bản đóng gói: giải nén → `node tools/serve.js` (Node ≥ 18) → mở URL được in ra.
// Không dùng thư viện ngoài: zip được ghi bằng zlib (deflate) + CRC32.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// File/thư mục đưa vào bản phát hành (đường dẫn tương đối từ gốc repo).
const INCLUDE = [
  'index.html', 'game.contract.json', 'README.md', 'CHANGELOG.md', 'CREDITS.md', 'LICENSE',
  'src', 'tools/serve.js',
  'node_modules/three/build/three.module.js', 'node_modules/three/build/three.core.js', 'node_modules/three/LICENSE',
];

function listFiles(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`thiếu ${rel} (đã chạy npm install chưa?)`);
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs).sort().flatMap((n) => listFiles(path.posix.join(rel, n)));
}

// ---------- Ghi zip (PKZIP, deflate, tên UTF-8) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Ngày giờ cố định để zip tái lập được (cùng nội dung → cùng file zip).
const DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 20;
const DOS_TIME = 0;

export function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // cờ: tên UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // made by
    central.writeUInt16LE(20, 6); // needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, comp);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

export function buildDist(outDir = path.join(ROOT, 'dist')) {
  const name = `dao-den-long-web-v${pkg.version}`;
  const folder = path.join(outDir, name);
  fs.rmSync(folder, { recursive: true, force: true });
  const files = INCLUDE.flatMap(listFiles);
  const entries = [];
  for (const rel of files) {
    const data = fs.readFileSync(path.join(ROOT, rel));
    fs.mkdirSync(path.dirname(path.join(folder, rel)), { recursive: true });
    fs.writeFileSync(path.join(folder, rel), data);
    entries.push({ name: `${name}/${rel}`, data });
  }
  // package.json tối giản cho bản phát hành: ES module, không cần npm install.
  const distPkg = {
    name: pkg.name,
    version: pkg.version,
    private: true,
    type: 'module',
    engines: pkg.engines,
    scripts: { start: 'node tools/serve.js', headless: 'node src/headless.js', soak: 'node --expose-gc src/soak.js' },
  };
  const pkgBuf = Buffer.from(JSON.stringify(distPkg, null, 2) + '\n');
  fs.writeFileSync(path.join(folder, 'package.json'), pkgBuf);
  entries.push({ name: `${name}/package.json`, data: pkgBuf });
  const howto = Buffer.from([
    `Đảo Đèn Lồng v${pkg.version} – bản web`,
    '',
    'Yêu cầu: Node.js ≥ 18 và một trình duyệt hỗ trợ WebGL2 (Chrome, Edge, Firefox, Safari mới).',
    'Chạy:   node tools/serve.js      (hoặc: npm start)',
    'Rồi mở URL được in ra (mặc định http://localhost:8080/).',
    'Headless: node src/headless.js --seed 42 --night 1 --ticks 3000 --out out.jsonl',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(folder, 'CHAY-GAME.txt'), howto);
  entries.push({ name: `${name}/CHAY-GAME.txt`, data: howto });

  const zipPath = path.join(outDir, `${name}.zip`);
  fs.writeFileSync(zipPath, makeZip(entries));
  return { folder, zipPath, files: entries.length };
}

function main() {
  const i = process.argv.indexOf('--out-dir');
  const outDir = i >= 0 ? path.resolve(process.argv[i + 1]) : undefined;
  const r = buildDist(outDir);
  const kb = Math.round(fs.statSync(r.zipPath).size / 1024);
  console.log(`dist: ${r.files} file → ${path.relative(ROOT, r.folder) || r.folder}`);
  console.log(`zip:  ${path.relative(ROOT, r.zipPath) || r.zipPath} (${kb} KB)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`dist: ${e.message}\n`);
    process.exit(1);
  }
}
