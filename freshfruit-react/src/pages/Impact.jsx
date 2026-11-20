import { useEffect, useRef } from "react";
import CountUp from "../components/CountUp";
import Icon from "../components/Icon";
import { Badge, Bar, Btn, CARD_FRAME, Card, Legend, LegendItem, MAIN, PanelHead, Panels, TD, TH, Topbar, TONE, cx } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { barChart } from "../lib/charts";
import { CHECKS, CO2_KG, EMPTY, LAW, MEALS_KG } from "../lib/constants";
import { demoHistory } from "../lib/demo";
import { brl, num } from "../lib/format";
import { store, useStore } from "../lib/store";

function BarChart({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    let cancel = barChart(cv, data);
    const onResize = () => { cancel(); cancel = barChart(cv, data); };
    addEventListener("resize", onResize);
    return () => { cancel(); removeEventListener("resize", onResize); };
  }, [data]);
  return <canvas id="bars" className="h-[280px] max-desk:h-[220px]" ref={ref} aria-label="Gráfico de barras de quilos vendidos e doados nos últimos 14 dias" />;
}

function exportCsv(D, toast) {
  if (!D.length) return toast("Nenhum registro para exportar");
  const rows = [
    ["Data", "Lote", "Decisão", "Quantidade (kg)", "Valor (R$)", "Destino"],
    ...D.map(r => [new Date(r.ts).toLocaleDateString("pt-BR"), r.fruit, r.type === "sale" ? "Venda" : "Doação", r.kg, String(r.revenue).replace(".", ","), r.to])
  ];
  const csv = "\ufeff" + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "registro-freshfruit.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Impact() {
  const toast = useToast();
  const D = useStore("ff_dispatch", EMPTY);
  const checked = useStore("ff_check", EMPTY);
  const has = D.length > 0;

  const loadDemo = () => {
    if (has && !confirm("Isto substitui os registros atuais pelo histórico de demonstração. Continuar?")) return;
    store.set("ff_dispatch", demoHistory());
    toast("Histórico de demonstração carregado");
  };
  const reset = () => {
    if (!has && !store.get("ff_negs", EMPTY).length) return toast("Não há dados para apagar");
    if (!confirm("Apagar todo o histórico de decisões e negociações? Esta ação não pode ser desfeita.")) return;
    store.del("ff_dispatch"); store.del("ff_negs");
    toast("Dados apagados");
  };
  const toggleCheck = (i, on) => store.set("ff_check", CHECKS.map((_, j) => (j === i ? on : !!checked[j])));

  const kg = D.reduce((a, r) => a + r.kg, 0), rev = D.reduce((a, r) => a + r.revenue, 0);
  const kgD = D.filter(r => r.type === "donation").reduce((a, r) => a + r.kg, 0);
  const KPIS = [
    ["box", "Alimento resgatado", kg, v => num(v) + " kg"],
    ["coins", "Receita recuperada", rev, brl],
    ["wind", "CO₂ evitado (estimativa)", kg * CO2_KG, v => num(v) + " kg"],
    ["heart", "Porções doadas (estimativa)", kgD * MEALS_KG, v => num(v)]
  ];
  const milestone = Math.floor(kg / 100) * 100;
  const byNgo = {};
  D.filter(r => r.type === "donation").forEach(r => { byNgo[r.to] = (byNgo[r.to] || 0) + r.kg; });
  const ngos = Object.entries(byNgo).sort((a, b) => b[1] - a[1]), top = Math.max(1, ...Object.values(byNgo));
  const recent = D.slice().sort((a, b) => b.ts - a.ts).slice(0, 8);
  const pct = Math.round((CHECKS.filter((_, i) => checked[i]).length / CHECKS.length) * 100);

  return (
    <main className={MAIN} id="view-impact">
      <Topbar
        title="Impacto social e econômico"
        desc="Resultado das decisões tomadas na aba Conexão: o que foi vendido, o que foi doado e quanto deixou de virar lixo.">
        <Btn onClick={loadDemo}><Icon name="chart" size={16} /> Carregar demonstração</Btn>
        <Btn onClick={() => exportCsv(D, toast)}><Icon name="box" size={16} /> Exportar registro</Btn>
        <Btn onClick={reset}><Icon name="trash" size={16} /> Limpar dados</Btn>
      </Topbar>

      {!has ? (
        <section className={cx(CARD_FRAME, "rounded-[32px] border-hair bg-panel bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0)_40%)] px-8 py-16 text-center max-desk:px-4 max-desk:py-8")}>
          <span className="mb-[.8rem] block text-[3.2rem] leading-none" aria-hidden="true">🌱</span>
          <h2>Nenhuma decisão registrada</h2>
          <p className="mx-auto mt-[.6rem] mb-[1.4rem] max-w-[52ch] text-mute">Envie uma oferta ou doação na aba Conexão hiperlocal e o impacto aparece aqui. Para ver a tela completa agora, carregue 14 dias de histórico de demonstração.</p>
          <Btn variant="primary" onClick={loadDemo}><Icon name="chart" size={16} /> Carregar demonstração</Btn>
        </section>
      ) : (
        <div id="impact-body">
          {milestone > 0 && (
            <section className="mb-5 flex items-center gap-[1.2rem] rounded-3xl border border-[rgba(154,219,116,.35)] bg-[linear-gradient(100deg,rgba(154,219,116,.22),rgba(246,224,94,.08))] px-[1.7rem] py-[1.3rem] max-desk:gap-[.8rem] max-desk:px-[1.1rem] max-desk:py-4">
              <span className="text-[2.6rem] leading-none max-desk:text-[2rem]" aria-hidden="true">🎉</span>
              <div><h2 className="text-[1.5rem] max-desk:text-[1.2rem]">Passamos de {num(milestone)} kg salvos do lixo</h2><p className="text-mute">≈ {num(kgD * MEALS_KG)} porções já chegaram a quem precisa.</p></div>
            </section>
          )}
          <section className="mb-5 grid grid-cols-4 gap-5 max-wide:grid-cols-2 max-desk:gap-3">
            {KPIS.map(([icon, label, value, fmt]) => (
              <article key={label} className={cx(CARD_FRAME, "flex flex-col gap-[.35rem] rounded-3xl border-[rgba(154,219,116,.22)] bg-green-deep bg-[linear-gradient(160deg,rgba(154,219,116,.15),transparent_70%)] p-5 max-desk:p-4")}>
                <Icon name={icon} size={22} className="text-green" /><CountUp value={value} format={fmt} /><span className="text-[.9rem] text-mute max-desk:text-[.82rem]">{label}</span>
              </article>
            ))}
          </section>

          <Panels>
            <Card>
              <PanelHead>
                <h2>Quilos resgatados por dia</h2>
                <Legend><LegendItem color="var(--color-y)">Vendido</LegendItem><LegendItem color="var(--color-green)">Doado</LegendItem></Legend>
              </PanelHead>
              <BarChart data={D} />
            </Card>
            <Card>
              <PanelHead><h2>Doações por ONG</h2></PanelHead>
              <div id="ngos">
                {ngos.length ? ngos.map(([name, v]) => (
                  <div key={name} className="mb-[1.1rem] grid grid-cols-[1fr_90px] items-center gap-x-[.8rem] gap-y-[.3rem] text-[.9rem]">
                    <span>{name}</span>
                    <Bar className="order-3 col-span-full" color="var(--color-green)" pct={(v / top) * 100} />
                    <b className="text-right">{num(v)} kg</b>
                  </div>
                )) : <p className="text-mute">Nenhuma doação registrada ainda.</p>}
              </div>
            </Card>
          </Panels>

          <Card className="mb-5">
            <PanelHead><h2>Últimas decisões</h2></PanelHead>
            <table className="w-full border-collapse text-[.9rem]" id="tbl">
              <thead className="max-desk:hidden"><tr><th className={TH}>Data</th><th className={TH}>Lote</th><th className={TH}>Decisão</th><th className={cx(TH, "text-right")}>Quantidade</th><th className={cx(TH, "text-right")}>Valor</th><th className={TH}>Destino</th></tr></thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="max-desk:grid max-desk:grid-cols-[1fr_auto] max-desk:gap-x-[.8rem] max-desk:gap-y-[.15rem] max-desk:border-b max-desk:border-line max-desk:py-[.7rem]">
                    <td className={cx(TD, "max-desk:order-5 max-desk:border-0 max-desk:p-0 max-desk:text-[.82rem] max-desk:text-mute")}>{new Date(r.ts).toLocaleDateString("pt-BR")}</td>
                    <td className={cx(TD, "max-desk:order-1 max-desk:border-0 max-desk:p-0 max-desk:font-semibold")}>{r.fruit}</td>
                    <td className={cx(TD, "max-desk:order-2 max-desk:justify-self-end max-desk:border-0 max-desk:p-0")}><Badge tone={r.type === "sale" ? "warn" : "ok"}>{r.type === "sale" ? "Venda " + r.discount + "% off" : "Doação"}</Badge></td>
                    <td className={cx(TD, "text-right max-desk:order-4 max-desk:border-0 max-desk:p-0")}>{num(r.kg)} kg</td>
                    <td className={cx(TD, "text-right max-desk:order-6 max-desk:border-0 max-desk:p-0")}>{r.revenue ? brl(r.revenue) : "—"}</td>
                    <td className={cx(TD, "max-desk:order-3 max-desk:border-0 max-desk:p-0 max-desk:text-mute")}>{r.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Panels even>
            <Card>
              <PanelHead><h2>Base legal da doação</h2><span className="text-mute">consultado em 19/11/2026</span></PanelHead>
              <div>
                {LAW.map(([t, d], i) => (
                  <details key={t} open={i === 0} className="group border-b border-line py-[.7rem]">
                    <summary className="flex cursor-pointer list-none justify-between gap-4 font-semibold after:text-[1.2rem] after:leading-none after:text-y after:content-['+'] group-open:after:content-['−'] max-desk:text-[.95rem] [&::-webkit-details-marker]:hidden">{t}</summary>
                    <p className="mt-[.6rem] text-[.92rem] text-mute">{d}{i === 0 && <> <a className="text-y underline underline-offset-[3px]" href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15224.htm" target="_blank" rel="noopener noreferrer">Ler o texto no Planalto</a></>}</p>
                  </details>
                ))}
              </div>
              <p className="mt-[.8rem] text-[.82rem] text-mute">Resumo informativo. Não substitui orientação jurídica nem contábil.</p>
            </Card>
            <Card>
              <PanelHead><h2>Checklist de conformidade</h2><b className={TONE.ok}>{pct}%</b></PanelHead>
              <Bar id="cbar" color="var(--color-green)" pct={pct} />
              <div id="check" className="mt-[.8rem]">
                {CHECKS.map((c, i) => (
                  <label className="flex cursor-pointer items-start gap-[.7rem] py-[.55rem] text-[.92rem]" key={c}><input className="mt-[.2rem] size-[17px] flex-none accent-y" type="checkbox" checked={!!checked[i]} onChange={e => toggleCheck(i, e.target.checked)} />{c}</label>
                ))}
              </div>
            </Card>
          </Panels>
          <p className="mt-4 text-[.82rem] text-mute">Fatores ilustrativos: 1,1 kg de CO₂ e 2,5 porções por kg de fruta. Substitua por dados auditados antes de divulgar.</p>
        </div>
      )}
    </main>
  );
}
