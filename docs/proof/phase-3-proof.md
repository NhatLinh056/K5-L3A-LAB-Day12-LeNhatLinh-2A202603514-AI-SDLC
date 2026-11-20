# Bằng chứng kiểm chứng - Phase 3 (Proof)

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Mốc:** Tag `phase-3` (Contract v1.2)

---

## 1. Bảng đối chiếu Yêu cầu - Bằng chứng (Traceability Matrix)

| Mã AC | Yêu cầu kiểm chứng | Phương pháp kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|:---:|
| **P3-01** | Test Contract v1.2 & Snapshot | Test `p3-01-contract-v12.test.js` | Thêm các khóa nhiên liệu và snapshot có `fuel`, `ever_lit` | **ĐẠT** |
| **P3-02** | Dầu tự hao 1.0 đơn vị/giây | Test `p3-02-fuel-decay.test.js` | Sau 60 tick (1s), fuel giảm chính xác 1.0 đơn vị | **ĐẠT** |
| **P3-03** | Hết dầu thì tắt, nhớ `ever_lit` | Test `p3-03-lantern-out.test.js` | Khi fuel <= 0 đèn tắt, phát `lantern_out`, `ever_lit: true` | **ĐẠT** |
| **P3-04** | Thắp lại chỉ cần 5 đom đóm | Test `p3-04-relight.test.js` | Đèn `ever_lit` chỉ cần 5 đom đóm; đèn mới cần 10 | **ĐẠT** |
| **P3-05** | Châm dầu bù đắp lượng thiếu | Test `p3-05-refuel.test.js` | Nạp `ceil((100-fuel)/10)` đom đóm, đầy dầu không nhận | **ĐẠT** |
| **P3-06** | Bóng Mực hút 5 fuel/s khi fuel < 30 | Test `p3-06-drain.test.js` | Dưới 30 mất vùng an toàn, bóng chuyển `drain` hút 5/s | **ĐẠT** |
| **P3-07** | Bóng drain chuyển chase khi Mây đến gần | Test `p3-07-drain-chase-pulse.test.js` | Mây vào 6m bóng đuổi Mây; pulse trúng drain được +15 | **ĐẠT** |
| **P3-08** | Luật thắng mới: Sống sót đến bình minh | Test `p3-08-dawn-rule.test.js` | Thắp 5 đèn không kết thúc sớm; thắng khi lit >= 60% lúc dawn | **ĐẠT** |
| **P3-09** | Hết lửa ở bình minh vẫn thua | Test `p3-09-no-flames-at-dawn.test.js` | Hết lửa đúng tick cuối thua ngay với lý do `no_flames` | **ĐẠT** |
| **P3-10** | Sức chứa tăng dần theo số lần thắp | Test `p3-10-capacity.test.js` | `capacity = 10 + 2 * lights`, tối đa 20 | **ĐẠT** |
| **P3-11** | Công thức tính điểm mới chuẩn hóa | Test `p3-11-dawn-score.test.js` | Tính đúng điểm theo bảng sự kiện và thưởng bình minh | **ĐẠT** |
| **P3-12** | Test cũ đổi theo v1.2 có ghi lý do | Test `p3-12-old-tests-updated.test.js` | Kiểm tra tất cả các test thay đổi có chú thích `[v1.2]` | **ĐẠT** |

## 2. Kết quả chạy test mẫu
```text
✔ P3-01: contract v1.2 và snapshot có trường mới (138.8802ms)
✔ P3-02: dầu hao 1/giây (152.9258ms)
✔ P3-03: hết dầu thì tắt và nhớ ever_lit (154.5134ms)
✔ P3-04: thắp lại chỉ cần 5 đom đóm (145.0167ms)
✔ P3-04: đèn chưa từng sáng vẫn cần 10 (114.2964ms)
✔ P3-05: châm dầu dùng ceil((100 − fuel)/10) đom đóm (146.2543ms)
✔ P3-05: đèn đầy dầu (fuel 100) không được chọn khi tương tác (1.477ms)
✔ P3-06: wander → tới đèn yếu → drain, dầu giảm 6/giây (146.311ms)
✔ P3-06: fuel đúng 30 vẫn còn vùng an toàn, dưới 30 thì mất (137.8001ms)
✔ P3-07: drain → chase khi Mây vào trong 6 m (125.0662ms)
✔ P3-07: Tỏa Sáng trúng con đang drain được +15 (108.7936ms)
✔ P3-08: đủ 5 đèn sáng vẫn chơi tiếp tới bình minh (122.9535ms)
✔ P3-08: bình minh với 3/5 đèn sáng → won dawn_survived (133.8036ms)
✔ P3-08: bình minh với 2/5 đèn sáng → lost dawn (99.0551ms)
✔ P3-09: hết lửa đúng tick bình minh vẫn thua no_flames (149.4735ms)
✔ P3-10: sau 2 lần thắp thành công, capacity = 14 (116.5977ms)
✔ P3-11: điểm khi thắng ở bình minh (130.4366ms)
✔ P3-12: test cũ đổi theo v1.2 có ghi lý do, không skip (70.3154ms)
```
