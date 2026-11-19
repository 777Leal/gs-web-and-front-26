/* FreshFruit · geofencing.js — geocerca (haversine), mapa em canvas, motor de decisão e aba Conexão. Coordenadas e pessoas fictícias. */
const Geo = {
  center: { lat: -23.564, lng: -46.693 }, R: 3.4, radius: 1.5, fruit: null, hover: null, consumers: [], ngos: [],
  km(a, b) { const t = Math.PI / 180, dy = (b.lat - a.lat) * t, dx = (b.lng - a.lng) * t, h = Math.sin(dy / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dx / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); },
  dist(p) { return this.km(this.center, p); },
  inside(p, r = this.radius) { return this.dist(p) <= r; },
  at(d, a) { const t = a * Math.PI / 180; return { lat: this.center.lat + d * Math.sin(t) / 111.32, lng: this.center.lng + d * Math.cos(t) / (111.32 * Math.cos(this.center.lat * Math.PI / 180)) }; },
  init() {
    let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647, F = Object.keys(COLORS);
    this.consumers = ["Marina", "Carlos", "Beatriz", "João", "Larissa", "Paulo", "Renata", "Diego", "Camila", "Felipe", "Aline", "Rafael", "Sofia", "Bruno", "Helena", "Tiago"]
      .map(n => { const c = { name: n, ...this.at(.3 + r() * 2.9, r() * 360), h: r() * 360, likes: [F[Math.floor(r() * 3)]] }; if (r() < .4) c.likes.push(F[Math.floor(r() * 3)]); c.in = this.inside(c); return c; });
    this.ngos = [["Banco de Alimentos Vila", .9, 40, 300], ["Cozinha Solidária Esperança", 1.8, 200, 150], ["Abrigo Casa Aurora", 2.6, 310, 90]].map(([name, d, a, cap]) => ({ name, cap, ...this.at(d, a) }));
  },
  step(cb) {   // caminhada aleatória; dispara callback quando alguém cruza a geocerca
    this.consumers.forEach(c => {
      c.h += (Math.random() - .5) * 70; if (this.dist(c) > 3.1) c.h += 180; const t = c.h * Math.PI / 180;
      c.lat += .07 * Math.sin(t) / 111.32; c.lng += .07 * Math.cos(t) / (111.32 * Math.cos(this.center.lat * Math.PI / 180));
      const now = this.inside(c); if (now !== c.in) { c.in = now; cb(c, now); }
    });
  },
  decide(l, rem, r, force) {
    const cons = this.consumers.filter(c => this.inside(c, r) && c.likes.includes(l.fruit)).sort((a, b) => this.dist(a) - this.dist(b)), ngos = this.ngos.filter(n => this.inside(n, r)).sort((a, b) => this.dist(a) - this.dist(b));
    const disc = l.hours <= 12 ? 50 : l.hours <= 24 ? 40 : l.hours <= 48 ? 25 : 10, price = +(l.price * (1 - disc / 100)).toFixed(2), kgSale = Math.min(rem, cons.length * 3);
    let a = force || (l.hours > 72 ? "hold" : l.hours <= 12 || (l.hours <= 24 && cons.length < 3) ? "donate" : "sale"), why;
    if ((a === "donate" && !ngos.length) || (a === "sale" && !cons.length)) a = "expand";
    why = { hold: `Faltam ${fmtH(l.hours)} para o ponto crítico. Nenhuma ação necessária agora.`,
      sale: `${cons.length} consumidores com interesse em ${l.fruit} dentro de ${num(r, 1)} km. Um desconto de ${disc}% antecipa a venda antes da janela crítica.`,
      donate: l.hours <= 12 ? `Restam ${fmtH(l.hours)}: pouco tempo para vender. Doar evita a perda total do lote.` : `Poucos compradores no raio (${cons.length}). Doar preserva o lote e o impacto social.`,
      expand: `Nenhum destinatário elegível dentro de ${num(r, 1)} km. Aumente o raio da geocerca.` }[a];
    return { a, cons, ngos, disc, price, kgSale, kgDon: rem, revenue: +(kgSale * price).toFixed(2), why };
  },
  draw(cv) {
    const d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
    const x = cv.getContext("2d"), S = Math.min(w, h) / 2 - 10, cx = w / 2, cy = h / 2, kx = Math.cos(this.center.lat * Math.PI / 180);
    this.px = p => [cx + (p.lng - this.center.lng) * 111.32 * kx / this.R * S, cy - (p.lat - this.center.lat) * 111.32 / this.R * S];
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    x.save(); x.translate(cx, cy); x.rotate(.32); x.strokeStyle = "#1F1F26";
    for (let i = -16; i <= 16; i++) { x.lineWidth = i % 5 ? 1 : 3; x.beginPath(); x.moveTo(i * 42, -w); x.lineTo(i * 42, w); x.moveTo(-w, i * 42); x.lineTo(w, i * 42); x.stroke(); } x.restore();
    x.font = "600 11px Nunito, sans-serif"; x.setLineDash([4, 5]); [1, 2, 3].forEach(k => { x.strokeStyle = "#2E2E36"; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, S * k / this.R, 0, 7); x.stroke(); x.fillStyle = "#6B6B76"; x.fillText(k + " km", cx + 4, cy - S * k / this.R - 4); }); x.setLineDash([]);
    const rr = S * this.radius / this.R, k = (performance.now() % 2400) / 2400;
    x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fillStyle = "rgba(246,224,94,.07)"; x.fill(); x.strokeStyle = "#F6E05E"; x.lineWidth = 1.5; x.stroke();
    x.beginPath(); x.arc(cx, cy, rr * k, 0, 7); x.strokeStyle = `rgba(246,224,94,${.45 * (1 - k)})`; x.stroke();
    this.consumers.forEach(c => { const [px, py] = this.px(c), hot = c.in && c.likes.includes(this.fruit); x.beginPath(); x.arc(px, py, hot ? 6.5 : 4.5, 0, 7);
      x.fillStyle = c.in ? "#F6E05E" : "#555560"; if (hot) { x.shadowColor = "#F6E05E"; x.shadowBlur = 12; } x.fill(); x.shadowBlur = 0; if (c === this.hover) { x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke(); } });
    this.ngos.forEach(n => { const [px, py] = this.px(n); x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillStyle = "#9ADB74"; x.fillRect(-6, -6, 12, 12); if (n === this.hover) { x.strokeStyle = "#fff"; x.strokeRect(-6, -6, 12, 12); } x.restore(); });
    x.fillStyle = "#F6E05E"; x.beginPath(); x.roundRect(cx - 9, cy - 9, 18, 18, 4); x.fill(); x.fillStyle = "#121214"; x.fillRect(cx - 5, cy - 1, 10, 2); x.fillRect(cx - 5, cy - 5, 10, 2);
  },
  pick(ev, cv) {
    const b = cv.getBoundingClientRect(), mx = ev.clientX - b.left, my = ev.clientY - b.top; let best = null, bd = ev.pointerType === "touch" ? 26 : 14;
    [...this.consumers, ...this.ngos].forEach(p => { const [px, py] = this.px(p), dd = Math.hypot(px - mx, py - my); if (dd < bd) { bd = dd; best = p; } }); return best;
  }
};

/* ---------- controlador da aba Conexão ---------- */
(() => {
  Geo.init();
  let lots = store.get("ff_lots", SEED_LOTS), sel = parseRoute().params.get("lote") || lots[0].id; if (!lots.some(l => l.id === sel)) sel = lots[0].id; const notified = new Set(), cv = $("#map"), tip = $("#maptip");
  const disp = () => store.get("ff_dispatch", []), lot = () => lots.find(l => l.id === sel) || lots[0], rem = l => Math.max(0, l.kg - disp().filter(r => r.lot === l.id).reduce((a, r) => a + r.kg, 0));
  const glog = m => { const d = document.createElement("div"); d.innerHTML = `<time>${new Date().toLocaleTimeString("pt-BR")}</time><span>${m}</span>`; $("#glog").prepend(d); while ($("#glog").children.length > 30) $("#glog").lastChild.remove(); };
  const fillLots = () => { const s = $("#lot"), o = [...s.options], txt = l => `${l.fruit} ${l.variety} · ${fmtH(l.hours)} restantes`;
    if (o.length === lots.length && o.every((x, i) => x.value === lots[i].id)) { o.forEach((x, i) => x.textContent = txt(lots[i])); s.value = sel; return; }   // atualiza o texto sem fechar a lista aberta
    s.innerHTML = lots.map(l => `<option value="${l.id}"${l.id === sel ? " selected" : ""}>${txt(l)}</option>`).join(""); };
  function render() {
    const l = lot(), r = Geo.radius, R = rem(l), D = Geo.decide(l, R, r); Geo.fruit = l.fruit;
    const inC = Geo.consumers.filter(c => c.in), inN = Geo.ngos.filter(n => Geo.inside(n));
    $("#rv").textContent = num(r, 1) + " km"; $("#gf-count").textContent = `${pl(inC.length, "consumidor", "consumidores")} · ${pl(inN.length, "ONG")} no raio`;
    const cls = { hold: "ok", sale: "warn", donate: "ok", expand: "critical" }[D.a], ttl = { hold: "Manter à venda", sale: `Vender com ${D.disc}% de desconto`, donate: "Doar para ONG", expand: "Ampliar o raio" }[D.a];
    const M = D.a === "donate" ? [["ONG mais próxima", D.ngos[0]?.name ?? "—"], ["Quantidade", num(D.kgDon) + " kg"], ["Distância", D.ngos[0] ? num(Geo.dist(D.ngos[0]), 1) + " km" : "—"]]
      : [["Compradores", D.cons.length], ["Preço por kg", `${brl(l.price)} → ${brl(D.price)}`], ["Receita estimada", brl(D.revenue)]];
    const decHTML = `<div class="panel-h"><h2>Decisão sugerida</h2><span class="badge ${cls}">${LBL[l.status]}</span></div>
      <p class="d-title ${cls}">${ttl}</p><p class="muted">${D.why}</p><div class="m-metrics">${M.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>
      <p class="muted">Restam ${num(R)} kg de ${l.fruit} ${l.variety} neste lote.</p>
      <div class="d-actions"><button class="btn ${D.a === "sale" ? "btn-primary" : "btn-ghost"}" id="b-sale" ${!D.cons.length || !R ? "disabled" : ""}>${ic("tag", 16)} Enviar oferta</button><button class="btn ${D.a === "donate" ? "btn-primary" : "btn-ghost"}" id="b-don" ${!D.ngos.length || !R ? "disabled" : ""}>${ic("heart", 16)} Doar para ONG</button></div>`;
    setHTML($("#decision"), decHTML);
    const rows = [...inC.map(c => [c, "Consumidor"]), ...inN.map(n => [n, "ONG"])].sort((a, b) => Geo.dist(a[0]) - Geo.dist(b[0]));
    const recHTML = `<thead><tr><th>Destinatário</th><th>Perfil</th><th class="r">Distância</th><th>Situação</th></tr></thead><tbody>${rows.map(([p, t]) => `<tr><td>${p.name}</td><td>${t}</td><td class="r">${num(Geo.dist(p), 2)} km</td><td>${notified.has(p.name) ? '<span class="badge ok">Notificado</span>' : t === "ONG" ? "Aceita doação" : p.likes.includes(l.fruit) ? `<b class="warn">Quer ${l.fruit}</b>` : '<span class="muted">Sem interesse</span>'}</td></tr>`).join("") || '<tr><td colspan="4" class="muted">Ninguém dentro do raio. Aumente a geocerca.</td></tr>'}</tbody>`; setHTML($("#recip"), recHTML);
  }
  let negs = store.get("ff_negs", []).map(n => n.st === "wait" ? { ...n, st: "open" } : n);   // negociações sobrevivem ao recarregar a página
  const NEGO_FLOOR = .45;   // piso: 45% do preço cheio
  function send(type) {
    const l = lot(), D = Geo.decide(l, rem(l), Geo.radius, type === "sale" ? "sale" : "donate");
    if (type === "sale") {
      if (!D.cons.length) return;
      const t = D.cons.slice(0, 5); t.forEach(c => notified.add(c.name));
      glog(`Oferta de ${l.fruit} a ${brl(D.price)}/kg enviada a ${pl(t.length, "consumidor", "consumidores")}`); toast(`Oferta enviada a ${pl(t.length, "consumidor", "consumidores")}`);
      t.forEach((c, i) => setTimeout(() => {
        const bid = Math.random() < .4 ? D.price : +(D.price * (.72 + Math.random() * .22)).toFixed(2);
        negs.push({ id: Date.now() + i, who: c.name, lot: l.id, fruit: l.fruit, kg: 1 + Math.floor(Math.random() * 4), offer: D.price, bid, floor: +(l.price * NEGO_FLOOR).toFixed(2), st: "open" });
        glog(`${c.name} ${bid >= D.price ? "aceitou a oferta" : "fez contraproposta de " + brl(bid) + "/kg"}`); renderNegs();
      }, 1200 + i * 1100 + Math.random() * 1500));
      render(); return;
    }
    if (!D.ngos.length) return;
    const rec = { id: Date.now(), ts: Date.now(), lot: l.id, fruit: l.fruit, kg: D.kgDon, type, discount: 0, revenue: 0, to: D.ngos[0].name };
    store.set("ff_dispatch", [...disp(), rec]); notified.add(D.ngos[0].name);
    glog(`Coleta de ${num(rec.kg)} kg de ${l.fruit} solicitada à ${D.ngos[0].name}`); toast(`Doação solicitada à ${D.ngos[0].name}`, "💛"); render();
  }
  function answer(id, ok) {
    const n = negs.find(z => z.id === id), l = lots.find(z => z.id === n.lot), kg = Math.min(n.kg, rem(l));
    if (ok && kg) { store.set("ff_dispatch", [...disp(), { id: Date.now(), ts: Date.now(), lot: l.id, fruit: l.fruit, kg, type: "sale", discount: Math.max(0, Math.round((1 - n.bid / l.price) * 100)), revenue: +(kg * n.bid).toFixed(2), to: n.who }]); n.st = "won"; toast(`Venda fechada com ${n.who}: ${brl(kg * n.bid)}`); glog(`Venda fechada com ${n.who}: ${kg} kg a ${brl(n.bid)}/kg`); }
    else { n.st = "lost"; glog(ok ? "Lote sem estoque suficiente" : `Proposta de ${n.who} recusada`); }
    renderNegs(); render();
  }
  function counter(id) {   // contraproposta no ponto médio; o consumidor aceita em ~60% dos casos
    const n = negs.find(z => z.id === id), mid = +((n.bid + n.offer) / 2).toFixed(2); n.st = "wait"; n.countered = true; renderNegs();
    setTimeout(() => { const ok = Math.random() < .6; if (ok) n.bid = mid; n.st = "open"; glog(`${n.who} ${ok ? "aceitou a contraproposta de " + brl(mid) : "manteve " + brl(n.bid)}/kg`); renderNegs(); }, 1500);
  }
  function renderNegs(skipSave) {
    if (!skipSave) store.set("ff_negs", negs);
    $("#nego-count").textContent = `${negs.filter(n => n.st === "open" || n.st === "wait").length} em aberto`;
    $("#nego").innerHTML = negs.length ? negs.slice().reverse().map(n => `<div class="nego-row"><div><b>${n.who}</b><small>${n.kg} kg de ${n.fruit} · oferta ${brl(n.offer)}/kg · piso ${brl(n.floor)}</small></div>
      <div class="nego-bid ${n.bid >= n.offer ? "ok" : "warn"}">${brl(n.bid)}<small>/kg</small></div><div class="nego-act">${n.st === "open" ? `<button class="btn btn-primary" data-a="y" data-id="${n.id}" ${n.bid < n.floor ? "disabled" : ""}>Aceitar</button>${n.countered ? "" : `<button class="btn btn-ghost" data-a="c" data-id="${n.id}">Contrapor</button>`}<button class="btn btn-ghost" data-a="n" data-id="${n.id}">Recusar</button>` : n.st === "wait" ? '<span class="muted">Aguardando resposta</span>' : n.st === "won" ? '<span class="badge ok">Fechado</span>' : '<span class="badge critical">Recusado</span>'}</div></div>`).join("")
      : '<p class="muted">Envie uma oferta para abrir negociações com os consumidores do raio. Propostas abaixo do piso não podem ser aceitas.</p>';
  }
  $("#decision").onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return; if (b.id === "b-sale") send("sale"); else if (b.id === "b-don") send("donation"); };
  $("#nego").onclick = e => { const b = e.target.closest("button"); if (!b) return; const id = +b.dataset.id; ({ y: () => answer(id, true), n: () => answer(id, false), c: () => counter(id) })[b.dataset.a](); };
  $("#lot").onchange = e => { sel = e.target.value; notified.clear(); render(); };
  $("#radius").oninput = e => { Geo.radius = +e.target.value; Geo.consumers.forEach(c => c.in = Geo.inside(c)); render(); };   // recalcula quem está dentro na hora, sem esperar o próximo passo da simulação
  cv.onpointermove = cv.onpointerdown = e => { const p = Geo.pick(e, cv); Geo.hover = p; tip.hidden = !p; if (p) { const b = cv.getBoundingClientRect(); tip.style.left = Math.max(4, Math.min(e.clientX - b.left + 14, b.width - 180)) + "px"; tip.style.top = e.clientY - b.top + 14 + "px";
    tip.innerHTML = `<b>${p.name}</b><br>${num(Geo.dist(p), 2)} km da banca<br>${p.likes ? "Interesse: " + p.likes.join(", ") : "Capacidade: " + p.cap + " kg/dia"}`; } };
  cv.onpointerleave = e => { if (e.pointerType === "mouse") { Geo.hover = null; tip.hidden = true; } };
  addEventListener("storage", e => { if (e.key === "ff_lots") { lots = store.get("ff_lots", SEED_LOTS); fillLots(); render(); } else if (e.key === "ff_dispatch") render(); else if (e.key === "ff_negs") { negs = store.get("ff_negs", []); renderNegs(true); } });
  addEventListener("route", e => { const id = e.detail.params.get("lote"); if (e.detail.page === "connection" && id && id !== sel && lots.some(l => l.id === id)) { sel = id; notified.clear(); fillLots(); render(); } });
  fillLots(); render(); renderNegs(); glog("Geocerca ativa. Monitorando entradas e saídas.");
  setInterval(() => { Geo.step((c, inn) => glog(`${c.name} ${inn ? "entrou na" : "saiu da"} geocerca (${num(Geo.dist(c), 2)} km)${inn && c.likes.includes(lot().fruit) ? ` · interesse em ${lot().fruit}` : ""}`)); render(); }, 1500);
  (function f() { if (cv.clientWidth > 0) Geo.draw(cv); requestAnimationFrame(f); })();
})();
