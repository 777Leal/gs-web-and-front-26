import Icon from "./Icon";
import { LiveDot, cx } from "./ui";
import { useSim } from "../context/SimContext";
import { MEALS_KG, EMPTY, NAV } from "../lib/constants";
import { num } from "../lib/format";
import { useStore } from "../lib/store";

// No desktop é uma coluna fixa; em ≤900px vira barra superior (marca), barra inferior (nav) e status flutuante.
const NAV_LINK =
  "flex items-center gap-3 transition duration-[250ms] ease-soft [&_svg]:opacity-90 " +
  "hover:translate-x-1 max-desk:hover:translate-x-0 " +
  "desk:rounded-full desk:px-[1.15rem] desk:py-[.8rem] desk:font-bold " +
  "max-desk:min-h-[54px] max-desk:min-w-0 max-desk:flex-1 max-desk:flex-col max-desk:justify-center max-desk:gap-[.2rem] " +
  "max-desk:rounded-2xl max-desk:px-[.2rem] max-desk:py-[.4rem] max-desk:text-center max-desk:text-[.72rem] max-desk:leading-[1.15] max-desk:font-medium";
const NAV_ACTIVE =
  "desk:bg-y desk:text-bg max-desk:bg-[linear-gradient(180deg,var(--color-y-glow),transparent)] max-desk:text-y max-desk:shadow-[inset_0_2px_var(--color-y)]";
const NAV_IDLE = "text-mute hover:bg-panel-2 hover:text-txt";

export default function Sidebar({ page }) {
  const { paused } = useSim();
  const D = useStore("ff_dispatch", EMPTY);
  const kg = D.reduce((a, r) => a + r.kg, 0);
  const donated = D.filter(r => r.type === "donation").reduce((a, r) => a + r.kg, 0);

  return (
    <aside
      id="sidebar"
      className="sticky top-0 flex h-screen flex-col gap-8 border-r border-hair bg-glass px-[1.2rem] py-[1.6rem] backdrop-blur-[18px] max-desk:contents"
    >
      <a
        href="#/dashboard"
        aria-label="FreshFruit: ir ao Dashboard"
        className="flex items-center gap-[.6rem] font-display text-[1.75rem] font-bold tracking-[-.03em] max-desk:sticky max-desk:top-0 max-desk:z-30 max-desk:h-[calc(56px+env(safe-area-inset-top))] max-desk:border-b max-desk:border-line max-desk:bg-panel max-desk:px-4 max-desk:pt-[env(safe-area-inset-top)]"
      >
        <span className="grid size-[38px] flex-none place-items-center">
          <svg viewBox="0 0 32 32" width="38" height="38" aria-hidden="true">
            <circle cx="16" cy="18" r="12" fill="#F6E05E" />
            <path d="M16 7c0-3.4 2.8-5 6.2-5 0 3.4-2.2 6-6.2 5z" fill="#9ADB74" />
          </svg>
        </span>
        <span>Fresh<b className="text-y">Fruit</b></span>
      </a>
      <p className="-mt-[1.4rem] text-[.95rem] leading-[1.4] text-mute max-desk:hidden">Fruta que não vira lixo.</p>
      <nav
        aria-label="Seções"
        className="flex flex-col gap-[.3rem] max-desk:fixed max-desk:inset-x-0 max-desk:bottom-0 max-desk:z-40 max-desk:flex-row max-desk:gap-0 max-desk:border-t max-desk:border-line max-desk:bg-panel max-desk:px-2 max-desk:pt-[.3rem] max-desk:pb-[calc(.3rem+env(safe-area-inset-bottom))]"
      >
        {NAV.map(([key, title, icon]) => (
          <a key={key} href={`#/${key}`} className={cx(NAV_LINK, page === key ? NAV_ACTIVE : NAV_IDLE)} aria-current={page === key ? "page" : undefined}>
            <Icon name={icon} /><span>{title}</span>
          </a>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-[rgba(154,219,116,.25)] bg-green-deep bg-[linear-gradient(160deg,rgba(154,219,116,.16),transparent)] px-[1.2rem] py-[1.1rem] max-desk:hidden">
        <small className="block text-[.85rem] text-mute">Já resgatado do lixo</small>
        <b className="block font-display text-[2.1rem] leading-[1.15] font-bold text-green">{num(kg)} kg</b>
        <span className="mt-[.2rem] block text-[.85rem] text-mute">{D.length ? `≈ ${num(donated * MEALS_KG)} porções doadas` : "Envie a primeira oferta ou doação."}</span>
      </div>
      <div className="flex items-center gap-[.6rem] text-[.8rem] text-mute max-desk:fixed max-desk:top-[env(safe-area-inset-top)] max-desk:right-4 max-desk:z-[31] max-desk:h-14 max-desk:text-[.78rem]">
        <LiveDot />{paused ? "Simulação pausada" : "3 sensores online"}
      </div>
    </aside>
  );
}
