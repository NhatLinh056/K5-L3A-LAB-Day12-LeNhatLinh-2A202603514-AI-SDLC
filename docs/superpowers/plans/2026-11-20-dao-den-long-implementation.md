# Implementation Plan: Đảo Đèn Lồng (Day 12 AI SDLC)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh game 3D "Đảo Đèn Lồng" theo đúng quy trình AI SDLC qua 4 phase, đáp ứng trọn vẹn Test Contract (chế độ headless độc lập, benchmark, soak test), giao diện web 3D Three.js đầy đủ tính năng & sáng tạo, bộ test tự động toàn diện, hệ thống tài liệu chuẩn mực (spec, ADR, retro, proof, credits, changelog) và gắn tag Git đầy đủ từ `phase-1` đến `phase-4` cùng Release `v1.0.0`.

**Architecture:** 
- Tách biệt hoàn toàn tầng logic mô phỏng (`src/logic/`) với tầng hiển thị đồ họa (`src/render/` & `index.html`).
- Tầng logic chạy thuần 60 tick/s, không phụ thuộc DOM/canvas/GPU, tất định (deterministic với PRNG Mulberry32), xử lý vật lý XZ/Y, máy trạng thái thực thể, hệ thống sự kiện và snapshot JSONL theo Test Contract v1.0 -> v1.3.
- Tầng hiển thị sử dụng Three.js dựng thế giới 3D cổ tích ấm áp (đảo đêm, biển mây, Mây đội nón lá gắn đèn lồng, đom đóm phát sáng, Bóng Mực tím đen trong sương, và tính năng sáng tạo độc đáo: "Bé Cáo Ánh Sáng" Ember Fox làm bạn đồng hành).
- Bộ công cụ CLI độc lập: `src/headless.js` (chạy test contract), `tools/bench.js` (đo FPS, frame time p95, RAM), `src/soak.js` (chạy 10 đêm liên tục kiểm tra ổn định/leak RAM), `src/leaderboard.js` (quản lý và export BXH).

**Tech Stack:** Node.js (>=18, ESM), Three.js (v0.187.0), Native Node Test Runner (`node --test`), Playwright (chạy headless visual benchmark khi cần), HTML5/CSS3/Web Audio API.

**Spec:** `docs/requirements/PRD-0.md`, `docs/requirements/TICKET-02.md`, `docs/requirements/TICKET-03.md`, `docs/requirements/TICKET-04.md`.

## Global Constraints
- Node.js ESM (`"type": "module"`).
- Test Contract: file `game.contract.json` ở thư mục gốc, cập nhật đúng phiên bản qua từng phase (v1.0 -> v1.1 -> v1.2 -> v1.3).
- Chế độ headless chạy độc lập bằng lệnh `node src/headless.js ...`, trả về JSONL đúng chuẩn, exit 0 khi xong, exit 2 khi sai định dạng.
- Tính tất định: cùng seed, cùng scenario, cùng inputs phải cho output snapshot/event giống hệt nhau.
- Tốc độ logic: 60 ticks/s cố định.
- Chạy được trên macOS/Linux/Windows không cần GPU cho headless test.
- Không commit API key, token, file `.env`.
- Lưu giữ nguyên vẹn harness AI (`AGENTS.md`, skills) và lịch sử git cam kết nhỏ gọn qua từng phase.

## Review Focus
1. **Determinism across runs:** Cùng seed + scenario + inputs sinh ra snapshot JSONL trùng khớp 100%.
2. **Strict tick order:** Tuân thủ chuẩn thứ tự 12 bước trong 1 tick mô phỏng theo Ticket-02/Ticket-03.
3. **Safe radius boundary behavior:** Đèn sáng có bán kính an toàn 6m chặn Bóng Mực; khi đèn vừa thắp đẩy bóng mực ra mép trong 30 ticks không gây sát thương; khi fuel < 30 đèn mất vùng an toàn và bóng mực chuyển sang drain.
4. **Input timeline interpolation:** Mỗi frame inputs chỉ cập nhật thuộc tính có mặt; các thuộc tính vắng mặt giữ nguyên giá trị trước đó; các tick tăng dần nghiêm ngặt.
5. **Night duration & Win condition migration:** Phase 1 (thắp hết đèn thắng, Đêm 1 300s); Phase 2 (3 Đêm 300s/330s/360s); Phase 3 đổi thành Đèn cạn dầu (1 fuel/s), không thắng sớm, Đêm 240s/270s/300s, thắng khi bình minh còn sống và lit >= 60%.

---

## Tasks

### Task 1: Thiết lập cấu trúc dự án & Scaffolding Phase 1 (Contract v1.0)
**Files:**
- Create: `package.json`
- Create: `game.contract.json` (v1.0)
- Create: `AGENTS.md`
- Create: `.agents/skills/verify-contract/SKILL.md`
- Create: `docs/spec/phase-1.md`
- Create: `src/logic/rng.js`
- Create: `src/logic/config.js`
- Create: `src/logic/levels.js`
- Create: `src/logic/validate.js`
- Create: `src/logic/input.js`
- Create: `src/logic/level.js`
- Create: `src/logic/sim.js`
- Create: `src/logic/index.js`
- Create: `src/headless.js`
- Create: `tests/helpers.js`
- Create: `tests/ac01-contract.test.js`
- Create: `tests/ac02-smoke.test.js`
- Create: `tests/ac03-determinism.test.js`
- Create: `tests/ac04-bad-inputs.test.js`
- Create: `tests/ac05-move-forward.test.js`
- Create: `tests/ac06-move-yaw90.test.js`
- Create: `tests/ac07-pickup.test.js`
- Create: `tests/ac08-deposit.test.js`
- Create: `tests/ac09-pulse-cooldown.test.js`
- Create: `tests/ac10-hit-invuln.test.js`
- Create: `tests/ac11-no-flames.test.js`
- Create: `tests/ac12-dawn.test.js`
- Create: `tests/ac13-win.test.js`
- Create: `tests/ac14-safe-zone.test.js`
- Create: `scenarios/` (ac01..ac14 scenarios)

- [ ] **Step 1: Khởi tạo package.json và cài đặt dependencies**
- [ ] **Step 2: Viết core logic engine cho Phase 1 (PRD-0, Đêm 1 Đảo Bến)**
- [ ] **Step 3: Viết headless runner `src/headless.js` theo Test Contract v1.0**
- [ ] **Step 4: Viết và chạy toàn bộ bộ test Phase 1 (`node --test tests/ac*.test.js`)**
- [ ] **Step 5: Ghi lại bằng chứng `docs/proof/phase-1-proof.md` và `docs/notes/phase-1-eval.md`**
- [ ] **Step 6: Git commit và tạo tag `phase-1`**

### Task 2: Triển khai Phase 2 — Ticket-02 "Ba hòn đảo" (Contract v1.1)
**Files:**
- Create: `docs/spec/phase-2.md`
- Modify: `game.contract.json` (nâng cấp lên v1.1 với các trường dash, night 2 & 3)
- Modify: `src/logic/config.js`
- Modify: `src/logic/levels.js` (Thêm Đảo Cau và Đảo Chuông, cầu tre, bục nhảy, dốc)
- Modify: `src/logic/sim.js` (Thêm Dash, Gió Lạc/Drifters, Bùa Gió/Charms, Gió mạnh, Pause, snapshot v1.1)
- Modify: `src/headless.js`
- Create: `tests/p2-01-contract-v11.test.js` đến `tests/p2-16-performance.test.js`
- Create: `docs/proof/phase-2-proof.md`
- Create: `docs/notes/phase-2-eval.md`

- [ ] **Step 1: Viết spec Phase 2 và cập nhật tuning v1.1 trong game.contract.json**
- [ ] **Step 2: Cập nhật địa hình Đêm 2, Đêm 3 và cơ chế bục nhảy trong levels.js**
- [ ] **Step 3: Cài đặt Dash, Gió Lạc, Bùa Gió, Pause và snapshot format v1.1 trong sim.js**
- [ ] **Step 4: Chạy test hồi quy Phase 1 và test mới Phase 2 (`node --test tests/`)**
- [ ] **Step 5: Ghi nhận bằng chứng kiểm chứng Phase 2 và nhật ký AI**
- [ ] **Step 6: Git commit và tạo tag `phase-2`**

### Task 3: Triển khai Phase 3 — Ticket-03 "Đèn cạn dầu" (Contract v1.2)
**Files:**
- Create: `docs/spec/phase-3.md`
- Create: `docs/adr/0001-fuel-decay-and-win-condition.md`
- Modify: `game.contract.json` (nâng cấp lên v1.2)
- Modify: `src/logic/config.js` (Thêm fuel_max, fuel_decay, relight_cost, drain, v.v.)
- Modify: `src/logic/sim.js` (Hao dầu 1/s, châm dầu, thắp lại 5 đom đóm, bóng mực drain, dawn survive win condition, capacity scale, new score)
- Modify: `src/headless.js`
- Update: Các test Phase 1-2 bị thay thế (đánh dấu lý do và cập nhật kỳ vọng mới)
- Create: `tests/p3-01-contract-v12.test.js` đến `tests/p3-12-old-tests-updated.test.js`
- Create: `docs/proof/phase-3-proof.md`
- Create: `docs/notes/phase-3-eval.md`

- [ ] **Step 1: Viết Spec Phase 3 và ADR-0001 phân tích thay đổi luật cốt lõi**
- [ ] **Step 2: Nâng cấp game.contract.json lên v1.2**
- [ ] **Step 3: Cài đặt cơ chế hao dầu, hút dầu, châm dầu, thắp lại, và luật thắng dawn_survived**
- [ ] **Step 4: Cập nhật các test cũ bị ảnh hưởng kèm ghi chú lý do rõ ràng**
- [ ] **Step 5: Chạy toàn bộ bộ test `node --test tests/`**
- [ ] **Step 6: Ghi nhận bằng chứng Phase 3, commit và tạo tag `phase-3`**

### Task 4: Triển khai Phase 4 — Ticket-04 "Phát hành v1.0.0" (Contract v1.3)
**Files:**
- Create: `docs/spec/phase-4.md`
- Modify: `game.contract.json` (nâng cấp lên v1.3, thêm `bench_cmd`, `soak_cmd`)
- Create: `src/bench-stats.js`
- Create: `tools/bench.js`
- Create: `src/soak.js`
- Create: `src/leaderboard.js`
- Create: `tools/serve.js`
- Create: `index.html` (Giao diện game 3D Three.js hoàn chỉnh, HUD, Sound, Colorblind, Accessibility, Bạn đồng hành Hỏa Hồ - Ember Fox)
- Create: `src/render/game-3d.js`
- Create: `tests/p4-01-contract-v13.test.js` đến `tests/p4-10-dist.test.js`
- Create: `docs/proof/phase-4-proof.md`
- Create: `docs/notes/retro.md`
- Create: `CHANGELOG.md`
- Create: `CREDITS.md`
- Create: `LICENSE`
- Modify: `README.md` (Hướng dẫn tối đa 3 lệnh, mục "Sáng tạo của tôi", link video demo)

- [ ] **Step 1: Viết spec Phase 4 và nâng cấp game.contract.json lên v1.3**
- [ ] **Step 2: Cài đặt công cụ benchmark `tools/bench.js` và soak test `src/soak.js`**
- [ ] **Step 3: Cài đặt quản lý bảng xếp hạng `src/leaderboard.js`**
- [ ] **Step 4: Xây dựng giao diện web 3D Three.js hoàn chỉnh với tính năng sáng tạo Hỏa Hồ**
- [ ] **Step 5: Chạy benchmark sinh `bench.json` và chạy soak sinh `soak.json`**
- [ ] **Step 6: Chạy toàn bộ bộ test toàn dự án và kiểm tra độ ổn định**
- [ ] **Step 7: Hoàn thiện tài liệu tổng kết `retro.md`, `CHANGELOG.md`, `CREDITS.md`, `LICENSE`, `README.md`**
- [ ] **Step 8: Git commit, tạo tag `phase-4` và chuẩn bị Release `v1.0.0`**

### Task 5: Hướng dẫn người dùng nghiệm thu, quay video demo & nộp bài
- [ ] **Step 1: Hướng dẫn người dùng kiểm tra repo cục bộ (`npm install`, `npm test`, `npm start`)**
- [ ] **Step 2: Hướng dẫn quay video demo < 5 phút**
- [ ] **Step 3: Hướng dẫn push tags và tạo GitHub Release `v1.0.0`**
- [ ] **Step 4: Hướng dẫn nộp link lên hệ thống LMS**
