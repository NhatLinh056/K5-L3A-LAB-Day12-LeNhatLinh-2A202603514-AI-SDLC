# Hướng dẫn dành cho AI Agent (AGENTS.md)

Dự án: **Đảo Đèn Lồng** (Day 12 AI SDLC Lab)
Học viên: Lê Nhật Linh (MSSV: 2A202603514)

## 1. Lệnh quan trọng
- Cài đặt: `npm install && npx playwright install chromium`
- Kiểm thử toàn diện: `npm test` (hoặc `node --test`)
- Chạy game giao diện web: `npm start`
- Chế độ headless: `node src/headless.js --seed <int> --night 1|2|3 --ticks <int> --out <file.jsonl>`
- Chạy soak test: `npm run soak` (hoặc `node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json`)
- Chạy benchmark: `npm run bench` (hoặc `node tools/bench.js --seed 42 --duration 30 --out bench.json`)
- Đóng gói phát hành: `npm run dist`
- Xuất bảng xếp hạng: `node tools/serve.js --export-leaderboard out.json`

## 2. Quy tắc kiến trúc bắt buộc
1. **Tách biệt hoàn toàn Logic và Render:**
   - Mọi luật chơi, trạng thái mô phỏng, tính toán vật lý, bộ đếm thời gian, va chạm nằm trong `src/logic/`.
   - `src/render/` chỉ đọc dữ liệu từ logic để hiển thị 3D Three.js, tuyệt đối không can thiệp thay đổi luật hay trạng thái mô phỏng.
2. **Tính tất định (Determinism):**
   - Chỉ dùng PRNG Mulberry32 (`src/logic/rng.js`) truyền qua seed.
   - CẤM dùng `Math.random()` trong bất kỳ file nào thuộc `src/logic/`.
3. **Thứ tự xử lý trong tick (Ticket-02 & Ticket-03):**
   - Tốc độ cố định 60 tick/giây.
   - Tuân thủ nghiêm ngặt 12 bước trong 1 tick theo tài liệu yêu cầu.
   - Trừ hao dầu và Bóng Mực drain dầu diễn ra ở bước 2; nếu fuel <= 0 đèn tắt ngay.
   - Thắng / thua xét ở cuối tick. Hết lửa (`no_flames`) luôn thua trước kể cả đúng tick bình minh.
4. **Không làm hỏng Test Contract:**
   - Các tính năng sáng tạo đồ họa (Bé Cáo Ánh Sáng Ember Fox, hiệu ứng âm thanh) chỉ hoạt động ở tầng visual/render, không được sinh thêm thực thể làm thay đổi snapshot hoặc event trong headless runner.
