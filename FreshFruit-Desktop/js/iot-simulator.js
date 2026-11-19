/* FreshFruit · iot-simulator.js — sensores simulados, modelo de maturação (Q10 + etileno) e gráficos canvas em tempo real.
   Valores em ppm são ilustrativos: calibre com sensor real antes de produção. */
const FRUITS = {
  Banana: { color: "#F6E05E", base: 120, k: .60, p0: 5, q10: 2.0 },   // base: horas até maturação total a 20 °C
  "Maçã": { color: "#FF6B5E", base: 400, k: .40, p0: 3, q10: 2.0 },
  Tomate: { color: "#9ADB74", base: 200, k: .35, p0: 2, q10: 2.2 }
};
const lots = [
  { id: "l1", fruit: "Banana", variety: "Nanica",   kg: 40, price: 6, rip: 62, temp: 28 },
  { id: "l2", fruit: "Maçã",   variety: "Fuji",     kg: 60, price: 8, rip: 40, temp: 22 },
  { id: "l3", fruit: "Tomate", variety: "Italiano", kg: 35, price: 7, rip: 55, temp: 24 }
];
const TICK_MS = 1000, SIM_H = 0.25, N = 60;          // 1 s real = 15 min simulados; 60 pontos no gráfico
const hist = {}, ppmHist = {};
let paused = false, lastTick = performance.now(), spiking = {}, prevStatus = {}, openLot = null;
const noise = s => (Math.random() + Math.random() + Math.random() - 1.5) * s;
const rate = (l, f = FRUITS[l.fruit]) => f.q10 ** ((l.t - 20) / 10) * (1 + l.ppm / 60);

const remKg = l => Math.max(0, l.kg - store.get("ff_dispatch", []).reduce((a, r) => r.lot === l.id ? a + r.kg : a, 0));   // estoque que sobrou após vendas e doações
function read(l, dt) {
  const f = FRUITS[l.fruit];
  const boost = spiking[l.id] > 0 ? (spiking[l.id]--, 25 + noise(6)) : 0;
  l.ppm = Math.max(0, +(f.p0 + l.rip * f.k + noise(2) + boost).toFixed(1));
  l.t = +(l.temp + noise(.4)).toFixed(1);
  l.hum = Math.round(70 + noise(3));
  const r = rate(l);
  if (dt && l.rip < 100) l.rip = Math.min(100, l.rip + 100 * dt * r / f.base);
  l.hours = (100 - l.rip) / 100 * f.base / r;
  l.status = l.hours <= 24 ? "critical" : l.hours <= 72 ? "warn" : "ok";
  l.discount = l.hours <= 12 ? 50 : l.hours <= 24 ? 40 : l.hours <= 48 ? 25 : 10;
  (ppmHist[l.id] ||= []).push(l.ppm); if (ppmHist[l.id].length > N) ppmHist[l.id].shift();
}

/* ---------- UI: cards ---------- */
function buildCards() {
  $("#fruits").innerHTML = lots.map(l => { const f = FRUITS[l.fruit]; return `
  <article class="card fruit-card" data-id="${l.id}" style="--c:${f.color}" tabindex="0" role="button" aria-label="Detalhes do lote de ${l.fruit}">
    <div class="fc-head"><span class="fico">${ic("leaf",24)}</span><div><h3>${l.fruit} ${l.variety}</h3><small><span data-k="kg">${remKg(l)}</span> kg · R$ ${l.price}/kg</small></div><span class="badge" data-k="badge"></span></div>
    <div class="ppm"><span data-k="ppm">0</span><small>ppm C₂H₄</small></div>
    <canvas class="spark" data-k="spark" height="46"></canvas>
    <div class="fc-stats"><span>${ic("thermo",15)} <b data-k="t"></b> °C</span><span>${ic("drop",15)} <b data-k="hum"></b>%</span><span>${ic("clock",15)} <b data-k="h"></b></span></div>
    <div class="bar" data-tip="Maturação do lote"><i data-k="bar"></i></div>
  </article>`; }).join("");
  $("#legend").innerHTML = lots.map(l => `<span style="--c:${FRUITS[l.fruit].color}"><i></i>${l.fruit}</span>`).join("");
  document.querySelectorAll(".fruit-card").forEach(c => {
    c.addEventListener("mousemove", e => { const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      c.style.setProperty("--ry", (x - .5) * 8 + "deg"); c.style.setProperty("--rx", (.5 - y) * 6 + "deg"); });
    c.addEventListener("mouseleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    c.addEventListener("click", () => openModal(c.dataset.id));
    c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(c.dataset.id); } });
  });
}
function setTxt(el, v) { if (el.textContent !== String(v)) { el.textContent = v; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } }
function updateCards() {
  lots.forEach(l => {
    const c = $(`[data-id="${l.id}"]`), g = k => c.querySelector(`[data-k="${k}"]`);
    setTxt(g("ppm"), l.ppm.toFixed(1)); g("t").textContent = l.t; g("hum").textContent = l.hum; g("h").textContent = fmtH(l.hours);
    g("bar").style.width = l.rip + "%"; g("kg").textContent = remKg(l);
    const b = g("badge"); b.className = "badge " + l.status; b.textContent = LBL[l.status];
    line(g("spark"), [ppmHist[l.id]], [FRUITS[l.fruit].color], { pad: 4, fill: false, w: 2 });
    if (prevStatus[l.id] && prevStatus[l.id] !== l.status) log(`${l.fruit}: ${LBL[prevStatus[l.id]]} → <b class="${l.status}">${LBL[l.status]}</b>`);
    prevStatus[l.id] = l.status;
  });
  $("#shelf-list").innerHTML = lots.map(l => `<div class="row" style="--c:${FRUITS[l.fruit].color}"><span>${l.fruit}</span><div class="bar"><i style="width:${Math.min(100, l.hours / 1.2)}%"></i></div><b class="${l.status}">${fmtH(l.hours)}</b></div>`).join("");
  if (openLot) updateModal();
}
function log(msg) { const d = document.createElement("div"); d.innerHTML = `<time>${new Date().toLocaleTimeString("pt-BR")}</time><span>${msg}</span>`; $("#log").prepend(d); while ($("#log").children.length > 30) $("#log").lastChild.remove(); }

/* ---------- canvas ---------- */
function setup(cv) { const d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight || +cv.getAttribute("height");
  if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; } const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h); return { x, w, h }; }
function smooth(x, pts) { x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const m = (pts[i - 1][0] + pts[i][0]) / 2; x.bezierCurveTo(m, pts[i - 1][1], m, pts[i][1], pts[i][0], pts[i][1]); } }
function line(cv, series, colors, o = {}) {
  const { x, w, h } = setup(cv), pad = o.pad ?? 24, all = series.flat(), lo = o.lo ?? Math.min(...all) - 2, hi = o.hi ?? Math.max(...all) + 4;
  const off = o.scroll ? Math.min(1, (performance.now() - lastTick) / TICK_MS) : 0;
  if (o.grid) { x.strokeStyle = "#2E2E36"; x.fillStyle = "#9A9AA6"; x.font = "600 11px Nunito, sans-serif"; for (let i = 0; i <= 4; i++) { const y = pad + (h - 2 * pad) * i / 4; x.beginPath(); x.moveTo(36, y); x.lineTo(w, y); x.stroke(); x.fillText(Math.round(hi - (hi - lo) * i / 4), 0, y + 4); } }
  series.forEach((s, k) => {
    const step = (w - (o.grid ? 36 : 0)) / (N - 1), x0 = o.grid ? 36 : 0;
    const pts = s.map((v, i) => [x0 + (i + (s.length >= N ? -off : 0)) * step + (N - s.length) * step, h - pad - (v - lo) / (hi - lo) * (h - 2 * pad)]);
    if (pts.length < 2) return;
    x.lineJoin = x.lineCap = "round"; if (o.grid) { x.beginPath(); smooth(x, pts); x.lineTo(pts[pts.length - 1][0], h - pad); x.lineTo(pts[0][0], h - pad); x.closePath(); const g = x.createLinearGradient(0, pad, 0, h - pad); g.addColorStop(0, colors[k] + "30"); g.addColorStop(1, colors[k] + "00"); x.fillStyle = g; x.fill(); }
    x.beginPath(); smooth(x, pts); x.strokeStyle = colors[k]; x.lineWidth = o.w || 2.5; x.shadowColor = colors[k]; x.shadowBlur = o.grid ? 14 : 6; x.stroke(); x.shadowBlur = 0;
    if (o.grid) { const [px, py] = pts[pts.length - 1], t = performance.now() / 500 + k;   // pulso no ponto atual
      x.beginPath(); x.arc(px, py, 4, 0, 7); x.fillStyle = colors[k]; x.fill();
      x.beginPath(); x.arc(px, py, 6 + (Math.sin(t) + 1) * 5, 0, 7); x.strokeStyle = colors[k] + "55"; x.lineWidth = 2; x.stroke(); }
  });
}
function shelfChart() {   // curva de maturação projetada (%) pelas próximas 120 h, com a taxa atual
  const cv = $("#shelf"), { x, w, h } = setup(cv), p = 28;
  x.strokeStyle = "#2E2E36"; x.fillStyle = "#9A9AA6"; x.font = "600 11px Nunito, sans-serif";
  [0, 24, 48, 72, 96, 120].forEach(t => { const px = p + t / 120 * (w - p - 8); x.beginPath(); x.moveTo(px, 6); x.lineTo(px, h - 20); x.stroke(); x.fillText(t + "h", px - 8, h - 5); });
  x.fillStyle = "#FF6B5E18"; x.fillRect(p, 6, 24 / 120 * (w - p - 8) * 0 + (w - p - 8), 0);
  lots.forEach(l => { const f = FRUITS[l.fruit], r = rate(l), pts = [];
    for (let t = 0; t <= 120; t += 4) pts.push([p + t / 120 * (w - p - 8), 6 + (1 - Math.min(100, l.rip + 100 * t * r / f.base) / 100) * (h - 26)]);
    x.beginPath(); smooth(x, pts); x.strokeStyle = f.color; x.lineWidth = 2.5; x.shadowColor = f.color; x.shadowBlur = 8; x.stroke(); x.shadowBlur = 0; });
  x.fillStyle = "#9A9AA6"; x.fillText("100%", 0, 14); x.fillText("0%", 6, h - 22);
}
function frame() { const cv = $("#wave"), w = cv.clientWidth;
  if (w && (!paused || !frame.once || frame.w !== w)) { line(cv, lots.map(l => ppmHist[l.id]), lots.map(l => FRUITS[l.fruit].color), { grid: 1, scroll: !paused, lo: 0, hi: 90 }); frame.once = 1; frame.w = w; }
  requestAnimationFrame(frame); }

/* ---------- modal ---------- */
let modalKey = "";
function updateModal() {   // atualiza só os números; não recria botões, então o clique nunca se perde
  const l = lots.find(z => z.id === openLot); if (!l) return; if (modalKey !== l.status + l.discount) return fillModal(openLot);
  const set = (k, v) => { const e = $(`[data-m="${k}"]`); if (e) e.textContent = v; };
  set("ppm", l.ppm.toFixed(1) + " ppm"); set("t", l.t + " °C"); set("h", fmtH(l.hours)); set("rip", l.rip.toFixed(0)); set("kg", remKg(l));
}
function fillModal(id) {
  const l = lots.find(z => z.id === id), f = FRUITS[l.fruit], _k = (modalKey = l.status + l.discount), act = l.status === "critical" ? `Vender com ${l.discount}% off ou doar hoje` : l.status === "warn" ? `Desconto sugerido de ${l.discount}% nas próximas horas` : "Manter em ambiente ventilado e longe de frutas maduras";
  $("#modal-body").style.setProperty("--c", f.color);
  $("#modal-body").innerHTML = `<button class="close" aria-label="Fechar" onclick="closeModal()">×</button>
  <div class="m-grid"><div class="ripple-wrap"><i></i><i></i><i></i><span>${ic("leaf",44)}</span></div>
  <div><h2>${l.fruit} ${l.variety}</h2><p class="muted"><span data-m="kg">${remKg(l)}</span> kg · R$ ${l.price}/kg · <span data-m="rip">${l.rip.toFixed(0)}</span>% maturada</p><span class="badge ${l.status}" style="margin-top:.6rem">${LBL[l.status]}</span></div></div>
  <div class="m-metrics"><div><small>Etileno</small><b data-m="ppm">${l.ppm.toFixed(1)} ppm</b></div><div><small>Temperatura</small><b data-m="t">${l.t} °C</b></div><div><small>Vida útil</small><b data-m="h">${fmtH(l.hours)}</b></div></div>
  <p><b>Ação recomendada:</b> ${act}.</p>
  <div class="m-actions"><a class="btn btn-primary" onclick="closeModal()" href="#/connection?lote=${l.id}">${ic("pin",16)} Ofertar na vizinhança</a><button class="btn btn-ghost" onclick="closeModal()">Fechar</button></div>`;
}
function openModal(id) { openLot = id; fillModal(id); $("#modal").classList.add("open"); document.body.classList.add("lock"); $("#modal").setAttribute("aria-hidden", "false"); $("#modal .close")?.focus(); }
function closeModal() { openLot = null; $("#modal").classList.remove("open"); document.body.classList.remove("lock"); $("#modal").setAttribute("aria-hidden", "true"); }
$("#modal").addEventListener("click", e => e.target.id === "modal" && closeModal());
addEventListener("keydown", e => e.key === "Escape" && closeModal());

/* ---------- controles e laço principal ---------- */
$("#pause").onclick = e => { paused = !paused; const b = e.currentTarget; b.innerHTML = paused ? ic("play",16) + " Retomar" : ic("pause",16) + " Pausar"; b.dataset.tip = paused ? "Retomar simulação" : "Pausar simulação"; b.setAttribute("aria-pressed", paused);
  $(".side-foot").innerHTML = '<span class="live-dot"></span>' + (paused ? "Simulação pausada" : "3 sensores online"); log(paused ? "Simulação pausada" : "Simulação retomada"); if (!paused) lastTick = performance.now(); };
$("#spike").onclick = () => { const l = lots[Math.floor(Math.random() * lots.length)]; spiking[l.id] = 8; log(`Pico de etileno injetado em ${l.fruit}`); toast(paused ? `Pico agendado em ${l.fruit}. Retome a simulação para vê-lo` : `Pico de etileno em ${l.fruit}`, "⚡"); };
function publish() {   // compartilha o estado dos lotes com a aba Conexão (localStorage)
  store.set("ff_lots", lots.map(l => ({ id: l.id, fruit: l.fruit, variety: l.variety, kg: l.kg, price: l.price, hours: +l.hours.toFixed(1), status: l.status, discount: l.discount })));
}
function tick() { if (paused) return; lots.forEach(l => read(l, SIM_H)); lastTick = performance.now(); updateCards(); shelfChart(); publish(); }
lots.forEach(l => { for (let i = 0; i < N; i++) read(l, 0); });
buildCards(); publish(); lots.forEach(l => prevStatus[l.id] = l.status); updateCards(); shelfChart();
log("Sensores conectados. Monitorando 3 lotes.");
setInterval(() => $("#clock").textContent = new Date().toLocaleTimeString("pt-BR"), 1000);
setInterval(tick, TICK_MS); requestAnimationFrame(frame); addEventListener("resize", shelfChart);
