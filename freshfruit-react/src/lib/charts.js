import { FRUITS, N, rate } from "./sim";

/* Gráficos em canvas 2D (portados do projeto original). */

export function setup(cv) {
  const d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight || +cv.getAttribute("height");
  if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
  const x = cv.getContext("2d");
  x.setTransform(d, 0, 0, d, 0, 0);
  x.clearRect(0, 0, w, h);
  return { x, w, h };
}

function smooth(x, pts) {
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const m = (pts[i - 1][0] + pts[i][0]) / 2;
    x.bezierCurveTo(m, pts[i - 1][1], m, pts[i][1], pts[i][0], pts[i][1]);
  }
}

/** Linhas suaves. `o.scrollOffset` (0..1) desliza o gráfico entre dois ticks da simulação. */
export function line(cv, series, colors, o = {}) {
  const { x, w, h } = setup(cv), pad = o.pad ?? 24, all = series.flat();
  const lo = o.lo ?? Math.min(...all) - 2, hi = o.hi ?? Math.max(...all) + 4;
  const off = o.scrollOffset || 0;
  if (o.grid) {
    x.strokeStyle = "#2E2E36"; x.fillStyle = "#9A9AA6"; x.font = "600 11px Nunito, sans-serif";
    for (let i = 0; i <= 4; i++) {
      const y = pad + ((h - 2 * pad) * i) / 4;
      x.beginPath(); x.moveTo(36, y); x.lineTo(w, y); x.stroke();
      x.fillText(Math.round(hi - ((hi - lo) * i) / 4), 0, y + 4);
    }
  }
  series.forEach((s, k) => {
    const step = (w - (o.grid ? 36 : 0)) / (N - 1), x0 = o.grid ? 36 : 0;
    const pts = s.map((v, i) => [
      x0 + (i + (s.length >= N ? -off : 0)) * step + (N - s.length) * step,
      h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad)
    ]);
    if (pts.length < 2) return;
    x.lineJoin = x.lineCap = "round";
    if (o.grid) {
      x.beginPath(); smooth(x, pts);
      x.lineTo(pts[pts.length - 1][0], h - pad); x.lineTo(pts[0][0], h - pad); x.closePath();
      const g = x.createLinearGradient(0, pad, 0, h - pad);
      g.addColorStop(0, colors[k] + "30"); g.addColorStop(1, colors[k] + "00");
      x.fillStyle = g; x.fill();
    }
    x.beginPath(); smooth(x, pts);
    x.strokeStyle = colors[k]; x.lineWidth = o.w || 2.5; x.shadowColor = colors[k]; x.shadowBlur = o.grid ? 14 : 6;
    x.stroke(); x.shadowBlur = 0;
    if (o.grid) {   // pulso no ponto atual
      const [px, py] = pts[pts.length - 1], t = performance.now() / 500 + k;
      x.beginPath(); x.arc(px, py, 4, 0, 7); x.fillStyle = colors[k]; x.fill();
      x.beginPath(); x.arc(px, py, 6 + (Math.sin(t) + 1) * 5, 0, 7); x.strokeStyle = colors[k] + "55"; x.lineWidth = 2; x.stroke();
    }
  });
}

/** Curva de maturação projetada (%) pelas próximas 120 h, com a taxa atual de cada lote. */
export function shelfChart(cv, lots) {
  const { x, w, h } = setup(cv), p = 28;
  x.strokeStyle = "#2E2E36"; x.fillStyle = "#9A9AA6"; x.font = "600 11px Nunito, sans-serif";
  [0, 24, 48, 72, 96, 120].forEach(t => {
    const px = p + (t / 120) * (w - p - 8);
    x.beginPath(); x.moveTo(px, 6); x.lineTo(px, h - 20); x.stroke();
    x.fillText(t + "h", px - 8, h - 5);
  });
  lots.forEach(l => {
    const f = FRUITS[l.fruit], r = rate(l), pts = [];
    for (let t = 0; t <= 120; t += 4) pts.push([p + (t / 120) * (w - p - 8), 6 + (1 - Math.min(100, l.rip + (100 * t * r) / f.base) / 100) * (h - 26)]);
    x.beginPath(); smooth(x, pts);
    x.strokeStyle = f.color; x.lineWidth = 2.5; x.shadowColor = f.color; x.shadowBlur = 8; x.stroke(); x.shadowBlur = 0;
  });
  x.fillStyle = "#9A9AA6"; x.fillText("100%", 0, 14); x.fillText("0%", 6, h - 22);
}

/** Barras empilhadas (vendido/doado) dos últimos 14 dias. Retorna uma função que cancela a animação. */
export function barChart(cv, D) {
  const d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * d; cv.height = h * d;
  const x = cv.getContext("2d");
  const days = [...Array(14)].map((_, i) => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - 13 + i); return { t: +t, sale: 0, don: 0 }; });
  D.forEach(r => { const q = new Date(r.ts); q.setHours(0, 0, 0, 0); const b = days.find(z => z.t === +q); if (b) b[r.type === "sale" ? "sale" : "don"] += r.kg; });
  const max = Math.max(10, ...days.map(z => z.sale + z.don)), padL = 34, padB = 24, bw = (w - padL) / 14, t0 = performance.now();
  const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf;
  (function f(t) {
    const k = instant ? 1 : Math.min(1, (t - t0) / 800), e = 1 - (1 - k) ** 3;
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h); x.font = "600 11px Nunito, sans-serif";
    for (let i = 0; i <= 4; i++) {
      const y = 8 + ((h - padB - 8) * i) / 4;
      x.strokeStyle = "#2E2E36"; x.beginPath(); x.moveTo(padL, y); x.lineTo(w, y); x.stroke();
      x.fillStyle = "#9A9AA6"; x.fillText(Math.round(max * (1 - i / 4)), 0, y + 4);
    }
    days.forEach((z, i) => {
      const bx = padL + i * bw + bw * 0.2, bwid = bw * 0.6, ph = v => (v / max) * (h - padB - 8) * e, y0 = h - padB;
      const rr = (yy, hh, col) => { if (hh < 1) return; x.fillStyle = col; x.beginPath(); x.roundRect(bx, yy, bwid, hh, Math.min(8, hh / 2)); x.fill(); };
      rr(y0 - ph(z.sale), ph(z.sale), "#F6E05E");
      rr(y0 - ph(z.sale) - ph(z.don) - (z.sale && z.don ? 3 : 0), ph(z.don), "#9ADB74");
      x.fillStyle = "#9A9AA6"; x.fillText(new Date(z.t).getDate(), bx + bwid / 2 - 5, h - 8);
    });
    if (k < 1) raf = requestAnimationFrame(f);
  })(t0);
  return () => cancelAnimationFrame(raf);
}
