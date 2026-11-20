# Báo cáo tổng kết dự án (Retro)

**Dự án:** Đảo Đèn Lồng — 3D Game AI SDLC  
**Học viên:** Lê Nhật Linh (MSSV: 2A202603514)  
**Khóa:** K5-L3A — AI Thực chiến (VinUni-AI20k)

---

## 1. Tổng quan kết quả đạt được
- Hoàn thành đầy đủ 4 phase từ PRD-0 đến bản phát hành thương mại v1.0.0.
- Vượt qua 100% bộ kiểm thử tự động: **70/70 tests PASS**, bao gồm cả kiểm thử chức năng, kiểm thử hồi quy qua 4 phase, kiểm thử tính tất định và kiểm thử hiệu năng.
- Chế độ Benchmark đạt kết quả xuất sắc: **300.3 FPS trung bình**, **1% Low 146.4 FPS**, **thời gian tải 1.9 giây** (vượt xa ngưỡng yêu cầu 60 FPS / 30 FPS / 10s).
- Soak test đạt chuẩn 100%: 10 Đêm liên tục không crash, bộ nhớ giữ ở mức ổn định 40 - 49 MB (ngưỡng an toàn < 1.2x).
- Tính năng sáng tạo độc đáo: **Bé Cáo Ánh Sáng (Ember Fox)** chạy theo Mây, quẫy đuôi phát sáng cảnh báo khi Bóng Mực tới gần.

## 2. Đánh giá quy trình làm việc cùng AI
### Điều gì hiệu quả
- **Kiến trúc phân tách Logic và Render:** Đây là quyết định cốt lõi giúp dự án thành công. Tầng logic độc lập 60 tick/s chạy headless siêu tốc (~0.37s cho 21.600 tick) giúp việc chạy test tự động cực kỳ nhanh, tiết kiệm thời gian và token.
- **Harness AI (AGENTS.md & Skills):** Cung cấp bộ lệnh build/test ngắn gọn, quy ước cấm `Math.random()` và thứ tự xử lý trong tick giúp agent không mắc lại lỗi cũ.
- **Kế hoạch kiểm chứng trước khi viết code (TDD):** Viết các scenario fixture và test case trước giúp định hình đúng contract ngay từ đầu.

### Khó khăn & Bài học kinh nghiệm
- **Xử lý Change Request giữa chừng:** Phase 3 đưa ra thay đổi phá vỡ tương thích lớn (đèn cạn dầu, không thắng sớm). Bài học rút ra là phải viết ADR (Architecture Decision Record) trước khi sửa code và rà soát có hệ thống các test cũ bị ảnh hưởng, thay vì sửa chắp vá.
- **Quản lý Token:** Việc giữ ngữ cảnh ngắn, chỉ nạp tài liệu phase hiện tại và sử dụng lệnh shell có chọn lọc giúp chi phí toàn bộ bài lab chỉ tốn chưa tới $1.

## 3. Nếu làm lại từ đầu thì sẽ thay đổi gì?
- Ngay từ Phase 1 sẽ lưu trữ mọi biến số thời gian và nhiên liệu dưới dạng tick integer ngay từ đầu để tránh phải refactor sang `FUEL_UNIT = 60` ở Phase 3.
- Tự động hóa hook pre-commit để chạy `npm test` trước mỗi commit, đảm bảo không bao giờ commit nhầm mã khi test đang đỏ.
