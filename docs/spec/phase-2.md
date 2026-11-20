# Đặc tả yêu cầu kỹ thuật - Phase 2 (Ticket-02 "Ba hòn đảo")

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Contract Version:** 1.1  
**Tag nộp:** `phase-2`

---

## 1. Mục tiêu
Đồng bộ các số liệu chuẩn (tốc độ chạy 6.0 m/s, nhảy 7.0 m/s, lướt 14 m/s) và mở rộng game thành chuỗi 3 Đêm trên 3 hòn đảo khác nhau (Đảo Bến, Đảo Cau, Đảo Chuông). Bổ sung cơ chế Lướt (Dash), bục nhảy (Jump Pad), dốc, Gió Lạc (Drifter) và Bùa Gió (Charm).

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
- **P2-01:** `game.contract.json` tuân theo Contract v1.1, có đủ các trường mở rộng `dash_*`, `night2_duration_s`, `night3_duration_s`.
- **P2-02:** Hồi quy: Toàn bộ 14 bài test Phase 1 vẫn đạt khi chạy với số chuẩn Ticket-02.
- **P2-03:** Snapshot v1.1 bổ sung các trường: `night`, `wind`, `player.vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`, cùng các mảng `motes`, `drifters`, `charms`.
- **P2-04:** Kỹ năng Lướt (Dash) di chuyển 14 m/s trong 12 tick (0.2s), hồi chiêu 90 tick (1.5s). Lướt trên không giữ nguyên độ cao Y.
- **P2-05:** Tỏa Sáng làm choáng Bóng Mực trong 120 tick và đẩy lùi 4m trong 15 tick đầu. Không đủ 3 đom đóm thì không kích hoạt.
- **P2-06:** Chạm Bóng Mực mất 1 Ngọn Lửa, làm rơi `floor(carried / 2)` đom đóm ra vành 1.5 - 2.5m, bất tử 90 tick, bóng bị giật lùi 2m trong 60 tick.
- **P2-07:** Rơi khỏi đảo (`Y < -10`): Mất 1 Ngọn Lửa, mất toàn bộ đom đóm, chờ 60 tick rồi hồi sinh tại `(0, 0, 0)` với 90 tick bất tử.
- **P2-08:** Đèn vừa thắp đẩy Bóng Mực trong vùng 6m ra mép trong 30 tick và không gây sát thương.
- **P2-09:** Hết Ngọn Lửa thì thua ngay (`no_flames`). Thắp đèn cuối cùng đúng tick hết giờ vẫn được tính thắng.
- **P2-10:** Đêm 2 (Đảo Cau) gồm 2 đảo tròn bán kính 28m nối bằng cầu tre x in [26, 44], z in [-2, 2]; bục nhảy phóng sang tâm đảo đối diện.
- **P2-11:** Đêm 3 (Đảo Chuông) có 3 tầng cao (Y=0, Y=3, Y=6); 2 dốc ở góc 30 và 150 độ; bục nhảy lên tầng 2; tháp chuông trụ bán kính 2m không thể leo.
- **P2-16:** Hiệu năng: Chạy headless 21.600 tick (1 Đêm hoàn chỉnh) hoàn thành trong <= 30 giây (thực tế chạy ~0.38 giây).
