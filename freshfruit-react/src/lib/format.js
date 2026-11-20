export const pl = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;

export const fmtH = h => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
};

export const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const num = (v, d = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
