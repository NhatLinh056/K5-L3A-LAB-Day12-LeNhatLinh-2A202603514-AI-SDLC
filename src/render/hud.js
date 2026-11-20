// HUD và màn hình thắng/thua (DOM). Chỉ đọc trạng thái logic.

const REASON = {
  dawn_survived: 'Bình minh đã tới và đảo vẫn đủ sáng. Mây đã giữ được ánh đèn!',
  all_lit: 'Mây đã thắp sáng cả 5 Đèn Lồng Lớn. Đảo Bến lại ấm áp!',
  dawn: 'Trời đã sáng mà đảo vẫn chưa thắp đủ đèn.',
  no_flames: 'Mây đã hết lửa vì Bóng Mực.',
};

export function createHud(cfg) {
  const $ = (id) => document.getElementById(id);
  const el = {
    carried: $('hud-carried'),
    flames: $('hud-flames'),
    lanterns: $('hud-lanterns'),
    time: $('hud-time'),
    score: $('hud-score'),
    pulseText: $('hud-pulse-text'),
    pulseBar: $('hud-pulse-bar'),
    hint: $('hud-hint'),
    end: $('end'),
    endTitle: $('end-title'),
    endReason: $('end-reason'),
    endScore: $('end-score'),
  };
  const last = {};
  const set = (key, node, text) => {
    if (last[key] !== text) {
      node.textContent = text;
      last[key] = text;
    }
  };

  function hint(s) {
    const p = s.player;
    let best = null;
    let bestD = Infinity;
    for (const l of s.lanterns) {
      if (l.lit) continue;
      const d = Math.hypot(p.x - l.x, p.z - l.z);
      if (d <= cfg.interact_radius && d < bestD) {
        best = l;
        bestD = d;
      }
    }
    if (best) {
      return p.carried > 0
        ? `E: nạp đèn ${best.id} (${best.deposited}/${cfg.lantern_cost})`
        : `Đèn ${best.id} cần đom đóm (${best.deposited}/${cfg.lantern_cost})`;
    }
    if (p.carried >= cfg.carry_capacity) return 'Túi đã đầy – mang đom đóm về Đèn Lồng!';
    return '';
  }

  return {
    update(s) {
      const p = s.player;
      set('carried', el.carried, `${p.carried}/${cfg.carry_capacity}`);
      set('flames', el.flames, '●'.repeat(p.flames) + '○'.repeat(Math.max(0, cfg.flames - p.flames)));
      const lit = s.lanterns.filter((l) => l.lit).length;
      set('lanterns', el.lanterns, `${lit}/${s.lanterns.length}`);
      const secs = Math.ceil(s.time_left_ticks / 60);
      set('time', el.time, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`);
      set('score', el.score, String(s.score));

      let text;
      let frac;
      if (p.pulse_cd > 0) {
        text = `${(p.pulse_cd / 60).toFixed(1)} s`;
        frac = 1 - p.pulse_cd / cfg.pulse_cooldown_ticks;
      } else if (p.carried < cfg.pulse_cost) {
        text = `cần ${cfg.pulse_cost} đom đóm`;
        frac = 1;
      } else {
        text = 'Sẵn sàng (F)';
        frac = 1;
      }
      set('pulse', el.pulseText, text);
      el.pulseBar.style.width = `${Math.round(frac * 100)}%`;
      el.pulseBar.classList.toggle('ready', p.pulse_cd === 0 && p.carried >= cfg.pulse_cost);
      set('hint', el.hint, hint(s));
    },
    showEnd(result, score) {
      el.endTitle.textContent = result.result === 'won' ? 'Đảo đã sáng!' : 'Đêm chưa qua…';
      el.endReason.textContent = REASON[result.reason] ?? '';
      el.endScore.textContent = `Điểm: ${score}`;
      el.end.classList.toggle('won', result.result === 'won');
      el.end.hidden = false;
    },
    hideEnd() {
      el.end.hidden = true;
    },
  };
}
