// P2-02: toàn bộ test Phase 1 vẫn còn và chạy với số chuẩn (chúng chạy cùng `npm test`);
// test nào đổi kỳ vọng thì phải có comment "[v1.1]" ghi lý do — không xóa test âm thầm.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.js';

const TESTS = path.join(ROOT, 'tests');
const PHASE1 = Array.from({ length: 14 }, (_, i) => `ac${String(i + 1).padStart(2, '0')}-`);
// Các test Phase 1 phải đổi kỳ vọng/scenario vì số chuẩn TICKET-02.
const CHANGED = ['ac01-', 'ac02-', 'ac07-', 'ac08-', 'ac09-', 'ac13-', 'ac14-'];

test('P2-02: đủ 14 test Phase 1, test đổi kỳ vọng có ghi lý do [v1.1]', () => {
  const files = fs.readdirSync(TESTS).filter((f) => f.endsWith('.test.js'));
  for (const prefix of PHASE1) {
    const f = files.find((x) => x.startsWith(prefix));
    assert.ok(f, `thiếu test Phase 1 ${prefix}*`);
    const src = fs.readFileSync(path.join(TESTS, f), 'utf8');
    assert.match(src, /\btest\(/, `${f} không còn test nào`);
    if (CHANGED.includes(prefix)) assert.match(src, /\[v1\.1\]/, `${f} đổi kỳ vọng nhưng thiếu comment [v1.1]`);
  }
});
