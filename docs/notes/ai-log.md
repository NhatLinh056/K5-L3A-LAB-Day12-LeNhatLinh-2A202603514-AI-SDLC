# Nhật ký sử dụng AI (AI Usage Log)

**Dự án:** Đảo Đèn Lồng (Day 12 AI SDLC)  
**Học viên:** Lê Nhật Linh (2A202603514)

---

## 1. Công cụ & Model sử dụng
- **Công cụ chính:** Antigravity CLI / AI Assistant
- **Model:** Gemini 3.8 Flash (High), Gemini 3.5 Pro
- **Vai trò:** Lập kế hoạch phân rã SDLC theo từng Phase, đối chiếu hợp đồng dữ liệu Test Contract v1.0 -> v1.3, hỗ trợ kiểm chứng tính tất định và tự động hóa bộ test.

## 2. Ước tính Token & Chi phí
| Giai đoạn | Context Input | Output | Ước tính chi phí | Ghi chú tối ưu |
|---|---:|---:|---:|---|
| Phase 1: Khung PRD-0 & Core Engine | ~85,000 | ~14,000 | ~$0.15 | Dùng spec gọn, tách biệt logic headless |
| Phase 2: Ticket-02 Ba hòn đảo & Dash | ~110,000 | ~18,000 | ~$0.20 | Tái sử dụng helper test, chạy regression |
| Phase 3: Change Request Đèn cạn dầu | ~95,000 | ~16,000 | ~$0.18 | Dùng ADR làm rõ breaking changes |
| Phase 4: Phát hành v1.0.0 & Benchmark | ~130,000 | ~22,000 | ~$0.25 | Đo đạc tự động bằng script, không lặp lại context |
| **Tổng cộng** | **~420,000** | **~70,000** | **~$0.78** | Tiết kiệm ~65% so với prompt không kế hoạch |

## 3. Các lần AI sai & Cách phát hiện, điều chỉnh
1. **Sai lệch thứ tự tick khi xử lý va chạm:**
   - *Triệu chứng:* Ở Phase 2, Bóng Mực gây hit trước khi Gió Lạc cướp đồ trong cùng 1 tick.
   - *Cách phát hiện:* Bài test `p2-06-hit.test.js` phát hiện thứ tự sai so với mục 12 bước của Ticket-02.
   - *Cách xử lý harness:* Cập nhật thứ tự ưu tiên rõ ràng trong `AGENTS.md` mục 2 và hàm `step()` trong `src/logic/sim.js`.
2. **Sai số số thực khi trừ nhiên liệu:**
   - *Triệu chứng:* Khi trừ 1.0/60 fuel mỗi tick bằng phép trừ `float`, sau 1000 tick phát sinh sai số `0.00000000000004`.
   - *Cách phát hiện:* Test `p3-02-fuel-decay.test.js` so sánh snapshot JSONL bị lệch.
   - *Cách xử lý:* Quyết định kiến trúc trong `docs/adr/0001` chuyển đổi toàn bộ fuel nội bộ sang số nguyên đơn vị `1/60` (fuel 100 = 6000 đơn vị).
3. **Quên cập nhật test cũ khi luật cốt lõi thay đổi:**
   - *Triệu chứng:* Sau khi thêm luật bình minh ở Phase 3, test Phase 1 `ac13-win` bị fail vì vẫn kỳ vọng thắng ngay khi thắp 5 đèn.
   - *Cách xử lý:* Thực hiện quy trình review breaking change, cập nhật lại kỳ vọng của test có ghi chú `[v1.2]` và lý do thay thế.
