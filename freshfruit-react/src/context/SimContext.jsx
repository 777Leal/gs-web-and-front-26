import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { TONE } from "../components/ui";
import { LBL } from "../lib/constants";
import { N, SIM_H, TICK_MS, createLots, readLot } from "../lib/sim";
import { store } from "../lib/store";

/* Simulação dos sensores IoT. Fica acima das rotas para continuar rodando
   (e publicando ff_lots) mesmo quando o usuário está em outra aba, como no original.
   O estado quente (lotes, histórico) é mutável e vive em um ref; um contador de ticks
   re-renderiza os consumidores a cada segundo. */
const SimContext = createContext(null);
export const useSim = () => useContext(SimContext);

function createSim() {
  const s = { lots: createLots(), ppmHist: {}, spiking: {}, prevStatus: {}, paused: false, lastTick: performance.now() };
  s.lots.forEach(l => { for (let i = 0; i < N; i++) readLot(l, 0, s.ppmHist, s.spiking); });
  s.lots.forEach(l => { s.prevStatus[l.id] = l.status; });
  return s;
}

const publish = lots =>   // compartilha o estado dos lotes com a aba Conexão
  store.set("ff_lots", lots.map(l => ({ id: l.id, fruit: l.fruit, variety: l.variety, kg: l.kg, price: l.price, hours: +l.hours.toFixed(1), status: l.status, discount: l.discount })));

export function SimProvider({ children }) {
  const [, force] = useReducer(x => x + 1, 0);
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState(() => [{ id: 0, time: new Date().toLocaleTimeString("pt-BR"), node: "Sensores conectados. Monitorando 3 lotes." }]);
  const simRef = useRef(null);
  if (!simRef.current) simRef.current = createSim();
  const sim = simRef.current;
  const logId = useRef(0);

  const addLog = useCallback(node => {
    setLogs(prev => [{ id: ++logId.current, time: new Date().toLocaleTimeString("pt-BR"), node }, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    publish(sim.lots);
    const id = setInterval(() => {
      if (sim.paused) return;
      sim.lots.forEach(l => readLot(l, SIM_H, sim.ppmHist, sim.spiking));
      sim.lastTick = performance.now();
      sim.lots.forEach(l => {
        const prev = sim.prevStatus[l.id];
        if (prev && prev !== l.status) addLog(<>{l.fruit}: {LBL[prev]} → <b className={TONE[l.status]}>{LBL[l.status]}</b></>);
        sim.prevStatus[l.id] = l.status;
      });
      publish(sim.lots);
      force();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [sim, addLog]);

  const togglePause = () => {
    const next = !sim.paused;
    sim.paused = next;
    setPaused(next);
    addLog(next ? "Simulação pausada" : "Simulação retomada");
    if (!next) sim.lastTick = performance.now();
  };

  /** Agenda um pico de etileno em um lote aleatório e devolve o lote escolhido. */
  const spike = () => {
    const l = sim.lots[Math.floor(Math.random() * sim.lots.length)];
    sim.spiking[l.id] = 8;
    addLog(`Pico de etileno injetado em ${l.fruit}`);
    return l;
  };

  return <SimContext.Provider value={{ sim, lots: sim.lots, paused, logs, togglePause, spike }}>{children}</SimContext.Provider>;
}
