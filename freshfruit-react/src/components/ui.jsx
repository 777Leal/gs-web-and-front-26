/* Peças de interface compartilhadas, estilizadas só com utilitários Tailwind.
   Todas as classes aparecem como strings completas para o scanner do Tailwind enxergá-las. */

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Cor de texto por status do lote (ok / warn / critical). */
export const TONE = { ok: "text-green", warn: "text-y", critical: "text-red" };

/* ---------- layout ---------- */
export const MAIN =
  "min-w-0 w-full max-w-[1700px] px-10 pt-8 pb-12 max-wide:px-6 max-wide:pt-6 max-wide:pb-10 max-desk:px-4 max-desk:pt-4 max-desk:pb-6";

export function Topbar({ title, desc, children }) {
  return (
    <header className="mb-[1.8rem] flex items-end justify-between max-desk:mb-[1.2rem] max-desk:flex-col max-desk:items-stretch max-desk:gap-4">
      <div>
        <h1>{title}</h1>
        <p className="mt-[.4rem] max-w-[60ch] text-[1.05rem] leading-[1.6] text-mute">{desc}</p>
      </div>
      <div className="flex items-center gap-4 max-desk:flex-wrap max-desk:gap-[.6rem] max-desk:[&>button]:flex-auto">{children}</div>
    </header>
  );
}

export function Panels({ even, className, children }) {
  return (
    <section
      className={cx(
        "mb-5 grid gap-5",
        even
          ? "grid-cols-2 items-start max-wide:grid-cols-[minmax(0,1fr)] [&>*]:max-h-[380px] [&>*]:overflow-auto max-wide:[&>*]:max-h-none"
          : "grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] max-wide:grid-cols-[minmax(0,1fr)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PanelHead({ children }) {
  return <div className="mb-4 flex items-center justify-between max-desk:flex-wrap max-desk:gap-2">{children}</div>;
}

/* ---------- superfícies ---------- */
export const CARD_FRAME = "relative border shadow-[0_28px_50px_-34px_#000]";
const CARD_SURFACE =
  "border-hair bg-panel bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0)_40%)]";

export function Card({ as: Tag = "article", className, children, ...rest }) {
  return (
    <Tag className={cx(CARD_FRAME, CARD_SURFACE, "rounded-3xl p-5 max-desk:p-4", className)} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- botões ---------- */
const BTN_BASE =
  "inline-flex items-center gap-2 rounded-full font-bold transition duration-300 ease-soft max-desk:justify-center disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40";
const BTN_SIZE = {
  md: "px-[1.3rem] py-[.7rem] max-desk:min-h-11",
  sm: "px-[.8rem] py-[.45rem] text-[.88rem] max-desk:min-h-10 max-desk:flex-1"
};
const BTN_VARIANT = {
  primary: "bg-y text-bg hover:-translate-y-0.5 hover:bg-y-2 hover:shadow-[0_12px_30px_-8px_var(--color-y-glow)]",
  ghost: "border border-line hover:border-y hover:text-y"
};

export function Btn({ as: Tag = "button", variant = "ghost", size = "md", className, ...rest }) {
  return <Tag className={cx(BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], className)} {...rest} />;
}

/** Tooltip por atributo data-tip (some em telas sem hover). Use junto de data-tip="…". */
export const TIP =
  "relative after:pointer-events-none after:absolute after:bottom-[calc(100%+10px)] after:left-1/2 after:z-20 after:-translate-x-1/2 after:translate-y-1.5 after:whitespace-nowrap after:rounded-[10px] after:border after:border-line after:bg-black/80 after:px-[.7rem] after:py-[.35rem] after:text-[.8rem] after:text-txt after:opacity-0 after:backdrop-blur-sm after:transition after:duration-200 after:ease-soft after:content-[attr(data-tip)] hover:after:translate-y-0 hover:after:opacity-100 [@media(hover:none)]:after:hidden";

/* ---------- selos, barras, legendas ---------- */
export function Badge({ tone = "ok", className, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[.4rem] rounded-full border border-current px-[.7rem] py-[.2rem] text-[.78rem] font-semibold",
        "before:size-[7px] before:rounded-full before:bg-current before:content-['']",
        tone === "critical" && "before:animate-pulse-ring",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function LiveDot() {
  return <span className="size-2.5 animate-pulse-ring-slow rounded-full bg-green" />;
}

/** Barra de progresso. A cor vem de `color` ou da variável CSS --c herdada. */
export function Bar({ pct, color, className, id, ...rest }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-lg bg-panel-2", className)} {...rest}>
      <i
        id={id}
        className="block h-full rounded-lg bg-[color:var(--c,var(--color-y))] transition-[width] duration-[800ms] ease-soft"
        style={{ width: pct + "%", ...(color ? { "--c": color } : null) }}
      />
    </div>
  );
}

export function Legend({ children }) {
  return <div className="flex gap-4 text-[.85rem] text-mute max-desk:flex-wrap max-desk:gap-x-[.9rem] max-desk:gap-y-[.4rem]">{children}</div>;
}

export function LegendItem({ color, children }) {
  return (
    <span style={{ "--c": color }}>
      <i className="mr-[.35rem] inline-block size-2.5 rounded-full bg-[color:var(--c)]" />
      {children}
    </span>
  );
}

/* ---------- métricas (modal, decisão) ---------- */
export function Metrics({ stacked, children }) {
  return (
    <div className={cx("my-[1.2rem] grid grid-cols-3 gap-4 max-desk:gap-2", stacked && "max-desk:grid-cols-1")}>
      {children}
    </div>
  );
}

export function Metric({ label, children, stacked }) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white/5 px-4 py-[.8rem] max-desk:px-2 max-desk:py-[.6rem]",
        stacked && "max-desk:flex max-desk:items-baseline max-desk:justify-between max-desk:gap-4"
      )}
    >
      <small className="block text-mute">{label}</small>
      <b
        className={cx(
          "font-display font-bold max-desk:whitespace-nowrap",
          stacked ? "block text-[1.05rem] leading-[1.3] max-desk:text-right" : "text-2xl max-desk:text-[.98rem]"
        )}
      >
        {children}
      </b>
    </div>
  );
}

/* ---------- log de eventos ---------- */
export function LogList({ rows, id, className = "max-h-[230px] max-desk:max-h-[200px]" }) {
  return (
    <div id={id} className={cx("overflow-auto", className)}>
      {rows.map(r => (
        <div key={r.id} className="flex animate-rise-fast gap-[.8rem] border-b border-line py-[.55rem] text-[.9rem]">
          <time className="min-w-16 text-mute">{r.time}</time>
          <span>{r.content}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- tabelas ---------- */
export const TH = "border-b border-line px-[.6rem] py-2 text-left font-medium text-mute";
export const TD = "border-b border-line p-[.6rem]";
