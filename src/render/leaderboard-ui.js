// Giao diện bảng xếp hạng: nhập tên sau khi Đêm kết thúc, màn hình Bảng xếp hạng từ menu.
// Dữ liệu lưu qua API của tools/serve.js (data/leaderboard.json), nên còn sau khi tắt/mở lại game.
import { validateName, normalizeName } from '../leaderboard.js';

const API = './api/leaderboard';

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function renderList(ol, entries, highlightRank = null) {
  ol.replaceChildren();
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Chưa có ai. Hãy là người đầu tiên!';
    li.style.listStyle = 'none';
    ol.append(li);
    return;
  }
  entries.forEach((e, i) => {
    const li = document.createElement('li');
    if (highlightRank === i + 1) li.className = 'me';
    li.append(`${e.name} — ${e.score} điểm `);
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `(${e.nights_won} Đêm thắng · ${fmtDate(e.achieved_at)})`;
    li.append(meta);
    ol.append(li);
  });
}

async function api(method, body) {
  const res = await fetch(API, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-cache',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Máy chủ trả lỗi ${res.status}`);
  return data;
}

const OFFLINE = 'Không kết nối được máy chủ bảng xếp hạng (hãy chạy game bằng "npm start").';

export function createLeaderboardUi() {
  const $ = (id) => document.getElementById(id);
  const form = $('lb-form');
  const input = $('lb-name');
  const msg = $('lb-msg');
  const endList = $('lb-end-list');
  const board = $('board');
  const boardList = $('lb-list');
  const boardMsg = $('lb-board-msg');
  let pending = null; // { score, nights_won, seed } của lượt chơi vừa xong
  let returnTo = null;

  const setMsg = (el, text, kind = '') => {
    el.textContent = text;
    el.className = `msg ${kind}`;
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!pending) return;
    const name = normalizeName(input.value);
    const err = validateName(name);
    if (err) return setMsg(msg, err, 'error');
    $('lb-save').disabled = true;
    try {
      const { rank, entries } = await api('POST', { name, ...pending });
      pending = null;
      // Đã lưu: ẩn ô nhập, hiện thông báo + bảng xếp hạng với dòng của mình được tô sáng.
      form.querySelector('.row').hidden = true;
      form.querySelector('label').hidden = true;
      setMsg(msg, rank ? `Đã lưu! Hạng ${rank}.` : 'Đã lưu, nhưng chưa vào top 10.', 'ok');
      renderList(endList, entries, rank);
      endList.hidden = false;
    } catch (e) {
      setMsg(msg, e.message === 'Failed to fetch' ? OFFLINE : e.message, 'error');
    } finally {
      $('lb-save').disabled = false;
    }
    return undefined;
  });

  async function openBoard(from) {
    returnTo = from;
    if (from) from.hidden = true;
    board.hidden = false;
    setMsg(boardMsg, 'Đang tải…');
    try {
      const { entries } = await api('GET');
      renderList(boardList, entries);
      setMsg(boardMsg, '');
    } catch (e) {
      boardList.replaceChildren();
      setMsg(boardMsg, e.message === 'Failed to fetch' ? OFFLINE : e.message, 'error');
    }
  }
  $('btn-board-back').addEventListener('click', () => {
    board.hidden = true;
    if (returnTo) returnTo.hidden = false;
  });
  $('btn-board').addEventListener('click', () => openBoard($('start')));
  $('btn-end-board').addEventListener('click', () => openBoard($('end')));

  return {
    // Gọi khi Đêm kết thúc: mở ô nhập tên cho điểm của lượt chơi.
    offerEntry({ score, nights_won, seed }) {
      pending = { score, nights_won, seed };
      form.hidden = false;
      form.querySelector('.row').hidden = false;
      form.querySelector('label').hidden = false;
      endList.hidden = true;
      input.value = '';
      setMsg(msg, `Điểm được lưu: ${score} (tổng điểm các Đêm đã thắng).`);
    },
    hideBoard() {
      board.hidden = true;
    },
  };
}
