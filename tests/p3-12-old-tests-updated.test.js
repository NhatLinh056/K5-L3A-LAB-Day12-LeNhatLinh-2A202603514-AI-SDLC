// P3-12: test cũ bị luật v1.2 thay thế đã được sửa (hoặc xóa) kèm comment "[v1.2]" ghi lý do;
// không có test nào bị skip/todo âm thầm.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.js';

const TESTS = path.join(ROOT, 'tests');
// Các test phải đổi vì TICKET-03 (thời lượng Đêm, điểm mới, relight, luật thắng dawn_survived).
const CHANGED_V12 = [
  'ac01-contract.test.js', 'ac02-smoke.test.js', 'ac08-deposit.test.js', 'ac13-win.test.js',
  'p2-01-contract-v11.test.js', 'p2-09-win-lose.test.js',
];

test('P3-12: test cũ đổi theo v1.2 có ghi lý do, không skip', () => {
  const files = fs.readdirSync(TESTS).filter((f) => f.endsWith('.test.js'));
  for (const f of CHANGED_V12) {
    assert.ok(files.includes(f), `thiếu ${f} (nếu xóa thì phải ghi lý do ở đây)`);
    assert.match(fs.readFileSync(path.join(TESTS, f), 'utf8'), /\[v1\.2\]/, `${f} thiếu comment [v1.2]`);
  }
  for (const f of files) {
    const src = fs.readFileSync(path.join(TESTS, f), 'utf8');
    assert.doesNotMatch(src, /\btest\.(skip|todo)\(|\{\s*(skip|todo)\s*:/, `${f} có test bị skip/todo`);
  }
});
