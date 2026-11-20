import { useEffect, useState } from "react";
import { ROUTES } from "./lib/constants";

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, ""), [name, q = ""] = h.split("?");
  return { page: ROUTES[name] ? name : "dashboard", params: new URLSearchParams(q) };
}

/** Roteador por hash: #/dashboard, #/connection?lote=l1, #/impact. */
export function useHashRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const on = () => setRoute(parseRoute());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function useClock() {
  const fmt = () => new Date().toLocaleTimeString("pt-BR");
  const [t, setT] = useState(fmt);
  useEffect(() => { const id = setInterval(() => setT(fmt()), 1000); return () => clearInterval(id); }, []);
  return t;
}
