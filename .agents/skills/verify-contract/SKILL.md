---
name: verify-contract
description: Kiểm chứng tính hợp lệ của Test Contract và chạy regression test cho game Đảo Đèn Lồng
---

# Quy trình kiểm chứng Test Contract

Mỗi khi có thay đổi trong `src/logic/` hoặc chuẩn bị kết thúc một Phase:

1. Chạy toàn bộ test suites:
   ```bash
   npm test
   ```
   Đảm bảo tất cả 70 bài test đơn vị và kịch bản đều đạt (pass 70, fail 0).

2. Kiểm tra tính tất định của chế độ headless:
   ```bash
   node src/headless.js --seed 42 --night 1 --ticks 600 --out temp1.jsonl
   node src/headless.js --seed 42 --night 1 --ticks 600 --out temp2.jsonl
   ```
   So sánh `temp1.jsonl` và `temp2.jsonl` phải trùng khớp 100%.

3. Kiểm tra định dạng đầu ra snapshot và sự kiện:
   - Dòng đầu tiên là snapshot `tick: 0`.
   - Dòng cuối cùng là `{"type":"end", ...}`.
   - Các sự kiện phát ra đúng tên và thuộc tính theo Test Contract.
