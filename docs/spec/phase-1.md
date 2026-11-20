# Đặc tả yêu cầu kỹ thuật - Phase 1 (PRD-0)

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Contract Version:** 1.0  
**Tag nộp:** `phase-1`

---

## 1. Mục tiêu
Xây dựng màn đầu tiên: **Đêm 1 – Đảo Bến**, một hòn đảo tròn bán kính 40m có 5 Đèn Lồng Lớn. Người chơi điều khiển Mây đi gom đom đóm thắp sáng đảo và né tránh Bóng Mực. Cung cấp chế độ chạy không giao diện (headless) tuân thủ Test Contract v1.0.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
- **AC1:** `game.contract.json` có cấu trúc hợp lệ, `tuning` phản ánh đúng các hằng số mô phỏng của game.
- **AC2:** Chạy headless `--ticks 100` thoát mã 0, dòng đầu là snapshot tick 0, dòng cuối là `end`.
- **AC3:** Tính tất định: Hai lần chạy cùng `--seed 42` cho kết quả snapshot và event giống hệt nhau.
- **AC4:** File inputs có tick không tăng nghiêm ngặt thì thoát mã 2 (`EXIT_FORMAT`).
- **AC5:** Di chuyển thẳng `[0, 1]` với tốc độ 6.0 m/s đưa Mây về phía +Z đúng khoảng cách sau 60 tick.
- **AC6:** Di chuyển với `cam_yaw_deg: 90` đưa Mây di chuyển về phía +X.
- **AC7:** Nhặt đom đóm tự động khi khoảng cách XZ <= 1.0 m và chênh cao <= 1.5 m.
- **AC8:** Nạp đủ 10 đom đóm vào đèn trong bán kính 2.0 m thì đèn chuyển sang sáng (`lit: true`).
- **AC9:** Tỏa Sáng tốn 3 đom đóm, làm choáng Bóng Mực trong 5m trong 120 tick; hồi chiêu 180 tick (3s).
- **AC10:** Chạm Bóng Mực mất 1 Ngọn Lửa, rơi đom đóm, bất tử 90 tick (1.5s).
- **AC11:** Mất hết Ngọn Lửa thì thua ngay lập tức với lý do `no_flames`.
- **AC12:** Hết thời gian Đêm (300s / 18.000 tick) mà chưa thắp đủ đèn thì thua với lý do `dawn`.
- **AC13:** Thắp đủ 5 đèn thì thắng với lý do `all_lit`.
- **AC14:** Bóng Mực ở ngoài không thể bước vào vùng an toàn bán kính 6.0 m của đèn đã thắp.

## 3. Các giả định kỹ thuật
- Tọa độ người chơi xuất phát tại `(0, 0, 0)` trên mặt phẳng `Y = 0`, hướng quay ban đầu `+Z`.
- Tốc độ tick mô phỏng cố định 60 tick/s (1 tick = 1/60s).
- Mọi khoảng cách được đo trên mặt phẳng XZ (trừ khi có quy định chênh cao Y).
- Sử dụng PRNG Mulberry32 để đảm bảo tính tất định xuyên suốt.
