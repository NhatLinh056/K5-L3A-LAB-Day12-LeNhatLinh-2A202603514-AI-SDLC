# Đặc tả yêu cầu kỹ thuật - Phase 3 (Ticket-03 "Đèn cạn dầu")

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Contract Version:** 1.2  
**Tag nộp:** `phase-3`

---

## 1. Bối cảnh & Mục tiêu
Change Request từ khách hàng: Đổi trọng tâm trải nghiệm từ "thắp đủ đèn thắng sớm" sang "giữ đảo sáng đến bình minh". Đèn đã thắp sẽ bị cạn dầu theo thời gian và bị Bóng Mực hút trộm dầu.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
- **P3-01:** Contract v1.2 bổ sung các tham số nhiên liệu (`fuel_max: 100`, `fuel_decay_per_s: 1.0`, `fuel_per_mote: 10`, `relight_cost: 5`, `win_ratio: 0.6`, `drain_per_s: 5`, `low_fuel_threshold: 30`, `capacity_max: 20`).
- **P3-02:** Đèn sáng tự động hao dầu với tốc độ 1.0 đơn vị/giây (1/60 đơn vị mỗi tick).
- **P3-03:** Hết dầu (`fuel <= 0`) thì đèn tắt, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
- **P3-04:** Thắp lại đèn đã từng sáng (`ever_lit`) chỉ tốn 5 đom đóm (thay vì 10). Đèn chưa từng sáng vẫn cần 10 đom đóm.
- **P3-05:** Châm dầu ở đèn đang sáng dùng `min(đang mang, ceil((100 - fuel)/10))` đom đóm. Đèn đầy dầu (100) không cho phép tương tác.
- **P3-06:** Khi đèn có `fuel < 30`, vùng an toàn biến mất. Bóng Mực ở trạng thái `wander` tìm tới đèn yếu và chuyển sang trạng thái `drain` khi cách <= 2m, hút 5 fuel/giây.
- **P3-07:** Bóng Mực đang `drain` chuyển sang `chase` khi Mây vào trong bán kính 6m. Tỏa Sáng trúng bóng đang `drain` cộng thưởng +15 điểm.
- **P3-08:** Thắp đủ đèn không kết thúc game sớm. Khi hết giờ (bình minh), nếu số đèn sáng >= 60% tổng số đèn (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) thì Thắng với lý do `dawn_survived`. Nếu dưới ngưỡng thì Thua với lý do `dawn`.
- **P3-09:** Hết Ngọn Lửa ở bất kỳ thời điểm nào (kể cả tick bình minh) đều thua ngay lập tức với lý do `no_flames`.
- **P3-10:** Cơ chế mở rộng sức chứa: `capacity = 10 + 2 * successful_lights` (tối đa 20).
- **P3-11:** Công thức tính điểm chuẩn hóa theo Ticket-03: +5 nạp đom đóm, +100 thắp lần đầu, +40 thắp lại, +5 trúng pulse (+15 nếu đang drain); thưởng bình minh khi thắng: 50/đèn + floor(fuel) + 50/lửa còn lại.
- **P3-12:** Các bài test cũ bị luật mới thay thế được cập nhật có giải thích lý do rõ ràng, không bỏ qua âm thầm.
