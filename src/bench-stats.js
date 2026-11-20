// Công thức số đo benchmark (TICKET-04 mục 1). Dùng chung cho tools/bench.js và test.
// dts: thời gian từng khung hình (ms) trong khoảng đo.
//   frames       = N
//   avg_fps      = 1000 × N / Σ dt_i
//   p1_low_fps   = 1000 / trung bình của k giá trị dt lớn nhất, k = max(1, ceil(0.01 × N))
//   frame_ms_p95 = phân vị 95 của dt, theo nearest-rank: sorted_asc[ceil(0.95 × N) − 1]
export function computeStats(dts) {
  if (!Array.isArray(dts) || dts.length === 0) throw new Error('computeStats: cần ít nhất 1 khung hình');
  const N = dts.length;
  const sum = dts.reduce((a, b) => a + b, 0);
  const asc = [...dts].sort((a, b) => a - b);
  const k = Math.max(1, Math.ceil(0.01 * N));
  const worst = asc.slice(N - k);
  const worstMean = worst.reduce((a, b) => a + b, 0) / k;
  return {
    frames: N,
    avg_fps: (1000 * N) / sum,
    p1_low_fps: 1000 / worstMean,
    frame_ms_p95: asc[Math.ceil(0.95 * N) - 1],
  };
}

export const round1 = (v) => Math.round(v * 10) / 10;
