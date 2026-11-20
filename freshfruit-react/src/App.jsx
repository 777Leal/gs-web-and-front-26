import { useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import { SimProvider } from "./context/SimContext";
import { ToastProvider } from "./context/ToastContext";
import { useHashRoute } from "./hooks";
import { ROUTES } from "./lib/constants";
import Connection from "./pages/Connection";
import Dashboard from "./pages/Dashboard";
import Impact from "./pages/Impact";

export default function App() {
  const { page, params } = useHashRoute();
  const first = useRef(true);

  useEffect(() => {
    document.title = "FreshFruit · " + ROUTES[page];
    if (first.current) first.current = false;
    else scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  return (
    <ToastProvider>
      <SimProvider>
        <div aria-hidden="true" className="pointer-events-none fixed -inset-[20%] -z-10 animate-aura bg-[radial-gradient(38%_34%_at_86%_6%,rgba(246,224,94,.11),transparent_70%),radial-gradient(44%_40%_at_6%_96%,rgba(154,219,116,.12),transparent_70%)]" />
        <div className="grid min-h-screen grid-cols-[248px_1fr] max-desk:grid-cols-[minmax(0,1fr)]">
          <Sidebar page={page} />
          {page === "dashboard" && <Dashboard />}
          {page === "connection" && <Connection params={params} />}
          {page === "impact" && <Impact />}
        </div>
      </SimProvider>
    </ToastProvider>
  );
}
