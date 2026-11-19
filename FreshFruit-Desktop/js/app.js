/* FreshFruit · app.js — base compartilhada (ícones SVG, navegação, estado entre abas, toast) + aba Impacto */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const P = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  leaf: '<path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.6-6.8"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>', pause: '<path d="M8 4v16M16 4v16"/>', play: '<path d="M6 4l14 8-14 8z"/>',
  thermo: '<path d="M14 14.8V4a2 2 0 00-4 0v10.8a4 4 0 104 0z"/>', drop: '<path d="M12 2.7S5 10 5 15a7 7 0 0014 0c0-5-7-12.3-7-12.3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', check: '<path d="M20 6L9 17l-5-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a3 3 0 00-3-1.5c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 01-3-1.5M12 6v2M12 16v2"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  wind: '<path d="M9.6 4.6A2 2 0 1111 8H2M12.6 19.4A2 2 0 1014 16H2M17.7 7.7A2.5 2.5 0 1119.5 12H2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>', trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>', store: '<path d="M3 9l1-5h16l1 5M3 9h18M3 9v11h18V9M9 20v-6h6v6"/>'
};
const ic = (n, s = 18) => `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} if (k === "ff_dispatch") setTimeout(() => sideMission()); },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const COLORS = { Banana: "#F6E05E", "Maçã": "#FF6B5E", Tomate: "#9ADB74" };
const LBL = { ok: "Estável", warn: "Atenção", critical: "Janela crítica" };
const SEED_LOTS = [   // usado quando o Dashboard ainda não publicou leituras
  { id: "l1", fruit: "Banana", variety: "Nanica", kg: 40, price: 6, hours: 20, status: "critical", discount: 40 },
  { id: "l2", fruit: "Maçã", variety: "Fuji", kg: 60, price: 8, hours: 150, status: "ok", discount: 10 },
  { id: "l3", fruit: "Tomate", variety: "Italiano", kg: 35, price: 7, hours: 60, status: "warn", discount: 10 }];
const setHTML = (el, h) => { if (el.__h !== h) { el.innerHTML = h; el.__h = h; } };   // só toca no DOM se o conteúdo mudou (evita perder cliques)
const pl = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;
const fmtH = h => { const m = Math.round(h * 60); return `${Math.floor(m / 1440)}d ${Math.floor(m % 1440 / 60)}h`; };
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), num = (v, d = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
function toast(m, e) { $(".toast")?.remove(); const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.innerHTML = (e ? '<span aria-hidden="true">' + e + "</span>" : ic("check", 16)) + m; document.body.append(t); setTimeout(() => t.remove(), 3200); }

/* ---------- navegação e ícones declarativos ---------- */
(() => {
  const NAV = [["dashboard", "Dashboard IoT", "activity"], ["connection", "Conexão hiperlocal", "pin"], ["impact", "Impacto social", "leaf"]], s = $("#sidebar");
  if (s) s.innerHTML = `<a class="brand" href="#/dashboard" aria-label="FreshFruit: ir ao Dashboard"><span class="mark"><svg viewBox="0 0 32 32" width="38" height="38" aria-hidden="true"><circle cx="16" cy="18" r="12" fill="#F6E05E"/><path d="M16 7c0-3.4 2.8-5 6.2-5 0 3.4-2.2 6-6.2 5z" fill="#9ADB74"/></svg></span>Fresh<b>Fruit</b></a><p class="tagline">Fruta que não vira lixo.</p><nav class="nav" aria-label="Seções">${NAV.map(([k, t, i]) => `<a href="#/${k}" data-nav="${k}">${ic(i)}<span>${t}</span></a>`).join("")}</nav><div class="mission"><small>Já resgatado do lixo</small><b id="side-kg">0 kg</b><span id="side-meals"></span></div><div class="side-foot"><span class="live-dot"></span>3 sensores online</div>`;
  $$("[data-ic]").forEach(e => e.insertAdjacentHTML("afterbegin", ic(e.dataset.ic, 16) + " "));
})();

/* ---------- aba Impacto ---------- */
const CO2_KG = 1.1, MEALS_KG = 2.5;   // fatores ilustrativos: substitua por dados auditados
function demoHistory() {
  let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647, F = [["Banana", 6], ["Maçã", 8], ["Tomate", 7]], N = ["Banco de Alimentos Vila", "Cozinha Solidária Esperança", "Abrigo Casa Aurora"], out = [];
  for (let d = 13; d >= 0; d--) for (let k = 0, n = 1 + Math.floor(r() * 3); k < n; k++) {
    const [fruit, price] = F[Math.floor(r() * 3)], don = r() < .4, kg = Math.round(8 + r() * 30), disc = [25, 40, 50][Math.floor(r() * 3)];
    out.push({ id: out.length + 1, ts: Date.now() - d * 864e5 - k * 3.6e6, lot: "hist", fruit, kg, type: don ? "donation" : "sale", discount: don ? 0 : disc, revenue: don ? 0 : +(kg * price * (1 - disc / 100)).toFixed(2), to: don ? N[Math.floor(r() * 3)] : `${2 + Math.floor(r() * 6)} consumidores` });
  } return out;
}
function countUp(el, v, f) { const t0 = performance.now(); (function s(t) { const k = Math.min(1, (t - t0) / 900), e = 1 - (1 - k) ** 3; el.textContent = f(v * e); if (k < 1) requestAnimationFrame(s); })(t0); }
function barChart(D) {
  const cv = $("#bars"), d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * d; cv.height = h * d;
  const x = cv.getContext("2d"), days = [...Array(14)].map((_, i) => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - 13 + i); return { t: +t, sale: 0, don: 0 }; });
  D.forEach(r => { const q = new Date(r.ts); q.setHours(0, 0, 0, 0); const b = days.find(z => z.t === +q); if (b) b[r.type === "sale" ? "sale" : "don"] += r.kg; });
  const max = Math.max(10, ...days.map(z => z.sale + z.don)), pl = 34, pb = 24, bw = (w - pl) / 14, t0 = performance.now();
  (function f(t) {
    const k = Math.min(1, (t - t0) / 800), e = 1 - (1 - k) ** 3; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h); x.font = "600 11px Nunito, sans-serif";
    for (let i = 0; i <= 4; i++) { const y = 8 + (h - pb - 8) * i / 4; x.strokeStyle = "#2E2E36"; x.beginPath(); x.moveTo(pl, y); x.lineTo(w, y); x.stroke(); x.fillStyle = "#9A9AA6"; x.fillText(Math.round(max * (1 - i / 4)), 0, y + 4); }
    days.forEach((z, i) => { const bx = pl + i * bw + bw * .2, bwid = bw * .6, ph = v => v / max * (h - pb - 8) * e, y0 = h - pb;
      const rr = (yy, hh, col) => { if (hh < 1) return; x.fillStyle = col; x.beginPath(); x.roundRect(bx, yy, bwid, hh, Math.min(8, hh / 2)); x.fill(); }; rr(y0 - ph(z.sale), ph(z.sale), "#F6E05E"); rr(y0 - ph(z.sale) - ph(z.don) - (z.sale && z.don ? 3 : 0), ph(z.don), "#9ADB74");
      x.fillStyle = "#9A9AA6"; x.fillText(new Date(z.t).getDate(), bx + bwid / 2 - 5, h - 8); });
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
function renderImpact() {
  const D = store.get("ff_dispatch", []), has = D.length > 0; $("#empty").hidden = has; $("#impact-body").hidden = !has; if (!has) return;
  const kg = D.reduce((a, r) => a + r.kg, 0), rev = D.reduce((a, r) => a + r.revenue, 0), kgD = D.filter(r => r.type === "donation").reduce((a, r) => a + r.kg, 0);
  const K = [["box", "Alimento resgatado", kg, v => num(v) + " kg"], ["coins", "Receita recuperada", rev, brl], ["wind", "CO₂ evitado (estimativa)", kg * CO2_KG, v => num(v) + " kg"], ["heart", "Porções doadas (estimativa)", kgD * MEALS_KG, v => num(v)]];
  $("#kpis").innerHTML = K.map(([i, t]) => `<article class="card kpi">${ic(i, 22)}<b>0</b><span>${t}</span></article>`).join("");
  $$("#kpis b").forEach((b, i) => countUp(b, K[i][2], K[i][3]));
  const mk = Math.floor(kg / 100) * 100, ms = $("#milestone"); ms.hidden = !mk;
  if (mk) ms.innerHTML = `<span class="mile-emoji" aria-hidden="true">🎉</span><div><h2>Passamos de ${num(mk)} kg salvos do lixo</h2><p class="muted">≈ ${num(kgD * MEALS_KG)} porções já chegaram a quem precisa.</p></div>`;
  barChart(D);
  const by = {}; D.filter(r => r.type === "donation").forEach(r => by[r.to] = (by[r.to] || 0) + r.kg); const top = Math.max(1, ...Object.values(by));
  $("#ngos").innerHTML = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([n, v]) => `<div class="ngo-row"><span>${n}</span><div class="bar"><i style="width:${v / top * 100}%;--c:var(--green)"></i></div><b>${num(v)} kg</b></div>`).join("") || '<p class="muted">Nenhuma doação registrada ainda.</p>';
  $("#tbl").innerHTML = `<thead><tr><th>Data</th><th>Lote</th><th>Decisão</th><th class="r">Quantidade</th><th class="r">Valor</th><th>Destino</th></tr></thead><tbody>${D.slice().sort((a, b) => b.ts - a.ts).slice(0, 8).map(r => `<tr><td class="c-date">${new Date(r.ts).toLocaleDateString("pt-BR")}</td><td class="c-lot">${r.fruit}</td><td class="c-type"><span class="badge ${r.type === "sale" ? "warn" : "ok"}">${r.type === "sale" ? "Venda " + r.discount + "% off" : "Doação"}</span></td><td class="r c-kg">${num(r.kg)} kg</td><td class="r c-val">${r.revenue ? brl(r.revenue) : "—"}</td><td class="c-to">${r.to}</td></tr>`).join("")}</tbody>`;
}
const LAW = [
  ["Lei nº 15.224/2025: política nacional", "Instituiu a Política Nacional de Combate à Perda e ao Desperdício de Alimentos e revogou a Lei nº 14.016/2020. O doador e o intermediário só respondem civilmente por danos se houver dolo, e a doação não configura relação de consumo."],
  ["Condições do alimento doado", "Podem ser doados alimentos in natura, preparados ou embalados dentro do prazo de validade, desde que as normas sanitárias e as propriedades nutricionais sejam mantidas."],
  ["Selo Doador de Alimentos", "Concedido pelo Poder Executivo a estabelecimentos que doam alimentos, e também a produtores rurais, cooperativas e associações de produtores. Tem validade de dois anos."],
  ["Incentivo fiscal", "A tramitação da lei incluiu incentivo fiscal para doações, mas parte desse ponto foi vetada (Veto 35/2025). Confirme a situação atual com seu contador antes de contar com o benefício."]];
const CHECKS = ["Alimento próprio para consumo e dentro da validade", "Armazenamento e transporte respeitam as normas sanitárias", "Doação gratuita, sem contrapartida ao doador", "Entrega a banco de alimentos, entidade beneficente ou beneficiário vulnerável", "Registro da doação guardado (data, destino e quantidade)"];
function renderLegal() {
  $("#law").innerHTML = LAW.map(([t, d], i) => `<details${i ? "" : " open"}><summary>${t}</summary><p>${d}${i === 0 ? ' <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15224.htm" target="_blank" rel="noopener">Ler o texto no Planalto</a>' : ""}</p></details>`).join("");
  const st = store.get("ff_check", []), paint = () => { const n = $$("#check input:checked").length, p = Math.round(n / CHECKS.length * 100); $("#cpct").textContent = p + "%"; $("#cbar").style.width = p + "%"; $("#cbar").style.setProperty("--c", "var(--green)"); };
  $("#check").innerHTML = CHECKS.map((c, i) => `<label class="chk"><input type="checkbox" data-i="${i}"${st[i] ? " checked" : ""}>${c}</label>`).join("");
  $("#check").onchange = () => { store.set("ff_check", $$("#check input").map(x => x.checked)); paint(); }; paint();
}
function exportCsv() {
  const D = store.get("ff_dispatch", []); if (!D.length) return toast("Nenhum registro para exportar");
  const rows = [["Data", "Lote", "Decisão", "Quantidade (kg)", "Valor (R$)", "Destino"], ...D.map(r => [new Date(r.ts).toLocaleDateString("pt-BR"), r.fruit, r.type === "sale" ? "Venda" : "Doação", r.kg, String(r.revenue).replace(".", ","), r.to])];
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(";")).join("\n")], { type: "text/csv" })); a.download = "registro-freshfruit.csv"; a.click(); URL.revokeObjectURL(a.href);
}
{
  $("#csv").onclick = exportCsv; renderLegal();
  $("#demo").onclick = $("#demo2").onclick = () => { if (store.get("ff_dispatch", []).length && !confirm("Isto substitui os registros atuais pelo histórico de demonstração. Continuar?")) return; store.set("ff_dispatch", demoHistory()); renderImpact(); toast("Histórico de demonstração carregado"); };
  $("#reset").onclick = () => { if (!store.get("ff_dispatch", []).length && !store.get("ff_negs", []).length) return toast("Não há dados para apagar"); if (!confirm("Apagar todo o histórico de decisões e negociações? Esta ação não pode ser desfeita.")) return; store.del("ff_dispatch"); store.del("ff_negs"); renderImpact(); sideMission(); toast("Dados apagados"); };
  addEventListener("storage", e => e.key === "ff_dispatch" && renderImpact()); addEventListener("resize", () => store.get("ff_dispatch", []).length && barChart(store.get("ff_dispatch", [])));
  renderImpact();
}

/* ---------- missão na sidebar: total resgatado ---------- */
function sideMission() {
  const k = $("#side-kg"); if (!k) return; const D = store.get("ff_dispatch", []), kg = D.reduce((a, r) => a + r.kg, 0), don = D.filter(r => r.type === "donation").reduce((a, r) => a + r.kg, 0);
  k.textContent = num(kg) + " kg"; $("#side-meals").textContent = D.length ? `≈ ${num(don * MEALS_KG)} porções doadas` : "Envie a primeira oferta ou doação.";
}
sideMission(); addEventListener("storage", e => e.key === "ff_dispatch" && sideMission());


/* ---------- roteador (hash): troca de aba sem recarregar a página ---------- */
const ROUTES = { dashboard: "Dashboard IoT", connection: "Conexão hiperlocal", impact: "Impacto social" };
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, ""), [name, q = ""] = h.split("?");
  return { page: ROUTES[name] ? name : "dashboard", params: new URLSearchParams(q) };
}
function goRoute(first) {
  const { page, params } = parseRoute();
  $$("[data-route]").forEach(m => m.hidden = m.dataset.route !== page);
  $$("[data-nav]").forEach(a => { const on = a.dataset.nav === page; a.classList.toggle("active", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
  document.body.dataset.page = page; document.title = "FreshFruit · " + ROUTES[page];
  if (typeof closeModal === "function") closeModal();
  if (!first) scrollTo({ top: 0, behavior: "instant" });
  if (page === "impact") renderImpact();
  if (page === "dashboard" && typeof shelfChart === "function") requestAnimationFrame(shelfChart);
  dispatchEvent(new CustomEvent("route", { detail: { page, params } }));
}
addEventListener("hashchange", () => goRoute());
if (!location.hash) history.replaceState(null, "", "#/dashboard");
goRoute(true);
