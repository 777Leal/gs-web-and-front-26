/** Estoque que sobrou de um lote após vendas e doações registradas. */
export const remainingKg = (lot, dispatch) =>
  Math.max(0, lot.kg - dispatch.reduce((a, r) => (r.lot === lot.id ? a + r.kg : a), 0));
