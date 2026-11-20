# Đặc tả yêu cầu kỹ thuật - Phase 4 (Ticket-04 "Phát hành v1.0.0")

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Contract Version:** 1.3  
**Tag nộp:** `phase-4` + Release `v1.0.0`

---

## 1. Mục tiêu
Hoàn thiện dự án đạt tiêu chuẩn sản phẩm phát hành thương mại: Đo lường hiệu năng chính xác với Benchmark mode, kiểm thử độ bền bỉ và ổn định bộ nhớ với Soak test, Bảng xếp hạng cục bộ top 10 lưu trữ đĩa, Tùy chọn trợ năng (đổi phím, cỡ chữ, giảm chuyển động, chỉ báo hình ảnh), đóng gói phát hành độc lập `npm run dist` và tài liệu hóa toàn diện.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
- **P4-01:** `game.contract.json` đạt phiên bản 1.3, khai báo thêm `bench_cmd` và `soak_cmd`.
- **P4-02:** Soak test chạy 10 Đêm xoay vòng liên tục (1 -> 2 -> 3 -> 1...) không crash, bộ nhớ kết thúc không vượt quá 1.2 lần bộ nhớ ban đầu (`mem_end_mb <= 1.2 * mem_start_mb`).
- **P4-03:** Benchmark mode tính toán chuẩn xác các chỉ số FPS trung bình (`avg_fps`), 1% Low FPS (`p1_low_fps`), frame time phân vị 95 (`frame_ms_p95`), số khung hình và bộ nhớ đỉnh (`peak_mem_mb`).
- **P4-04:** Cảnh benchmark chuẩn gồm 200 Bóng Mực wander, 100 đom đóm, 3 đèn sáng đầy dầu trên Đêm 1; camera bay quỹ đạo tròn bán kính 30m, độ cao Y=15m trong 30 giây (bỏ 3s đầu làm ấm).
- **P4-05:** Bảng xếp hạng cục bộ lưu Top 10 người chơi cao điểm nhất, lưu trữ bền vững trên đĩa tại `data/leaderboard.json`, bảo toàn sau khi tắt mở lại game. Lệnh `--export-leaderboard out.json` xuất đúng danh sách.
- **P4-10:** Đóng gói bản phát hành `npm run dist` tạo thư mục `dist/` và file zip chứa toàn bộ mã nguồn, asset và thư viện Three.js độc lập, chạy được ngay bằng lệnh `node tools/serve.js`.
