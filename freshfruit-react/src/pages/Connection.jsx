import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Icon from "../components/Icon";
import { Badge, Btn, Card, Legend, LegendItem, LogList, MAIN, Metric, Metrics, PanelHead, Panels, TD, TH, TONE, Topbar, cx } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { EMPTY, LBL, SEED_LOTS } from "../lib/constants";
import { brl, fmtH, num, pl } from "../lib/format";
import { createWorld, decide, dist, drawMap, inside, pickPoint, stepWorld } from "../lib/geo";
import { remainingKg } from "../lib/lots";
import { store, useStore } from "../lib/store";

const NEGO_FLOOR = 0.45;   // piso: 45% do preço cheio
const patchNegs = fn => store.set("ff_negs", fn(store.get("ff_negs", EMPTY)));
const patchNeg = (id, change) => patchNegs(list => list.map(n => (n.id === id ? { ...n, ...change } : n)));

function Log({ id, entries, className }) {
  return <LogList id={id} className={className} rows={entries.map(e => ({ id: e.id, time: e.time, content: e.text }))} />;
}

function NegoRow({ n, onYes, onNo, onCounter }) {
  return (
    <div className="grid grid-cols-[1fr_130px_auto] items-center gap-4 border-b border-line py-[.8rem] last:border-b-0 max-desk:grid-cols-[1fr_auto] max-desk:gap-x-[.8rem] max-desk:gap-y-[.6rem]">
      <div><b>{n.who}</b><small className="block text-[.82rem] text-mute">{n.kg} kg de {n.fruit} · oferta {brl(n.offer)}/kg · piso {brl(n.floor)}</small></div>
      <div className={cx("text-right font-display text-[1.35rem] font-bold", n.bid >= n.offer ? TONE.ok : TONE.warn)}>
        {brl(n.bid)}<small className="ml-[.2rem] inline text-[.82rem] text-mute">/kg</small>
      </div>
      <div className="flex justify-end gap-2 max-desk:col-span-full">
        {n.st === "open" ? (
          <>
            <Btn size="sm" variant="primary" disabled={n.bid < n.floor} onClick={onYes}>Aceitar</Btn>
            {!n.countered && <Btn size="sm" onClick={onCounter}>Contrapor</Btn>}
            <Btn size="sm" onClick={onNo}>Recusar</Btn>
          </>
        ) : n.st === "wait" ? <span className="text-mute">Aguardando resposta</span>
          : n.st === "won" ? <Badge tone="ok">Fechado</Badge>
          : <Badge tone="critical">Recusado</Badge>}
      </div>
    </div>
  );
}

export default function Connection({ params }) {
  const toast = useToast();
  const lots = useStore("ff_lots", SEED_LOTS);
  const dispatch = useStore("ff_dispatch", EMPTY);
  const negs = useStore("ff_negs", EMPTY);

  const loteParam = params.get("lote");
  const [sel, setSel] = useState(() => (lots.some(l => l.id === loteParam) ? loteParam : lots[0].id));
  const [radius, setRadius] = useState(1.5);
  const [notified, setNotified] = useState(() => new Set());
  const [tip, setTip] = useState(null);
  const [glogs, setGlogs] = useState(() => [{ id: 0, time: new Date().toLocaleTimeString("pt-BR"), text: "Geocerca ativa. Monitorando entradas e saídas." }]);
  const [, bump] = useReducer(x => x + 1, 0);

  const worldRef = useRef(null);
  if (!worldRef.current) worldRef.current = createWorld(1.5);
  const world = worldRef.current;

  const lot = lots.find(l => l.id === sel) || lots[0];
  const live = useRef({ radius, fruit: lot.fruit, hover: null });   // lido pelos laços de animação/intervalo
  live.current.radius = radius;
  live.current.fruit = lot.fruit;

  const mapRef = useRef(null), logId = useRef(0);
  const glog = useCallback(text => {
    setGlogs(prev => [{ id: ++logId.current, time: new Date().toLocaleTimeString("pt-BR"), text }, ...prev].slice(0, 30));
  }, []);

  const changeLot = id => { setSel(id); setNotified(new Set()); };

  // ?lote=… vindo do modal do Dashboard
  useEffect(() => {
    if (loteParam && loteParam !== sel && lots.some(l => l.id === loteParam)) changeLot(loteParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteParam]);

  // negociações que estavam aguardando resposta voltam a "abertas" ao recarregar
  useEffect(() => {
    if (negs.some(n => n.st === "wait")) patchNegs(list => list.map(n => (n.st === "wait" ? { ...n, st: "open" } : n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // consumidores caminham; avisa quando alguém cruza a geocerca
  useEffect(() => {
    const id = setInterval(() => {
      const { radius: r, fruit } = live.current;
      stepWorld(world, r, (c, entered) =>
        glog(`${c.name} ${entered ? "entrou na" : "saiu da"} geocerca (${num(dist(c), 2)} km)${entered && c.likes.includes(fruit) ? ` · interesse em ${fruit}` : ""}`));
      bump();
    }, 1500);
    return () => clearInterval(id);
  }, [world, glog]);

  // mapa em canvas
  useEffect(() => {
    let raf;
    const f = () => {
      const cv = mapRef.current;
      if (cv && cv.clientWidth > 0) drawMap(cv, world, live.current);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [world]);

  const R = remainingKg(lot, dispatch);
  const D = decide(world, lot, R, radius);
  const inC = world.consumers.filter(c => c.in), inN = world.ngos.filter(n => inside(n, radius));
  const cls = { hold: "ok", sale: "warn", donate: "ok", expand: "critical" }[D.a];
  const title = { hold: "Manter à venda", sale: `Vender com ${D.disc}% de desconto`, donate: "Doar para ONG", expand: "Ampliar o raio" }[D.a];
  const metrics = D.a === "donate"
    ? [["ONG mais próxima", D.ngos[0]?.name ?? "—"], ["Quantidade", num(D.kgDon) + " kg"], ["Distância", D.ngos[0] ? num(dist(D.ngos[0]), 1) + " km" : "—"]]
    : [["Compradores", D.cons.length], ["Preço por kg", `${brl(lot.price)} → ${brl(D.price)}`], ["Receita estimada", brl(D.revenue)]];
  const rows = [...inC.map(c => [c, "Consumidor"]), ...inN.map(n => [n, "ONG"])].sort((a, b) => dist(a[0]) - dist(b[0]));
  const open = negs.filter(n => n.st === "open" || n.st === "wait").length;

  function send(type) {
    const d = decide(world, lot, R, radius, type === "sale" ? "sale" : "donate");
    if (type === "sale") {
      if (!d.cons.length) return;
      const targets = d.cons.slice(0, 5);
      setNotified(prev => new Set([...prev, ...targets.map(c => c.name)]));
      glog(`Oferta de ${lot.fruit} a ${brl(d.price)}/kg enviada a ${pl(targets.length, "consumidor", "consumidores")}`);
      toast(`Oferta enviada a ${pl(targets.length, "consumidor", "consumidores")}`);
      targets.forEach((c, i) => setTimeout(() => {   // cada consumidor responde depois de um tempo
        const bid = Math.random() < 0.4 ? d.price : +(d.price * (0.72 + Math.random() * 0.22)).toFixed(2);
        patchNegs(list => [...list, { id: Date.now() + i, who: c.name, lot: lot.id, fruit: lot.fruit, kg: 1 + Math.floor(Math.random() * 4), offer: d.price, bid, floor: +(lot.price * NEGO_FLOOR).toFixed(2), st: "open" }]);
        glog(`${c.name} ${bid >= d.price ? "aceitou a oferta" : "fez contraproposta de " + brl(bid) + "/kg"}`);
      }, 1200 + i * 1100 + Math.random() * 1500));
      return;
    }
    if (!d.ngos.length) return;
    const rec = { id: Date.now(), ts: Date.now(), lot: lot.id, fruit: lot.fruit, kg: d.kgDon, type, discount: 0, revenue: 0, to: d.ngos[0].name };
    store.set("ff_dispatch", [...store.get("ff_dispatch", EMPTY), rec]);
    setNotified(prev => new Set([...prev, d.ngos[0].name]));
    glog(`Coleta de ${num(rec.kg)} kg de ${lot.fruit} solicitada à ${d.ngos[0].name}`);
    toast(`Doação solicitada à ${d.ngos[0].name}`, "💛");
  }

  function answer(id, ok) {
    const n = store.get("ff_negs", EMPTY).find(z => z.id === id);
    if (!n) return;
    const l = lots.find(z => z.id === n.lot) || lot, disp = store.get("ff_dispatch", EMPTY), kg = Math.min(n.kg, remainingKg(l, disp));
    if (ok && kg) {
      store.set("ff_dispatch", [...disp, { id: Date.now(), ts: Date.now(), lot: l.id, fruit: l.fruit, kg, type: "sale", discount: Math.max(0, Math.round((1 - n.bid / l.price) * 100)), revenue: +(kg * n.bid).toFixed(2), to: n.who }]);
      patchNeg(id, { st: "won" });
      toast(`Venda fechada com ${n.who}: ${brl(kg * n.bid)}`);
      glog(`Venda fechada com ${n.who}: ${kg} kg a ${brl(n.bid)}/kg`);
    } else {
      patchNeg(id, { st: "lost" });
      glog(ok ? "Lote sem estoque suficiente" : `Proposta de ${n.who} recusada`);
    }
  }

  function counter(id) {   // contraproposta no ponto médio; o consumidor aceita em ~60% dos casos
    const n = store.get("ff_negs", EMPTY).find(z => z.id === id);
    if (!n) return;
    const mid = +((n.bid + n.offer) / 2).toFixed(2);
    patchNeg(id, { st: "wait", countered: true });
    setTimeout(() => {
      const accepted = Math.random() < 0.6;
      patchNeg(id, accepted ? { bid: mid, st: "open" } : { st: "open" });
      glog(`${n.who} ${accepted ? "aceitou a contraproposta de " + brl(mid) : "manteve " + brl(n.bid)}/kg`);
    }, 1500);
  }

  const onPointer = e => {
    const cv = e.currentTarget, p = pickPoint(e, cv, world);
    live.current.hover = p;
    if (!p) return setTip(null);
    const b = cv.getBoundingClientRect();
    setTip({ p, left: Math.max(4, Math.min(e.clientX - b.left + 14, b.width - 180)), top: e.clientY - b.top + 14 });
  };
  const onLeave = e => { if (e.pointerType === "mouse") { live.current.hover = null; setTip(null); } };
  const onRadius = e => {   // recalcula quem está dentro na hora, sem esperar o próximo passo da simulação
    const r = +e.target.value;
    world.consumers.forEach(c => { c.in = inside(c, r); });
    setRadius(r);
  };

  return (
    <main className={MAIN} id="view-connection">
      <Topbar
        title="Conexão hiperlocal"
        desc="A geocerca da banca localiza consumidores e ONGs por perto. O sistema cruza a vida útil do lote com quem está no raio e sugere vender com desconto ou doar.">
        <label htmlFor="lot" className="text-mute">Lote</label>
        <select id="lot" className="rounded-full border border-line bg-panel-2 px-[1.2rem] py-[.65rem] text-txt max-desk:min-h-11 max-desk:text-[16px]" value={lot.id} onChange={e => changeLot(e.target.value)}>
          {lots.map(l => <option key={l.id} value={l.id}>{l.fruit} {l.variety} · {fmtH(l.hours)} restantes</option>)}
        </select>
      </Topbar>

      <section className="mb-5 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 max-wide:grid-cols-[minmax(0,1fr)]">
        <Card>
          <PanelHead><h2>Geocerca da banca</h2><span className="text-mute">{pl(inC.length, "consumidor", "consumidores")} · {pl(inN.length, "ONG")} no raio</span></PanelHead>
          <div className="relative">
            <canvas id="map" ref={mapRef} className="h-[460px] cursor-crosshair rounded-3xl border border-hair bg-[#15151a] max-desk:h-[340px] max-desk:touch-pan-y" aria-label="Mapa com a geocerca da banca, consumidores e ONGs" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={onLeave} />
            {tip && (
              <div className="pointer-events-none absolute z-[5] rounded-[10px] border border-line bg-black/80 px-[.7rem] py-[.45rem] text-[.82rem] leading-[1.4] max-desk:max-w-[170px]" style={{ left: tip.left, top: tip.top }}>
                <b>{tip.p.name}</b><br />{num(dist(tip.p), 2)} km da banca<br />
                {tip.p.likes ? "Interesse: " + tip.p.likes.join(", ") : "Capacidade: " + tip.p.cap + " kg/dia"}
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-[.6rem]">
            <label htmlFor="radius">Raio de alcance <b className="ml-[.4rem] text-y">{num(radius, 1)} km</b></label>
            <input type="range" id="radius" min="0.5" max="3" step="0.1" value={radius} onChange={onRadius} className="w-full accent-y max-desk:h-8" />
            <Legend>
              <LegendItem color="var(--color-y)">Consumidor no raio</LegendItem>
              <LegendItem color="#555560">Fora do raio</LegendItem>
              <LegendItem color="var(--color-green)">ONG</LegendItem>
            </Legend>
          </div>
        </Card>

        <Card className="flex flex-col" id="decision" aria-live="polite">
          <PanelHead><h2>Decisão sugerida</h2><Badge tone={cls}>{LBL[lot.status]}</Badge></PanelHead>
          <p className={cx("mt-[.9rem] mb-2 font-display text-[1.7rem] leading-[1.15] font-bold tracking-[-.02em] max-desk:text-[1.4rem]", TONE[cls])}>{title}</p>
          <p className="text-mute">{D.why}</p>
          <Metrics stacked>{metrics.map(([k, v]) => <Metric key={k} label={k} stacked>{v}</Metric>)}</Metrics>
          <p className="text-mute">Restam {num(R)} kg de {lot.fruit} {lot.variety} neste lote.</p>
          <div className="mt-auto flex gap-[.7rem] pt-4 max-desk:flex-col">
            <Btn variant={D.a === "sale" ? "primary" : "ghost"} disabled={!D.cons.length || !R} onClick={() => send("sale")}><Icon name="tag" size={16} /> Enviar oferta</Btn>
            <Btn variant={D.a === "donate" ? "primary" : "ghost"} disabled={!D.ngos.length || !R} onClick={() => send("donation")}><Icon name="heart" size={16} /> Doar para ONG</Btn>
          </div>
        </Card>
      </section>

      <Card className="mb-5">
        <PanelHead><h2>Negociação</h2><span className="text-mute">{open} em aberto</span></PanelHead>
        <div id="nego" aria-live="polite">
          {negs.length
            ? negs.slice().reverse().map(n => <NegoRow key={n.id} n={n} onYes={() => answer(n.id, true)} onNo={() => answer(n.id, false)} onCounter={() => counter(n.id)} />)
            : <p className="text-mute">Envie uma oferta para abrir negociações com os consumidores do raio. Propostas abaixo do piso não podem ser aceitas.</p>}
        </div>
      </Card>

      <Panels even>
        <Card>
          <PanelHead><h2>Destinatários no raio</h2></PanelHead>
          <table className="w-full border-collapse text-[.9rem]" id="recip">
            <thead><tr><th className={TH}>Destinatário</th><th className={cx(TH, "max-desk:hidden")}>Perfil</th><th className={cx(TH, "text-right")}>Distância</th><th className={TH}>Situação</th></tr></thead>
            <tbody>
              {rows.length ? rows.map(([p, t]) => (
                <tr key={p.name}>
                  <td className={TD}>{p.name}</td><td className={cx(TD, "max-desk:hidden")}>{t}</td><td className={cx(TD, "text-right")}>{num(dist(p), 2)} km</td>
                  <td className={TD}>
                    {notified.has(p.name) ? <Badge tone="ok">Notificado</Badge>
                      : t === "ONG" ? "Aceita doação"
                      : p.likes.includes(lot.fruit) ? <b className={TONE.warn}>Quer {lot.fruit}</b>
                      : <span className="text-mute">Sem interesse</span>}
                  </td>
                </tr>
              )) : <tr><td colSpan={4} className={cx(TD, "text-mute")}>Ninguém dentro do raio. Aumente a geocerca.</td></tr>}
            </tbody>
          </table>
        </Card>
        <Card><PanelHead><h2>Atividade da geocerca</h2></PanelHead><Log id="glog" className="max-h-[260px]" entries={glogs} /></Card>
      </Panels>
    </main>
  );
}
