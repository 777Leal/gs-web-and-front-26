import { useEffect, useState } from "react";

/** Número que sobe de 0 até `value` em ~900 ms (respeita prefers-reduced-motion). */
export default function CountUp({ value, format }) {
  const [text, setText] = useState(() => format(0));
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setText(format(value)); return; }
    let raf;
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 900), e = 1 - (1 - k) ** 3;
      setText(format(value * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <b className="font-display text-[2.8rem] leading-none font-extrabold text-green max-desk:text-[1.7rem]">{text}</b>;
}
