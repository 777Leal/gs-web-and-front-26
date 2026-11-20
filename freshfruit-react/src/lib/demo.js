/** 14 dias de histórico fictício (gerador pseudoaleatório com semente fixa). */
export function demoHistory() {
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const F = [["Banana", 6], ["Maçã", 8], ["Tomate", 7]];
  const N = ["Banco de Alimentos Vila", "Cozinha Solidária Esperança", "Abrigo Casa Aurora"];
  const out = [];
  for (let d = 13; d >= 0; d--) {
    for (let k = 0, n = 1 + Math.floor(r() * 3); k < n; k++) {
      const [fruit, price] = F[Math.floor(r() * 3)], don = r() < 0.4, kg = Math.round(8 + r() * 30), disc = [25, 40, 50][Math.floor(r() * 3)];
      out.push({
        id: out.length + 1, ts: Date.now() - d * 864e5 - k * 3.6e6, lot: "hist", fruit, kg,
        type: don ? "donation" : "sale", discount: don ? 0 : disc,
        revenue: don ? 0 : +(kg * price * (1 - disc / 100)).toFixed(2),
        to: don ? N[Math.floor(r() * 3)] : `${2 + Math.floor(r() * 6)} consumidores`
      });
    }
  }
  return out;
}
