// Bảng xếp hạng cục bộ (TICKET-04 mục 3). Thuần JS, dùng chung cho tools/serve.js (Node) và giao diện.
// Mỗi mục: { name, score, nights_won, achieved_at, seed }.
//   - Tên 3–12 ký tự gồm chữ, số, "_" (cho phép chữ tiếng Việt có dấu; không dấu cách).
//   - Giữ top 10; sắp score giảm dần, bằng điểm thì ai đạt trước (achieved_at sớm hơn) đứng trên.

export const MAX_ENTRIES = 10;
const NAME_RE = /^[\p{L}\p{M}\p{N}_]+$/u;
const ISO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export const normalizeName = (name) => (typeof name === 'string' ? name.normalize('NFC').trim() : name);

// Trả về chuỗi lỗi (tiếng Việt) hoặc null nếu hợp lệ.
export function validateName(name) {
  if (typeof name !== 'string') return 'Tên phải là chuỗi ký tự.';
  const n = normalizeName(name);
  const len = [...n].length;
  if (len < 3 || len > 12) return 'Tên phải dài 3–12 ký tự.';
  if (!NAME_RE.test(n)) return 'Tên chỉ gồm chữ, số và dấu gạch dưới _ (không dấu cách, không ký hiệu).';
  return null;
}

export function validateEntry(e) {
  if (!e || typeof e !== 'object') return 'Mục không hợp lệ.';
  const nameErr = validateName(e.name);
  if (nameErr) return nameErr;
  if (!Number.isInteger(e.score) || e.score < 0) return 'score phải là số nguyên ≥ 0.';
  if (!Number.isInteger(e.nights_won) || e.nights_won < 0 || e.nights_won > 3) return 'nights_won phải từ 0 đến 3.';
  if (!Number.isInteger(e.seed)) return 'seed phải là số nguyên.';
  if (typeof e.achieved_at !== 'string' || !ISO_TZ_RE.test(e.achieved_at) || Number.isNaN(Date.parse(e.achieved_at))) {
    return 'achieved_at phải là thời điểm ISO 8601 có múi giờ.';
  }
  return null;
}

export function compareEntries(a, b) {
  return b.score - a.score || Date.parse(a.achieved_at) - Date.parse(b.achieved_at);
}

// Thêm một mục; trả về { entries (top 10, đã sắp), rank (1-based, null nếu không vào top 10) }.
// Sort của JS ổn định: cùng điểm và cùng thời điểm thì mục có trước đứng trên.
export function addEntry(entries, entry) {
  const all = [...entries, entry].sort(compareEntries);
  const top = all.slice(0, MAX_ENTRIES);
  const i = top.indexOf(entry);
  return { entries: top, rank: i >= 0 ? i + 1 : null };
}

export function sortEntries(entries) {
  return [...entries].sort(compareEntries).slice(0, MAX_ENTRIES);
}

// Thời điểm ISO 8601 theo giờ máy, kèm múi giờ, ví dụ 2026-11-20T16:05:09+07:00.
export function isoWithOffset(date = new Date()) {
  const pad = (n) => String(Math.abs(n)).padStart(2, '0');
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`;
}
