import { useCallback, useSyncExternalStore } from "react";

/* Mini store sobre localStorage. Mantém as mesmas chaves do projeto original
   (ff_lots, ff_dispatch, ff_negs, ff_check), notifica a própria aba e escuta
   o evento "storage" para sincronizar outras abas. */
const listeners = new Map();   // chave -> Set<callback>
const cache = new Map();       // chave -> { raw, value } (referência estável para o React)
const mem = new Map();         // fallback se o localStorage estiver bloqueado

const rawGet = k => { try { return localStorage.getItem(k); } catch { return mem.get(k) ?? null; } };
const rawSet = (k, v) => { try { localStorage.setItem(k, v); } catch { mem.set(k, v); } };
const rawDel = k => { try { localStorage.removeItem(k); } catch { mem.delete(k); } };
const notify = key => listeners.get(key)?.forEach(fn => fn());

if (typeof window !== "undefined") {
  window.addEventListener("storage", e => {
    if (e.key === null) listeners.forEach(set => set.forEach(fn => fn()));
    else notify(e.key);
  });
}

function get(key, fallback) {
  const raw = rawGet(key);
  if (raw === null) return fallback;
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value = fallback;
  try { value = JSON.parse(raw) ?? fallback; } catch { /* JSON inválido: usa o fallback */ }
  cache.set(key, { raw, value });
  return value;
}

export const store = {
  get,
  set(key, value) { rawSet(key, JSON.stringify(value)); notify(key); },
  del(key) { rawDel(key); notify(key); }
};

/** Lê uma chave do store e re-renderiza quando ela muda. `fallback` deve ser uma constante estável. */
export function useStore(key, fallback) {
  const subscribe = useCallback(cb => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(cb);
    return () => listeners.get(key).delete(cb);
  }, [key]);
  return useSyncExternalStore(subscribe, () => get(key, fallback));
}
