import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" deixa o build funcionar em qualquer subpasta.
// O roteamento é por hash (#/dashboard), então não precisa de configuração no servidor.
export default defineConfig({ plugins: [react(), tailwindcss()], base: "./" });
