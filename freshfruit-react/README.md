# FreshFruit (React)

Versão em React + Vite do FreshFruit: monitoramento IoT de etileno, geocerca hiperlocal e painel de impacto social.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/
npm run preview  # serve o build
```

## Estrutura

```
src/
  main.jsx              entrada; importa index.css (Tailwind)
  App.jsx               roteador por hash + providers + layout
  hooks.js              useHashRoute, useClock
  context/
    SimContext.jsx      simulação dos sensores (roda em qualquer aba e publica ff_lots)
    ToastContext.jsx    toast global
  lib/
    sim.js              modelo de maturação (Q10 + etileno)
    geo.js              haversine, geocerca, motor de decisão, desenho do mapa
    charts.js           gráficos em canvas (ondas, vida útil, barras)
    store.js            localStorage reativo (useStore), mesmas chaves do original
    format.js · constants.js · lots.js · demo.js
  components/           Icon, Sidebar, FlashText, CountUp, ui.jsx (Card, Btn, Badge, Bar…)
  pages/                Dashboard, Connection, Impact
  index.css             Tailwind v4: tokens (@theme), keyframes e base. Todo o resto são utilitários nos JSX
public/                 dashboard.html, impact.html, connection.html (redirecionam para #/rota)
```

Rotas: `#/dashboard`, `#/connection?lote=l1`, `#/impact`.
Chaves do localStorage: `ff_lots`, `ff_dispatch`, `ff_negs`, `ff_check`.

## Estilo (Tailwind v4)

- Sem arquivos CSS por página: o visual vive em classes utilitárias nos componentes.
- Tokens em `src/index.css` (`@theme`): cores (`bg-panel`, `text-y`, `text-green`…), fontes (`font-display`), animações (`animate-rise`, `animate-pulse-ring`…).
- Breakpoints próprios: `max-desk:` (≤900px, layout mobile com barra inferior) e `max-wide:` (≤1180px); `desk:` é ≥901px.
- Peças repetidas (cartão, botão, selo, barra, legenda, log) estão em `src/components/ui.jsx`.

## Live Server (VS Code)

O código-fonte (JSX + Tailwind) precisa de build, então o Live Server não abre o `index.html` da raiz.
Esta pasta já traz um build pronto em `dist/` e o `.vscode/settings.json` aponta o Live Server para ele:
clique em **Go Live** e pronto. Depois de editar o código, rode `npm run build` para atualizar o `dist/`
(ou use `npm run dev`, que já recarrega sozinho).
