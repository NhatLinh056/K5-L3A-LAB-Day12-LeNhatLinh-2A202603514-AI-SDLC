# ADR 0001: Thay đổi mô hình trạng thái Đèn Lồng và Luật Thắng Bình Minh

**Trạng thái:** Chấp thuận (Accepted)  
**Ngày:** 2026-11-20  
**Tác giả:** Lê Nhật Linh (2A202603514)  
**Phạm vi:** Phase 3 (Ticket-03 "Đèn cạn dầu")

---

## 1. Ngữ cảnh
Trong Phase 1 và Phase 2, luật chơi quy định:
- Đèn sau khi nạp đủ 10 đom đóm sẽ chuyển sang trạng thái sáng vĩnh viễn (`lit: true`) và tạo vùng an toàn 6m bất khả xâm phạm.
- Game kết thúc và người chơi Thắng ngay khi tất cả các đèn trên đảo được thắp sáng (`all_lit`).

Sau đợt chơi thử (playtest), nhà thiết kế nhận thấy người chơi có kỹ năng cao dễ dàng thắp sáng toàn bộ hòn đảo chỉ trong chưa đầy 2 phút, dẫn đến việc thiếu sự kịch tính và áp lực sinh tồn ở nửa sau của Đêm. Yêu cầu Change Request (Ticket-03) đặt ra việc:
1. Đèn sáng vẫn bị tiêu hao dầu theo thời gian (1.0 fuel/giây).
2. Khi đèn yếu (fuel < 30), vùng an toàn biến mất và Bóng Mực có thể tiếp cận hút dầu (5 fuel/giây).
3. Đèn có thể bị tắt khi hết dầu và cần được châm dầu hoặc thắp lại.
4. Mục tiêu chuyển thành: Sống sót đến bình minh và giữ được tối thiểu 60% số đèn sáng (`dawn_survived`).

## 2. Quyết định kiến trúc & Thiết kế
1. **Lưu trữ nhiên liệu ở đơn vị nguyên 1/60:**
   - Để tránh sai số số thực (`floating-point error`) tích lũy qua hàng chục nghìn tick mô phỏng, mức nhiên liệu tối đa 100 được lưu trữ dưới dạng số nguyên `6000 đơn vị` (100 * 60).
   - Tốc độ hao tự nhiên: trừ đúng 1 đơn vị mỗi tick (tương đương 1 fuel/giây).
   - Tốc độ hút của Bóng Mực drain: trừ 5 đơn vị mỗi tick (tương đương 5 fuel/giây).
   - Khi xuất ra JSON snapshot hoặc giao diện HUD, giá trị được chia cho 60 và làm tròn 1 chữ số thập phân (`round1`).

2. **Máy trạng thái Đèn Lồng:**
   - Trạng thái `unlit`: Chưa sáng, cần 10 đom đóm (nếu `ever_lit = false`) hoặc 5 đom đóm (nếu `ever_lit = true`).
   - Trạng thái `lit`: Đang sáng, `fuel in (0, 100]`.
   - Vùng an toàn 6m: Chỉ kích hoạt khi `fuel >= 30`. Khi `fuel < 30`, vùng an toàn lập tức bị vô hiệu hóa, phát tín hiệu cho Bóng Mực `wander` chuyển hướng tiếp cận.
   - Khi `fuel <= 0`: Đèn chuyển về `unlit`, `deposited = 0`, ghi nhận `ever_lit = true` và phát sự kiện `lantern_out`.

3. **Luật Thắng & Phân xử tại Tick Bình Minh:**
   - Xóa bỏ điều kiện thắng sớm `all_lit`.
   - Tại tick cuối cùng của Đêm (khi `time_left_ticks <= 0`):
     - Kiểm tra sinh mạng: Nếu Mây hết lửa (`flames <= 0`), người chơi LUÔN THUA với lý do `no_flames`.
     - Nếu Mây còn sống: Đếm số đèn đang sáng (`lit = true`). Nếu `số đèn sáng / tổng số đèn >= 0.6` -> Thắng (`dawn_survived`). Ngược lại -> Thua (`dawn`).

## 3. Hệ quả & Xử lý hồi quy test
- Toàn bộ các test cũ kỳ vọng game kết thúc khi thắp đủ đèn (`ac13-win.test.js`, `p2-09-win-lose.test.js`) được cập nhật sang kỳ vọng game tiếp tục chạy đến bình minh.
- Snapshot mở rộng thêm các trường `fuel`, `ever_lit`, `relit_count` trên từng thực thể đèn.
- Hệ thống test được bổ sung 12 kịch bản mới (`p3-01` đến `p3-12`) chứng minh toàn bộ các trạng thái hao dầu, châm dầu, thắp lại và hút dầu hoạt động chuẩn xác 100%.
