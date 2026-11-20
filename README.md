# Đảo Đèn Lồng (Lantern Island) — 3D Game AI SDLC

> **Video Demo:** [Xem video demo phát hành v1.0.0](https://github.com/NhatLinh056/K5-L3A-LAB-Day12-LeNhatLinh-2A202603514-AI-SDLC/releases/tag/v1.0.0) · [demo.mp4](docs/demo/demo.mp4)  
> **Tác giả:** Lê Nhật Linh (MSSV: 2A202603514) · Lớp: K5-L3A (AI Thực chiến - VinUni-AI20k)  
> **Bản phát hành:** [Release v1.0.0](https://github.com/NhatLinh056/K5-L3A-LAB-Day12-LeNhatLinh-2A202603514-AI-SDLC/releases/tag/v1.0.0) · Tags: `phase-1`, `phase-2`, `phase-3`, `phase-4`

---

## 1. Giới thiệu dự án
**Đảo Đèn Lồng** là tựa game 3D góc nhìn thứ ba mang phong cách cổ tích ấm áp. Người chơi vào vai **Mây** — người giữ đèn nhỏ tuổi của hòn đảo giữa biển mây. Đêm xuống, sương đen bao phủ nuốt trọn ánh sáng. Mây phải gom những đốm sáng đom đóm để thắp lại và giữ dầu cho các Đèn Lồng Lớn tới lúc bình minh, đồng thời né tránh những sinh vật Bóng Mực ẩn nấp trong sương đêm.

Dự án được xây dựng và hoàn thiện trọn vẹn qua 4 phase theo đúng chuẩn quy trình **AI-Assisted Software Development Life Cycle (AI SDLC)**.

---

## 2. Cài đặt & Chạy game (Tối đa 3 lệnh)

Clone repo và khởi động game ngay lập tức:

```bash
git clone https://github.com/NhatLinh056/K5-L3A-LAB-Day12-LeNhatLinh-2A202603514-AI-SDLC.git
cd K5-L3A-LAB-Day12-LeNhatLinh-2A202603514-AI-SDLC
npm install && npm start
```
Game sẽ mở tại địa chỉ `http://localhost:8080/` (hoặc cổng kế tiếp nếu cổng 8080 đang bận).

---

## 3. Điều khiển (Controls)

| Phím mặc định | Hành động | Mô tả |
|---|---|---|
| `W`, `A`, `S`, `D` | Di chuyển | Tốc độ 6.0 m/s; điều khiển linh hoạt trên không |
| `Space` | Nhảy | Vận tốc 7.0 m/s, trọng lực -20 m/s² |
| `Shift` | Lướt (Dash) | Lướt 14 m/s trong 0.2s, hồi chiêu 1.5s, giữ nguyên độ cao |
| `E` | Tương tác / Nạp dầu | Nạp đom đóm vào đèn chưa sáng hoặc châm dầu đèn đang sáng |
| `F` / Chuột phải | Tỏa Sáng (Pulse) | Tốn 3 đom đóm, bán kính 5m, choáng 2s và đẩy lùi Bóng Mực |
| `P` / `Esc` | Tạm dừng (Pause) | Đóng băng mô phỏng, mở menu tạm dừng |

*(Hỗ trợ tùy biến đổi phím đầy đủ trong phần Cài đặt của game).*

---

## 4. Chế độ Headless & Test Contract

Tuân thủ nghiêm ngặt **Test Contract v1.3** (`game.contract.json`). Chế độ headless chạy độc lập, 60 tick/s, không phụ thuộc GPU/DOM, hoàn thành 21.600 tick chỉ trong **0.37 giây**.

### Chạy toàn bộ test suites (70/70 tests pass):
```bash
npm test
```

### Chạy chế độ headless:
```bash
node src/headless.js --seed 42 --night 1 --ticks 600 --out out.jsonl
```

### Chạy kiểm thử độ bền (Soak test - 10 Đêm liên tục):
```bash
npm run soak
# Hoặc: node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json
```
*Kết quả:* 10 Đêm chạy liên tục, crashes = 0, bộ nhớ ổn định (40.5 MB -> 49.4 MB).

### Chạy đo hiệu năng (Benchmark mode):
```bash
npm run bench
# Hoặc: node tools/bench.js --seed 42 --duration 30 --out bench.json
```
*Kết quả thực tế đo đạc trên máy:*
- **FPS trung bình (`avg_fps`):** **300.3 FPS** (Ngưỡng đạt: >= 60 FPS)
- **1% Low FPS (`p1_low_fps`):** **146.4 FPS** (Ngưỡng đạt: >= 30 FPS)
- **Thời gian tải cảnh (`load_ms`):** **1.905 ms** (Ngưỡng đạt: <= 10.000 ms)

### Xuất dữ liệu Bảng xếp hạng:
```bash
node tools/serve.js --export-leaderboard out.json
```

---

## 5. Sáng tạo của tôi (Creative Features - Rubric F)

Bên cạnh các yêu cầu lõi bắt buộc, dự án mang đậm dấu ấn riêng với các tính năng sáng tạo:
1. **Bạn đồng hành: Bé Cáo Ánh Sáng (Hỏa Hồ - Ember Fox):**
   - Một bé cáo nhỏ màu cam rực rỡ với chiếc đuôi bồng bềnh phát ra ánh sáng lung linh (PointLight dịu ấm).
   - Bé Cáo luôn trung thành chạy theo sau Mây trên khắp hòn đảo.
   - **Cơ chế cảnh báo sớm:** Khi có Bóng Mực áp sát trong phạm vi 8m, Bé Cáo sẽ quẫy đuôi nhanh gấp đôi và phát ra luồng sáng ấm nhấp nháy cảnh báo nguy hiểm cho người chơi.
2. **Âm thanh ngũ cung thư giãn:**
   - Sử dụng Web Audio API tổng hợp âm thanh dạng procedural (sóng sin, frequency modulation), ngân vang tiếng chuông gió mộc mạc khi thắp đèn mà không cần tải file âm thanh nặng.
3. **Tính cô lập & an toàn tuyệt đối:**
   - Toàn bộ thực thể sáng tạo (Bé Cáo, hiệu ứng hạt sương) nằm hoàn toàn ở tầng hiển thị `src/render/` và **tự động tắt khi chạy headless**, đảm bảo đầu ra Test Contract JSONL trùng khớp 100% và tất định tuyệt đối.

---

## 6. Cấu trúc thư mục dự án

```text
├── README.md                      # Hướng dẫn chính
├── game.contract.json             # Test Contract v1.3
├── CHANGELOG.md                   # Nhật ký thay đổi qua 4 phase
├── CREDITS.md                     # Bản quyền & nguồn tài sản
├── LICENSE                        # Giấy phép MIT
├── AGENTS.md                      # Hướng dẫn dành cho AI Agent
├── package.json                   # Cấu hình dự án & scripts
├── bench.json                     # Kết quả đo Benchmark thực tế
├── soak.json                      # Kết quả đo Soak test thực tế
├── index.html                     # Giao diện web 3D
├── src/
│   ├── headless.js                # CLI runner không giao diện
│   ├── bench-stats.js             # Công thức tính thống kê FPS
│   ├── leaderboard.js             # Quản lý Top 10 bảng xếp hạng
│   ├── soak.js                    # Bộ kiểm tra độ ổn định 10 đêm
│   ├── logic/                     # Tầng mô phỏng logic thuần (60 tick/s)
│   │   ├── sim.js, level.js, levels.js, config.js, rng.js, input.js
│   └── render/                    # Tầng đồ họa 3D Three.js
│       ├── main.js, scene.js, hud.js, input.js, leaderboard-ui.js
├── tools/
│   ├── serve.js                   # Web server tĩnh + API BXH
│   ├── bench.js                   # Trình chạy benchmark Playwright
│   └── dist.js                    # Đóng gói zip bản phát hành
├── tests/                         # 70 kịch bản kiểm thử tự động
├── scenarios/                     # Fixtures đầu vào và kịch bản chuẩn
└── docs/
    ├── requirements/              # Yêu cầu PRD-0 và Ticket-02, 03, 04
    ├── spec/                      # Đặc tả kỹ thuật từng phase
    ├── adr/                       # Bản ghi quyết định kiến trúc
    ├── proof/                     # Bằng chứng kiểm chứng từng phase
    └── notes/                     # Báo cáo retro & nhật ký AI
```
