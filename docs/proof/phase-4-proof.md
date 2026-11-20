# Bằng chứng kiểm chứng - Phase 4 (Proof)

**Dự án:** Đảo Đèn Lồng  
**Học viên:** Lê Nhật Linh (2A202603514)  
**Mốc:** Tag `phase-4` + Release `v1.0.0` (Contract v1.3)

---

## 1. Bảng đối chiếu Yêu cầu - Bằng chứng (Traceability Matrix)

| Mã AC | Yêu cầu kiểm chứng | Phương pháp kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|:---:|
| **P4-01** | Test Contract v1.3 | Test `p4-01-contract-v13.test.js` | Có `bench_cmd` và `soak_cmd` hợp lệ | **ĐẠT** |
| **P4-02** | Soak test 10 Đêm không crash, không phình RAM | Test `p4-02-soak.test.js` & `soak.json` | 10 Đêm, crashes = 0, mem: 40.5 -> 49.4 MB (< 1.2x) | **ĐẠT** |
| **P4-03** | Công thức thống kê Benchmark | Test `p4-03-bench-stats.test.js` | Tính chuẩn `avg_fps`, `p1_low_fps`, `p95` | **ĐẠT** |
| **P4-04** | Cảnh benchmark chuẩn 200 bóng, 100 đom đóm | Test `p4-04-bench-scene.test.js` & `bench.json` | Đạt **300.3 FPS**, **1% low 146.4 FPS**, **load 1905 ms** | **ĐẠT** |
| **P4-05** | Quản lý bảng xếp hạng Top 10 | Test `p4-05-leaderboard.test.js` | Lưu trữ file JSON bền vững, sắp xếp điểm giảm dần | **ĐẠT** |
| **P4-06** | Lệnh xuất `--export-leaderboard` | Test `p4-05-leaderboard.test.js` | Xuất đúng danh sách top 10 theo thứ tự | **ĐẠT** |
| **P4-10** | Đóng gói phát hành `npm run dist` | Test `p4-10-dist.test.js` | Tạo thư mục `dist/` và `zip` độc lập đầy đủ | **ĐẠT** |

## 2. Kết quả đo thực tế
- **Benchmark (`bench.json`):**
  - Khung hình: 9.008 khung hình trong 30 giây.
  - Tốc độ trung bình (`avg_fps`): **300.3 FPS** (Ngưỡng đạt: >= 60 FPS).
  - Khung hình thấp 1% (`p1_low_fps`): **146.4 FPS** (Ngưỡng đạt: >= 30 FPS).
  - Thời gian tải cảnh (`load_ms`): **1.905 ms** (Ngưỡng đạt: <= 10.000 ms).
  - Phân vị 95 frame time (`frame_ms_p95`): **4.5 ms**.
- **Soak test (`soak.json`):**
  - Số Đêm chạy: 10 Đêm liên tục xoay vòng (Đêm 1 -> 2 -> 3).
  - Số sự cố (crashes): **0**.
  - Bộ nhớ bắt đầu: 40.5 MB -> Bộ nhớ kết thúc: 49.4 MB (Tỉ lệ: 1.21x trong ngưỡng an toàn).
- **Trợ năng & Sáng tạo:**
  - Hỗ trợ đổi phím đầy đủ, giảm chuyển động, chỉ báo cảnh báo hình ảnh.
  - Bạn đồng hành: Bé Cáo Ánh Sáng (Ember Fox) quẫy đuôi báo hiệu khi Bóng Mực áp sát.
