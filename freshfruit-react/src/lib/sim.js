/* Sensores simulados e modelo de maturação (Q10 + etileno).
   Valores em ppm são ilustrativos: calibre com sensor real antes de produção. */
export const FRUITS = {
  Banana: { color: "#F6E05E", base: 120, k: 0.6, p0: 5, q10: 2.0 },   // base: horas até maturação total a 20 °C
  "Maçã": { color: "#FF6B5E", base: 400, k: 0.4, p0: 3, q10: 2.0 },
  Tomate: { color: "#9ADB74", base: 200, k: 0.35, p0: 2, q10: 2.2 }
};

export const TICK_MS = 1000, SIM_H = 0.25, N = 60;   // 1 s real = 15 min simulados; 60 pontos no gráfico

export const createLots = () => [
  { id: "l1", fruit: "Banana", variety: "Nanica", kg: 40, price: 6, rip: 62, temp: 28 },
  { id: "l2", fruit: "Maçã", variety: "Fuji", kg: 60, price: 8, rip: 40, temp: 22 },
  { id: "l3", fruit: "Tomate", variety: "Italiano", kg: 35, price: 7, rip: 55, temp: 24 }
];

const noise = s => (Math.random() + Math.random() + Math.random() - 1.5) * s;

export const rate = l => FRUITS[l.fruit].q10 ** ((l.t - 20) / 10) * (1 + l.ppm / 60);
export const discountFor = h => (h <= 12 ? 50 : h <= 24 ? 40 : h <= 48 ? 25 : 10);

/** Avança uma leitura do sensor (muta `l`, `history` e `spiking`). */
export function readLot(l, dt, history, spiking) {
  const f = FRUITS[l.fruit];
  const boost = spiking[l.id] > 0 ? (spiking[l.id]--, 25 + noise(6)) : 0;
  l.ppm = Math.max(0, +(f.p0 + l.rip * f.k + noise(2) + boost).toFixed(1));
  l.t = +(l.temp + noise(0.4)).toFixed(1);
  l.hum = Math.round(70 + noise(3));
  const r = rate(l);
  if (dt && l.rip < 100) l.rip = Math.min(100, l.rip + (100 * dt * r) / f.base);
  l.hours = ((100 - l.rip) / 100) * f.base / r;
  l.status = l.hours <= 24 ? "critical" : l.hours <= 72 ? "warn" : "ok";
  l.discount = discountFor(l.hours);
  const h = (history[l.id] ||= []);
  h.push(l.ppm);
  if (h.length > N) h.shift();
}
