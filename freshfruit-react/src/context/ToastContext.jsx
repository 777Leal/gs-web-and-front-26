import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef();
  const id = useRef(0);

  const toast = useCallback((message, emoji) => {
    clearTimeout(timer.current);
    setT({ id: ++id.current, message, emoji });
    timer.current = setTimeout(() => setT(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {t && (
        <div key={t.id} className="fixed right-6 bottom-6 z-[60] flex animate-rise-fast items-center gap-[.6rem] rounded-full bg-y px-[1.4rem] py-[.85rem] font-semibold text-bg max-desk:right-4 max-desk:bottom-[calc(76px+env(safe-area-inset-bottom))] max-desk:left-4" role="status">
          {t.emoji ? <span aria-hidden="true">{t.emoji}</span> : <Icon name="check" size={16} />}
          {t.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
