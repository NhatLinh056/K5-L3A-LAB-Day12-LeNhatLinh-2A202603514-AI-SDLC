#!/usr/bin/env node
// Server tĩnh tối giản (không thư viện) để chạy game trong trình duyệt + API bảng xếp hạng.
//   npm start                                        chạy server (PORT=xxxx để đổi cổng; mặc định 8080,
//                                                    bận thì thử cổng kế tiếp)
//   npm start -- --export-leaderboard out.json       xuất bảng xếp hạng {"entries":[…]} rồi thoát
// Bảng xếp hạng lưu ở data/leaderboard.json (đổi bằng LEADERBOARD_FILE), còn sau khi tắt/mở lại game.
//   GET  /api/leaderboard   → {"entries":[…]}
//   POST /api/leaderboard   body {name, score, nights_won, seed} → 201 {"rank", "entries"} | 400 {"error"}
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEntry, addEntry, sortEntries, normalizeName, isoWithOffset } from '../src/leaderboard.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const START_PORT = Number(process.env.PORT) || 8080;
const LB_FILE = process.env.LEADERBOARD_FILE
  ? path.resolve(process.env.LEADERBOARD_FILE)
  : path.join(ROOT, 'data', 'leaderboard.json');
const MAX_BODY = 10 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

// ---------- Lưu trữ bảng xếp hạng ----------
export function loadBoard(file = LB_FILE) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data.entries) ? sortEntries(data.entries.filter((e) => validateEntry(e) === null)) : [];
  } catch (e) {
    if (e.code !== 'ENOENT') process.stderr.write(`serve: không đọc được ${file} (${e.message}); bắt đầu bảng rỗng\n`);
    return [];
  }
}

function saveBoard(entries, file = LB_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ entries }, null, 2) + '\n');
  fs.renameSync(tmp, file); // ghi nguyên tử: không để lại file hỏng nếu tắt giữa chừng
}

// ---------- HTTP ----------
function send(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify(obj));
}

function handleLeaderboard(req, res) {
  if (req.method === 'GET') return sendJson(res, 200, { entries: loadBoard() });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
  let body = '';
  let tooBig = false;
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY) tooBig = true;
  });
  req.on('end', () => {
    if (tooBig) return sendJson(res, 413, { error: 'Dữ liệu quá lớn.' });
    let d;
    try {
      d = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { error: 'JSON không hợp lệ.' });
    }
    const entry = {
      name: normalizeName(d?.name),
      score: d?.score,
      nights_won: d?.nights_won,
      achieved_at: isoWithOffset(), // thời điểm do server ghi
      seed: d?.seed,
    };
    const err = validateEntry(entry);
    if (err) return sendJson(res, 400, { error: err });
    const { entries, rank } = addEntry(loadBoard(), entry);
    saveBoard(entries);
    return sendJson(res, 201, { rank, entries });
  });
  return undefined;
}

function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad Request');
  }
  if (urlPath === '/api/leaderboard') return handleLeaderboard(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed');
  // Không phục vụ file ẩn (.env, .git, …).
  if (urlPath.split('/').some((seg) => seg.startsWith('.'))) return send(res, 403, 'Forbidden');
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.resolve(ROOT, '.' + urlPath);
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return send(res, 403, 'Forbidden');

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not Found');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
  return undefined;
}

function listen(port, triesLeft) {
  const server = http.createServer(handler);
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && triesLeft > 0) listen(port + 1, triesLeft - 1);
    else {
      process.stderr.write(`serve: ${e.message}\n`);
      process.exit(1);
    }
  });
  server.listen(port, HOST, () => {
    const shown = HOST === '0.0.0.0' || HOST === '127.0.0.1' ? 'localhost' : HOST;
    console.log(`Đảo Đèn Lồng đang chạy tại: http://${shown}:${port}/`);
    console.log(`Bảng xếp hạng: ${LB_FILE}`);
    console.log('Nhấn Ctrl+C để dừng.');
  });
}

// --export-leaderboard <file> | --export-leaderboard=<file>. Khi gọi `npm start --export-leaderboard f`
// (không có "--"), npm giữ cờ ở biến môi trường npm_config_export_leaderboard và chỉ chuyển tên file.
function exportTarget(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--export-leaderboard') return argv[i + 1] ?? null;
    if (argv[i].startsWith('--export-leaderboard=')) return argv[i].slice('--export-leaderboard='.length);
  }
  const env = process.env.npm_config_export_leaderboard;
  if (env !== undefined) return env && env !== 'true' ? env : argv.find((a) => !a.startsWith('--')) ?? null;
  return undefined;
}

const target = exportTarget(process.argv.slice(2));
if (target === null) {
  process.stderr.write('serve: --export-leaderboard cần đường dẫn file, ví dụ: npm start -- --export-leaderboard out.json\n');
  process.exit(1);
} else if (target !== undefined) {
  const entries = loadBoard();
  fs.writeFileSync(target, JSON.stringify({ entries }, null, 2) + '\n');
  console.log(`Đã xuất ${entries.length} mục bảng xếp hạng ra ${target}`);
  process.exit(0);
} else {
  listen(START_PORT, 10);
}
