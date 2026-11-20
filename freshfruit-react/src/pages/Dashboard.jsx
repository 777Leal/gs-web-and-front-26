import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FlashText from "../components/FlashText";
import Icon from "../components/Icon";
import { Badge, Bar, Btn, CARD_FRAME, Card, Legend, LegendItem, LogList, MAIN, Metric, Metrics, PanelHead, Panels, TIP, TONE, Topbar, cx } from "../components/ui";
import { useSim } from "../context/SimContext";
import { useToast } from "../context/ToastContext";
import { useClock } from "../hooks";
import { line, shelfChart } from "../lib/charts";
import { EMPTY, LBL } from "../lib/constants";
import { fmtH } from "../lib/format";
import { remainingKg } from "../lib/lots";
import { FRUITS, TICK_MS } from "../lib/sim";
import { useStore } from "../lib/store";

function FruitCard({ lot, hist, kg, index, onOpen }) {
  const f = FRUITS[lot.fruit], spark = useRef(null);
  useEffect(() => { line(spark.current, [hist], [f.color], { pad: 4, w: 2 }); });   // redesenha a cada tick

  const track = e => {   // brilho que segue o mouse (variáveis --mx/--my lidas pelo before: do cartão)
    const c = e.currentTarget, b = c.getBoundingClientRect();
    c.style.setProperty("--mx", ((e.clientX - b.left) / b.width) * 100 + "%");
    c.style.setProperty("--my", ((e.clientY - b.top) / b.height) * 100 + "%");
  };

  return (
    <article
      className={cx(
        CARD_FRAME, "cursor-pointer animate-rise overflow-hidden rounded-[28px] border-hair bg-panel p-6 [--mx:50%] [--my:0%]",
        "bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_srgb,var(--c)_14%,transparent),transparent_62%)]",
        "transition duration-[350ms] ease-soft hover:-translate-y-[3px] hover:border-[color:var(--c)]",
        "before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:before:opacity-100",
        "before:bg-[radial-gradient(320px_circle_at_var(--mx)_var(--my),color-mix(in_srgb,var(--c)_22%,transparent),transparent_70%)]"
      )}
      style={{ "--c": f.color, animationDelay: index * 0.1 + "s" }} tabIndex={0} role="button"
      aria-label={`Detalhes do lote de ${lot.fruit}`} onMouseMove={track} onClick={onOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      <div className="flex items-center gap-[.9rem]">
        <span className="grid size-[54px] place-items-center rounded-[20px] bg-[color-mix(in_srgb,var(--c)_14%,transparent)] text-[color:var(--c)]"><Icon name="leaf" size={24} /></span>
        <div><h3>{lot.fruit} {lot.variety}</h3><small className="block text-mute"><span>{kg}</span> kg · R$ {lot.price}/kg</small></div>
        <Badge tone={lot.status} className="ml-auto">{LBL[lot.status]}</Badge>
      </div>
      <div className="mt-[.9rem] mb-[.2rem] font-display text-[4rem] leading-none font-extrabold text-[color:var(--c)] max-desk:text-[2.6rem]">
        <FlashText>{lot.ppm.toFixed(1)}</FlashText><small className="ml-[.3rem] font-sans text-[.95rem] font-medium text-mute">ppm C₂H₄</small>
      </div>
      <canvas className="mt-[.4rem] h-[46px]" height="46" ref={spark} />
      <div className="mt-[.8rem] mb-2 flex justify-between text-[.9rem] text-mute [&_b]:text-txt">
        <span><Icon name="thermo" size={15} /> <b>{lot.t}</b> °C</span>
        <span><Icon name="drop" size={15} /> <b>{lot.hum}</b>%</span>
        <span><Icon name="clock" size={15} /> <b>{fmtH(lot.hours)}</b></span>
      </div>
      <Bar className={TIP} data-tip="Maturação do lote" pct={lot.rip} />
    </article>
  );
}

function LotModal({ lot, kg, onClose }) {
  const closeBtn = useRef(null);
  const open = !!lot;

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    if (open) closeBtn.current?.focus();
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  const action = !lot ? "" : lot.status === "critical" ? `Vender com ${lot.discount}% off ou doar hoje`
    : lot.status === "warn" ? `Desconto sugerido de ${lot.discount}% nas próximas horas`
    : "Manter em ambiente ventilado e longe de frutas maduras";

  return createPortal(
    <div
      id="modal" aria-hidden={!open} onClick={e => e.target === e.currentTarget && onClose()}
      className={cx(
        "fixed inset-0 z-50 grid place-items-center bg-[rgba(8,8,10,.72)] backdrop-blur-[6px] transition-opacity duration-300 max-desk:p-3",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}>
      <div
        id="modal-body" role="dialog" aria-modal="true" style={lot ? { "--c": FRUITS[lot.fruit].color } : undefined}
        className={cx(
          "relative w-[min(720px,90vw)] rounded-[32px] border border-hair bg-[rgba(26,26,30,.9)] p-8 shadow-[0_40px_90px_-20px_#000] backdrop-blur-[24px] transition-transform duration-[350ms] ease-soft",
          "max-desk:max-h-[calc(100dvh-1.5rem)] max-desk:w-full max-desk:overflow-auto max-desk:p-5",
          open ? "translate-y-0 scale-100" : "translate-y-3 scale-[.96]"
        )}>
        {lot && (
          <>
            <button
              className="absolute top-4 right-[1.2rem] text-[1.6rem] text-mute transition duration-300 hover:rotate-90 hover:text-y max-desk:top-[.3rem] max-desk:right-[.4rem] max-desk:size-11 max-desk:text-[1.8rem]"
              aria-label="Fechar" onClick={onClose} ref={closeBtn}>×</button>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-8 max-desk:gap-4">
              <div className="relative grid size-[120px] place-items-center text-[color:var(--c)] max-desk:size-[84px]">
                {[0, 0.8, 1.6].map(d => (
                  <i key={d} className="absolute inset-0 animate-ripple rounded-full border-2 border-[color:var(--c)]" style={{ animationDelay: d + "s" }} />
                ))}
                <span><Icon name="leaf" size={44} /></span>
              </div>
              <div>
                <h2>{lot.fruit} {lot.variety}</h2>
                <p className="text-mute">{kg} kg · R$ {lot.price}/kg · {lot.rip.toFixed(0)}% maturada</p>
                <Badge tone={lot.status} className="mt-[.6rem]">{LBL[lot.status]}</Badge>
              </div>
            </div>
            <Metrics>
              <Metric label="Etileno">{lot.ppm.toFixed(1)} ppm</Metric>
              <Metric label="Temperatura">{lot.t} °C</Metric>
              <Metric label="Vida útil">{fmtH(lot.hours)}</Metric>
            </Metrics>
            <p><b>Ação recomendada:</b> {action}.</p>
            <div className="mt-4 flex gap-[.7rem] max-desk:flex-col">
              <Btn as="a" variant="primary" onClick={onClose} href={`#/connection?lote=${lot.id}`}><Icon name="pin" size={16} /> Ofertar na vizinhança</Btn>
              <Btn onClick={onClose}>Fechar</Btn>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function Dashboard() {
  const { sim, lots, paused, logs, togglePause, spike } = useSim();
  const dispatch = useStore("ff_dispatch", EMPTY);
  const toast = useToast();
  const clock = useClock();
  const [openId, setOpenId] = useState(null);
  const wave = useRef(null), shelf = useRef(null);

  // gráfico de ondas: laço de animação próprio (desliza suavemente entre os ticks)
  useEffect(() => {
    let raf, once = false, lastW = 0;
    const frame = () => {
      const cv = wave.current, w = cv?.clientWidth;
      if (cv && w && (!sim.paused || !once || lastW !== w)) {
        line(cv, sim.lots.map(l => sim.ppmHist[l.id]), sim.lots.map(l => FRUITS[l.fruit].color), {
          grid: 1, lo: 0, hi: 90, scrollOffset: sim.paused ? 0 : Math.min(1, (performance.now() - sim.lastTick) / TICK_MS)
        });
        once = true; lastW = w;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sim]);

  useEffect(() => { shelfChart(shelf.current, sim.lots); });   // a cada tick
  useEffect(() => {
    const onResize = () => shelfChart(shelf.current, sim.lots);
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, [sim]);

  const onSpike = () => {
    const l = spike();
    toast(paused ? `Pico agendado em ${l.fruit}. Retome a simulação para vê-lo` : `Pico de etileno em ${l.fruit}`, "⚡");
  };
  const openLot = lots.find(l => l.id === openId);

  return (
    <main className={MAIN} id="view-dashboard">
      <Topbar
        title="Etileno em tempo real"
        desc="Cada lote tem um sensor. Mais etileno e mais calor aceleram o amadurecimento: abaixo de 24 h restantes é hora de vender com desconto ou doar.">
        <span className="font-display text-[1.1rem] font-semibold text-y max-desk:flex-[1_0_100%]">{clock}</span>
        <Btn className={TIP} onClick={togglePause} aria-pressed={paused} data-tip={paused ? "Retomar simulação" : "Pausar simulação"}>
          <Icon name={paused ? "play" : "pause"} size={16} /> {paused ? "Retomar" : "Pausar"}
        </Btn>
        <Btn variant="primary" className={TIP} onClick={onSpike} data-tip="Simula uma fruta passada contaminando o lote">
          <Icon name="zap" size={16} /> Injetar pico
        </Btn>
      </Topbar>

      <section className="mb-5 grid grid-cols-3 gap-5 max-desk:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]" aria-label="Lotes monitorados">
        {lots.map((l, i) => <FruitCard key={l.id} index={i} lot={l} hist={sim.ppmHist[l.id]} kg={remainingKg(l, dispatch)} onOpen={() => setOpenId(l.id)} />)}
      </section>

      <Panels>
        <Card>
          <PanelHead>
            <h2>Ondas de etileno (ppm)</h2>
            <Legend>{lots.map(l => <LegendItem key={l.id} color={FRUITS[l.fruit].color}>{l.fruit}</LegendItem>)}</Legend>
          </PanelHead>
          <canvas id="wave" className="h-[300px] max-desk:h-[220px]" ref={wave} aria-label="Gráfico em tempo real de etileno por lote" />
        </Card>
        <Card>
          <PanelHead><h2>Vida útil restante</h2><span className="text-mute">projeção a 120 h</span></PanelHead>
          <canvas id="shelf" className="h-[200px] max-desk:h-[170px]" ref={shelf} aria-label="Curva de maturação projetada" />
          <div className="mt-4 flex flex-col gap-[.9rem]">
            {lots.map(l => (
              <div key={l.id} className="grid grid-cols-[90px_1fr_90px] items-center gap-[.8rem] text-[.9rem] max-desk:grid-cols-[72px_1fr_64px]">
                <span>{l.fruit}</span>
                <Bar color={FRUITS[l.fruit].color} pct={Math.min(100, l.hours / 1.2)} />
                <b className={cx("text-right", TONE[l.status])}>{fmtH(l.hours)}</b>
              </div>
            ))}
          </div>
        </Card>
      </Panels>

      <Card>
        <PanelHead><h2>Eventos dos sensores</h2></PanelHead>
        <LogList rows={logs.map(e => ({ id: e.id, time: e.time, content: e.node }))} />
      </Card>

      <LotModal lot={openLot} kg={openLot ? remainingKg(openLot, dispatch) : 0} onClose={() => setOpenId(null)} />
    </main>
  );
}
