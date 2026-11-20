import { FRUITS, discountFor } from "./sim";
import { fmtH, num } from "./format";

/* Geocerca (haversine), mapa em canvas e motor de decisão.
   Coordenadas e pessoas fictícias. */
export const CENTER = { lat: -23.564, lng: -46.693 };
export const R = 3.4;   // raio visível do mapa (km)
const RAD = Math.PI / 180, KM_DEG = 111.32;

export function km(a, b) {
  const dy = (b.lat - a.lat) * RAD, dx = (b.lng - a.lng) * RAD;
  const h = Math.sin(dy / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dx / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
export const dist = p => km(CENTER, p);
export const inside = (p, r) => dist(p) <= r;
export const at = (d, angle) => {
  const t = angle * RAD;
  return { lat: CENTER.lat + (d * Math.sin(t)) / KM_DEG, lng: CENTER.lng + (d * Math.cos(t)) / (KM_DEG * Math.cos(CENTER.lat * RAD)) };
};

export function createWorld(radius = 1.5) {
  let s = 11;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647, F = Object.keys(FRUITS);
  const names = ["Marina", "Carlos", "Beatriz", "João", "Larissa", "Paulo", "Renata", "Diego", "Camila", "Felipe", "Aline", "Rafael", "Sofia", "Bruno", "Helena", "Tiago"];
  const consumers = names.map(n => {
    const c = { name: n, ...at(0.3 + r() * 2.9, r() * 360), h: r() * 360, likes: [F[Math.floor(r() * 3)]] };
    if (r() < 0.4) c.likes.push(F[Math.floor(r() * 3)]);
    c.in = inside(c, radius);
    return c;
  });
  const ngos = [["Banco de Alimentos Vila", 0.9, 40, 300], ["Cozinha Solidária Esperança", 1.8, 200, 150], ["Abrigo Casa Aurora", 2.6, 310, 90]]
    .map(([name, d, a, cap]) => ({ name, cap, ...at(d, a) }));
  return { consumers, ngos };
}

/** Caminhada aleatória; chama `cb(consumidor, entrou)` quando alguém cruza a geocerca. */
export function stepWorld(world, radius, cb) {
  world.consumers.forEach(c => {
    c.h += (Math.random() - 0.5) * 70;
    if (dist(c) > 3.1) c.h += 180;
    const t = c.h * RAD;
    c.lat += (0.07 * Math.sin(t)) / KM_DEG;
    c.lng += (0.07 * Math.cos(t)) / (KM_DEG * Math.cos(CENTER.lat * RAD));
    const now = inside(c, radius);
    if (now !== c.in) { c.in = now; cb(c, now); }
  });
}

export function decide(world, l, rem, r, force) {
  const byDist = (a, b) => dist(a) - dist(b);
  const cons = world.consumers.filter(c => inside(c, r) && c.likes.includes(l.fruit)).sort(byDist);
  const ngos = world.ngos.filter(n => inside(n, r)).sort(byDist);
  const disc = discountFor(l.hours), price = +(l.price * (1 - disc / 100)).toFixed(2), kgSale = Math.min(rem, cons.length * 3);
  let a = force || (l.hours > 72 ? "hold" : l.hours <= 12 || (l.hours <= 24 && cons.length < 3) ? "donate" : "sale");
  if ((a === "donate" && !ngos.length) || (a === "sale" && !cons.length)) a = "expand";
  const why = {
    hold: `Faltam ${fmtH(l.hours)} para o ponto crítico. Nenhuma ação necessária agora.`,
    sale: `${cons.length} consumidores com interesse em ${l.fruit} dentro de ${num(r, 1)} km. Um desconto de ${disc}% antecipa a venda antes da janela crítica.`,
    donate: l.hours <= 12
      ? `Restam ${fmtH(l.hours)}: pouco tempo para vender. Doar evita a perda total do lote.`
      : `Poucos compradores no raio (${cons.length}). Doar preserva o lote e o impacto social.`,
    expand: `Nenhum destinatário elegível dentro de ${num(r, 1)} km. Aumente o raio da geocerca.`
  }[a];
  return { a, cons, ngos, disc, price, kgSale, kgDon: rem, revenue: +(kgSale * price).toFixed(2), why };
}

/** Projeta lat/lng em pixels do canvas. */
export function projector(w, h) {
  const S = Math.min(w, h) / 2 - 10, cx = w / 2, cy = h / 2, kx = Math.cos(CENTER.lat * RAD);
  return p => [cx + ((p.lng - CENTER.lng) * KM_DEG * kx / R) * S, cy - ((p.lat - CENTER.lat) * KM_DEG / R) * S];
}

export function drawMap(cv, world, { radius, fruit, hover }) {
  const d = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
  const x = cv.getContext("2d"), S = Math.min(w, h) / 2 - 10, cx = w / 2, cy = h / 2, px = projector(w, h);
  x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
  x.save(); x.translate(cx, cy); x.rotate(0.32); x.strokeStyle = "#1F1F26";
  for (let i = -16; i <= 16; i++) {
    x.lineWidth = i % 5 ? 1 : 3; x.beginPath();
    x.moveTo(i * 42, -w); x.lineTo(i * 42, w); x.moveTo(-w, i * 42); x.lineTo(w, i * 42); x.stroke();
  }
  x.restore();
  x.font = "600 11px Nunito, sans-serif"; x.setLineDash([4, 5]);
  [1, 2, 3].forEach(k => {
    x.strokeStyle = "#2E2E36"; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, (S * k) / R, 0, 7); x.stroke();
    x.fillStyle = "#6B6B76"; x.fillText(k + " km", cx + 4, cy - (S * k) / R - 4);
  });
  x.setLineDash([]);
  const rr = (S * radius) / R, pulse = (performance.now() % 2400) / 2400;
  x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fillStyle = "rgba(246,224,94,.07)"; x.fill(); x.strokeStyle = "#F6E05E"; x.lineWidth = 1.5; x.stroke();
  x.beginPath(); x.arc(cx, cy, rr * pulse, 0, 7); x.strokeStyle = `rgba(246,224,94,${0.45 * (1 - pulse)})`; x.stroke();
  world.consumers.forEach(c => {
    const [qx, qy] = px(c), hot = c.in && c.likes.includes(fruit);
    x.beginPath(); x.arc(qx, qy, hot ? 6.5 : 4.5, 0, 7);
    x.fillStyle = c.in ? "#F6E05E" : "#555560";
    if (hot) { x.shadowColor = "#F6E05E"; x.shadowBlur = 12; }
    x.fill(); x.shadowBlur = 0;
    if (c === hover) { x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke(); }
  });
  world.ngos.forEach(n => {
    const [qx, qy] = px(n);
    x.save(); x.translate(qx, qy); x.rotate(Math.PI / 4); x.fillStyle = "#9ADB74"; x.fillRect(-6, -6, 12, 12);
    if (n === hover) { x.strokeStyle = "#fff"; x.strokeRect(-6, -6, 12, 12); }
    x.restore();
  });
  x.fillStyle = "#F6E05E"; x.beginPath(); x.roundRect(cx - 9, cy - 9, 18, 18, 4); x.fill();
  x.fillStyle = "#121214"; x.fillRect(cx - 5, cy - 1, 10, 2); x.fillRect(cx - 5, cy - 5, 10, 2);
}

/** Consumidor ou ONG sob o ponteiro (mais tolerante em toque). */
export function pickPoint(ev, cv, world) {
  const b = cv.getBoundingClientRect(), mx = ev.clientX - b.left, my = ev.clientY - b.top, px = projector(cv.clientWidth, cv.clientHeight);
  let best = null, bd = ev.pointerType === "touch" ? 26 : 14;
  [...world.consumers, ...world.ngos].forEach(p => {
    const [qx, qy] = px(p), dd = Math.hypot(qx - mx, qy - my);
    if (dd < bd) { bd = dd; best = p; }
  });
  return best;
}
