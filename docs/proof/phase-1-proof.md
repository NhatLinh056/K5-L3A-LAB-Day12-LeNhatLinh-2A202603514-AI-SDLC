# Bằng chứng kiểm chứng - Phase 1 (Proof)

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Mốc:** Tag `phase-1` (Contract v1.0)

---

## 1. Bảng đối chiếu Yêu cầu - Bằng chứng (Traceability Matrix)

| Mã AC | Yêu cầu kiểm chứng | Phương pháp kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|:---:|
| **AC1** | File `game.contract.json` hợp lệ, tuning khớp config | Test `ac01-contract.test.js` | Đối chiếu trường contract_version, team, tuning | **ĐẠT** |
| **AC2** | Chạy headless 100 tick ra JSONL đúng định dạng | Test `ac02-smoke.test.js` | Thoát mã 0, snapshot tick 0 đầu tiên, end cuối cùng | **ĐẠT** |
| **AC3** | Tính tất định: Cùng seed sinh output giống hệt | Test `ac03-determinism.test.js` | Chạy 2 lần cùng seed 42, so khớp 100% dòng | **ĐẠT** |
| **AC4** | Bắt lỗi format input (tick giảm dần) | Test `ac04-bad-inputs.test.js` | Thoát mã 2 (EXIT_FORMAT) | **ĐẠT** |
| **AC5** | Di chuyển về phía +Z tốc độ 6 m/s | Test `ac05-move-forward.test.js` | Sau 60 tick (1s) Mây ở tọa độ [0, 0, 6] | **ĐẠT** |
| **AC6** | Di chuyển với góc quay cam_yaw_deg: 90 | Test `ac06-move-yaw90.test.js` | Mây di chuyển sang trục +X [6, 0, 0] | **ĐẠT** |
| **AC7** | Tự động nhặt đom đóm trong bán kính 1m | Test `ac07-pickup.test.js` | Phát sự kiện `mote_picked`, carried tăng | **ĐẠT** |
| **AC8** | Nạp đủ 10 đom đóm thì thắp đèn | Test `ac08-deposit.test.js` | Phát sự kiện `deposit` và `lantern_lit` | **ĐẠT** |
| **AC9** | Tỏa Sáng choáng Bóng Mực, có hồi chiêu | Test `ac09-pulse-cooldown.test.js` | Pulse lần 1 choáng 120 tick, lần 2 bị chặn bởi cd | **ĐẠT** |
| **AC10** | Chạm Bóng Mực mất lửa, rơi đom đóm, bất tử | Test `ac10-hit-invuln.test.js` | Mất 1 lửa, bất tử 90 tick, recoil 2m | **ĐẠT** |
| **AC11** | Hết Ngọn Lửa thì thua ngay | Test `ac11-no-flames.test.js` | Phát sự kiện `game_over` với reason `no_flames` | **ĐẠT** |
| **AC12** | Hết giờ thì thua | Test `ac12-dawn.test.js` | Hết 300s thua với reason `dawn` | **ĐẠT** |
| **AC13** | Thắp đủ 5 đèn thì thắng | Test `ac13-win.test.js` | Thắp L5 phát sự kiện `game_over` `won` | **ĐẠT** |
| **AC14** | Vùng an toàn 6m chặn Bóng Mực | Test `ac14-safe-zone.test.js` | Bóng Mực bị chặn ở khoảng cách 6m | **ĐẠT** |

## 2. Kết quả chạy test mẫu
```text
✔ AC1: game.contract.json hợp lệ và tuning khớp config (2.2961ms)
✔ AC2: headless 100 tick (124.5738ms)
✔ AC3: cùng seed 42 cho output giống hệt (344.9736ms)
✔ AC4: tick giảm dần trong inputs → exit 2 (126.4431ms)
✔ AC5: đi thẳng +Z 60 tick (121.0117ms)
✔ AC6: đi với cam_yaw_deg 90 (123.9273ms)
✔ AC7: nhặt đom đóm ở tick 1 (109.4295ms)
✔ AC8: nạp 10 đom đóm thắp L1 (119.4148ms)
✔ AC9: pulse lần 1 choáng S1, lần 2 bị cooldown chặn (124.4846ms)
✔ AC10: bị chạm rồi bất tử 1.5 s (134.6498ms)
✔ AC11: hết lửa thì thua (131.229ms)
✔ AC12: hết giờ thì thua (dawn) ở tick 60 (118.2469ms)
✔ AC13: thắp L5 không kết thúc Đêm (135.6675ms)
✔ AC14: Bóng Mực không vào vùng an toàn của đèn đã thắp (143.4081ms)
```
