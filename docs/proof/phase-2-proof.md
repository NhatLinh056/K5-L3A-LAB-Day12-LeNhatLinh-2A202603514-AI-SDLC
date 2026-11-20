# Bằng chứng kiểm chứng - Phase 2 (Proof)

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Mốc:** Tag `phase-2` (Contract v1.1)

---

## 1. Bảng đối chiếu Yêu cầu - Bằng chứng (Traceability Matrix)

| Mã AC | Yêu cầu kiểm chứng | Phương pháp kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|:---:|
| **P2-01** | Test Contract v1.1 hợp lệ | Test `p2-01-contract-v11.test.js` | Khóa `dash_*`, `night2_duration_s`, `night3_duration_s` | **ĐẠT** |
| **P2-02** | Hồi quy toàn bộ 14 test Phase 1 | Test `p2-02-regression.test.js` | Chạy lại AC1..AC14 với số chuẩn, 14/14 pass | **ĐẠT** |
| **P2-03** | Snapshot đủ trường v1.1 | Test `p2-03-snapshot-v11.test.js` | Có `night`, `wind`, `motes`, `drifters`, `charms` | **ĐẠT** |
| **P2-04** | Kỹ năng Lướt 14 m/s trong 12 tick | Test `p2-04-dash.test.js` | Di chuyển 2.8m trong 12 tick, cd 90 tick | **ĐẠT** |
| **P2-05** | Tỏa Sáng đẩy lùi 4m và choáng 120 tick | Test `p2-05-pulse.test.js` | Choáng 120 tick, đẩy 4m trong 15 tick đầu | **ĐẠT** |
| **P2-06** | Bị đánh rơi đom đóm, recoil 2m | Test `p2-06-hit.test.js` | Rơi floor(carried/2) ra vành 1.5-2.5m | **ĐẠT** |
| **P2-07** | Rơi khỏi đảo Y < -10 rồi hồi sinh | Test `p2-07-fall.test.js` | Mất 1 lửa, mất hết đồ, hồi sinh ở (0,0,0) | **ĐẠT** |
| **P2-08** | Đèn thắp đẩy bóng mực ra khỏi 6m | Test `p2-08-safe-zone.test.js` | Đẩy ra mép 6m trong 30 tick không gây sát thương | **ĐẠT** |
| **P2-09** | Xử lý Thắng / Thua theo Ticket-02 | Test `p2-09-win-lose.test.js` | Hết lửa -> no_flames; thắp đèn cuối đúng lúc hết giờ -> won | **ĐẠT** |
| **P2-10** | Đêm 2 (Đảo Cau) cầu tre và bục nhảy | Test `p2-10-night2.test.js` | Đi qua cầu tre không rơi; bục nhảy đưa sang đảo B | **ĐẠT** |
| **P2-11** | Đêm 3 (Đảo Chuông) 3 tầng và dốc | Test `p2-11-night3.test.js` | Đi lên dốc 30° Y=3; bục nhảy lên tầng 2 (Y=6); vách đứng chặn | **ĐẠT** |
| **P2-16** | Hiệu năng: 21.600 tick <= 30s | Test `p2-16-performance.test.js` | Chạy 21.600 tick trong **0.37 giây** (nhanh gấp 80 lần) | **ĐẠT** |

## 2. Kết quả chạy test mẫu
```text
✔ P2-01: contract (≥ v1.1) và tuning chuẩn TICKET-02 còn hiệu lực (2.4641ms)
✔ P2-02: đủ 14 test Phase 1, test đổi kỳ vọng có ghi lý do [v1.1] (21.7444ms)
✔ P2-03: snapshot đủ trường v1.1 (154.7935ms)
✔ P2-04: lướt 14 m/s trong 12 tick, hồi chiêu 90 tick (128.2924ms)
✔ P2-05: Tỏa Sáng choáng 120 tick và đẩy 4 m trong 15 tick (183.604ms)
✔ P2-06: bị đánh rơi đom đóm ra vành, bất tử 90 tick, recoil (139.8941ms)
✔ P2-07: rơi khỏi đảo rồi hồi sinh (132.7289ms)
✔ P2-08: đẩy Bóng Mực ra khỏi vùng an toàn khi đèn vừa thắp (158.3281ms)
✔ P2-09: hết lửa → lost no_flames (152.4979ms)
✔ P2-10: Đêm 2 có 6 đèn đúng tọa độ chuẩn, cầu tre & bục nhảy (223.24ms)
✔ P2-11: Đêm 3 có 7 đèn đúng tọa độ, 3 tầng độ cao & dốc (245.2ms)
✔ P2-16: headless 21.600 tick ≤ 30 s (369.1606ms)
```
