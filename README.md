# MakerLearn Studio — Sistema de diseño (React)

React + Vite + TypeScript wrapper around the original MakerLearn Studio screens plus the new **Pantalla 03 — Aprender (micro-learning móvil)** and **Pantalla 04 — Ecosistema de extensión (Bridge Extension + InsightLens)**. The original HTML/CSS/JS artifacts are served unchanged inside iframes so the design, layout, interactions, accessibility and animations are **preserved 1:1**. Screens 03 and 04 are implemented as isolated, production-quality prototypes (`public/mobile.html`, `public/extension.html` + their CSS/JS) and integrated into the React shell. Screen 02 keeps its original markup and only receives **companion-AI microcopy** in `public/js/screen.js` (see «IA de acompañamiento»).

## Screens

| # | Screen | Source | Served at |
|---|--------|--------|-----------|
| 01 | Sistema de diseño (tokens, components, themes, a11y) | `_original/index.html` | `/design.html` |
| 02 | Ruta Activa (student learning screen — Dijkstra challenge) | `_original/app.html` | `/app.html` |
| 02A | Ruta Activa — variante «Test fallido» | same markup + `?state=fallido` | `/app.html?state=fallido` |
| 03 | Aprender (micro-learning móvil — Fase 1 Dijkstra en Grafos) | `public/mobile.html` | `/mobile.html` |
| 03A–D | Aprender — frames alternos por estado | `mobile.html?state=acierto\|incorrecto\|racha\|logro` | `/mobile.html?state=...` |
| 04 | Ecosistema de extensión (Bridge Extension popup + panel InsightLens) | `public/extension.html` | `/extension.html` |
| 04A–C | Extensión — frames alternos por estado | `extension.html?state=base\|verificado\|alucinacion` | `/extension.html?state=...` |

## Pantalla 03 — Aprender (móvil)

La pantalla 03 es un **prototipo navegable, ejecutable y aislado** diseñado para iPhone 15 (390×844, light). No modifica las pantallas 01/02 ni los archivos de `_original/`.

**Archivos:**
- `public/mobile.html` — Markup, sprite SVG, modales (racha/logro), toasts/confeti, captions.
- `public/css/mobile.css` — Estilos móviles: carrusel swipeable, ilustración SVG animada, quiz, barras, tabbar, sheets, hit-areas ≥44px, reduce motion, `[hidden]`.
- `public/js/mobile.js` — Interacciones: swipe con spring, quiz (correcto/incorrecto/retry/hint), XP count-up con `xpValue` lógico, modales, tabs, toasts, confeti, haptics, `?state=`, API `window.mlMobile` (`setCard/getCard/next/prev/openSheet/closeSheets/setFrame/getFrame/xp/xpDom/isAnswered/version`).
- Integración shell: `src/App.tsx` (vistas `design|learning|mobile|extension`, selector de 4 frames con persistencia `ml-frame`, iframe con `is-light` para mobile), `src/styles/global.css` (estilos del selector de frames).

**Cómo usar los frames `?state=`:**
- Acierto (base): `/mobile.html?state=acierto` — B correcta, +50 XP, sin sheets.
- Incorrecto: `/mobile.html?state=incorrecto` — A roja, B revelada, shake, "Ver pista", scroll al quiz, XP sin otorgar.
- Racha: `/mobile.html?state=racha` — hoja `#ml-sheet-racha` abierta (Maki `think`, "¡Tu progreso sigue creciendo!"), foco en CTA.
- Logro: `/mobile.html?state=logro` — hoja `#ml-sheet-logro` abierta ("¡Bien hecho! Fase 1 superada"), medalla `.medal--unlocked`, +100 XP al abrir (1,570 lógico).

El shell React permite cambiar entre estos 4 frames desde el selector superior cuando `view === 'mobile'`.

**Notas de coherencia:** `Fase 1 · 80% completada` junto a 3/4 segmentos se mantiene tal como en el brief (ver `MOBILE.md`). XP base `1,420`; incrementos se demuestran interactivamente. Medalla requiere `.medal--unlocked`.

### IA de acompañamiento (pantalla 03)

La pantalla 03 se revisó para funcionar como **acompañamiento y no como evaluación** para cualquier estudiante (no solo ingeniería de sistemas):

- **Error que acompaña**: «Casi lo tienes… equivocarse forma parte de aprender» + «No te preocupes. Te ayudo a razonar paso a paso: extraer mínimo cuesta log V y relajar E aristas.»
- **Andamiaje progresivo**: primero el *porqué* en lenguaje llano, después la fórmula `O((V + E) log V)`.
- **Analogías cotidianas**: GPS, atajo a pie, urgencias, descuento en la factura.
- **Racha sin presión**: «¡Tu progreso sigue creciendo!», CTA «Repasar 1 tarjeta · 30 s (sin prisa)» y salida «Ahora no, gracias».

## Pantalla 04 — Ecosistema de extensión (Bridge Extension + InsightLens)

La pantalla 04 es un **prototipo navegable, ejecutable y aislado** de 1440×900 (light) que compone el escenario real de uso: una **pestaña de ChatGPT simulada** (decorativa), atenuada al 40 %, sobre la que aparecen dos componentes de la extensión MakerLearn.

**Archivos:**
- `public/extension.html` — Markup, sprite SVG propio (10 símbolos), pestaña ChatGPT simulada, popup Bridge, panel InsightLens, toasts, confeti, tooltips.
- `public/css/extension.css` — Glassmorphism AA (overlay sólido al 92 % + blur), semáforos con pulso, borde pulsante de alucinación, chips, checklist, plegado, wink de Maki, reduce motion, `[hidden]`.
- `public/js/extension.js` — Estados y datos (citas renderizadas de `BASE_CITES`/`CITE_SETS`), acciones de cita, toggle, plegado, copia de prompts, checklist, envío, Esc, confeti, escalado a 1440×900, API `window.mlExtension`.
- Integración shell: `src/App.tsx` (vista `extension`, selector de 3 frames con persistencia `ml-ext-frame`), `src/styles/global.css`.

**Componente A — Bridge Extension** (popup 380×280, abajo-derecha, entrada slide-up + fade con rebote):
- Header: logo + Maki + «Aprender este tema en MakerLearn» + cerrar (Esc).
- «Detectamos un tema que ya está en tu ruta: “Algoritmo de Dijkstra con priority_queue”».
- Mini-preview de 3 fases (✅ completada · 🔵 siguiente · 🔒 bloqueada).
- CTA «🚀 Abrir itinerario de 3 fases» + enlace «Solo verificar fuentes».

**Componente B — InsightLens** (panel 320 px anclado a la derecha):
1. **Semáforo de fiabilidad de citas** — 🟢 Cormen (*Introduction to Algorithms*) + badge CrossRef + [Ver paper]; 🟡 Dijkstra (1959) «revisa DOI»; 🔴 «Smith, J. (2021). Deep Dijkstra Optimization. IEEE.» inexistente + «Reportar al modelo». Contador «3 fuentes · 1 verificada · 1 ambigua · 1 falsa» con mini-barra.
2. **Desglose de código** — tooltip/ficha con «Complejidad: O((V + E) log V)», «Dependencias: `<queue>`, `<vector>`» y «Explicar con analogía».
3. **Prompts socráticos** — 4 chips que se copian al portapapeles.
4. **Checklist pre-entrega** — 4 filas con progreso accesible.
- Footer «📤 Enviar a MakerLearn Fase 3».

**Frames:**
- `?state=base` (por defecto) — auditoría mixta: 1 verificada + 1 ambigua + 1 falsa.
- `?state=verificado` — las 3 fuentes en verde, confeti y «Estás listo para entregar ✅».
- `?state=alucinacion` — fuente roja con borde pulsante y «No entregues esta cita sin verificar».

El shell React permite cambiar entre estos 3 frames desde el selector superior cuando `view === 'extension'`.

**Accesibilidad:** overlay sólido al 92 % en el cristal para garantizar contraste AA sobre el fondo oscuro (13 ratios comprobados por variante, todos ≥4.5), `aria-pressed`/`aria-expanded`/`aria-live`/`role="alert"` en estados, navegación completa por teclado, `Escape` cierra el popup, y datos **100 % ficticios** (la cita de Smith es deliberadamente inventada para representar una alucinación).

## IA de acompañamiento (transversal a todas las pantallas)

Requisito de producto: que MakerLearn acompañe a **cualquier estudiante** (no solo a perfiles de ingeniería de sistemas) con andamiaje, tono empático, lenguaje llano y recuperación ante errores. Estado por pantalla:

| Pantalla | Estado | Qué se hizo |
|---|---|---|
| 01 · Sistema de diseño | Sin cambios | Se deja intacta para preservar la fidelidad 1:1 del artefacto original. El nuevo estado `wink` de Maki se documenta en `EXTENSION.md` (no se altera el doc de sistema). |
| 02 · Ruta Activa | Acompañamiento aplicado | Ver abajo. |
| 03 · Aprender | Acompañamiento aplicado | Microcopy empático, andamiaje progresivo, analogías cotidianas y racha sin presión. |
| 04 · Extensión | Diseñada como acompañante | InsightLens audita citas y alucinaciones, da prompts socráticos, checklist pre-entrega y avisos no punitivos. |

**Pantalla 02 — `public/js/screen.js`** (el andamiaje ya existía; se corrigió el tono para que no se sienta como castigo):

- **Pista gratuita antes del coste en XP**: al fallar una prueba, Maki da un **empujón gratis** explícito («Antes de gastar XP, te dejo un empujón gratis…») y un toast informativo «Empujón gratis de Maki · Sin coste de XP».
- **Error normalizado**: el mensaje abre con «No pasa nada, equivocarse es parte de aprender» y aclara que el problema es un detalle fino, no un fallo conceptual.
- **Análisis de Maki sin culpa**: «Buenas noticias: la lógica base es correcta… no un error tuyo de concepto» + invitación a pedir ayuda («dime “no sé” y te doy un empujón sin coste»).
- **Chat socrático más acogedor**: la respuesta a «no sé / perdido / bloqueado» empieza con «Tranquilo, es normal atascarse aquí» y el fallback ofrece una pista sin coste.
- **Pistas opcionales, no obligatorias**: los avisos de desbloqueo pasan de «Al abrirla se descuentan XP» a «…ya puedes abrirla **si la necesitas**. Solo entonces se descuentan XP», y las notas añaden «(Pista 2 disponible si la necesitas)».

## Why an iframe wrapper

The original artifacts are complete, production-quality vanilla HTML/CSS/JS with 700+ lines of stateful interactions. Hosting originals in a same-origin iframe gives:
- **1:1 visual fidelity** — no drift in spacing, color, motion or focus rings.
- **1:1 interaction fidelity** — original `app.js` and the authored `screen.js`/`mobile.js`/`extension.js` run against the original/isolated markup and CSS.
- **Isolated React shell** — switcher bar and layout live in React without touching the screens.

## Project layout

```
/
├── public/
│   ├── design.html          # original index.html (screen 01)
│   ├── app.html             # original app.html + brief-tail markup (screen 02)
│   ├── mobile.html          # screen 03 (micro-learning móvil)
│   ├── extension.html       # screen 04 (Bridge Extension + InsightLens)
│   ├── css/
│   │   ├── tokens.css        # design tokens (dark + light) — untouched
│   │   ├── system.css        # design-system components — untouched
│   │   ├── app.css           # learning-screen styles — untouched
│   │   ├── screen.css        # brief-tail overrides/additions (new)
│   │   ├── mobile.css        # screen 03 styles (new)
│   │   └── extension.css     # screen 04 styles (new)
│   └── js/
│       ├── app.js            # design-system interactions (screen 01)
│       ├── screen.js         # interactions for screen 02 (authored)
│       ├── mobile.js         # interactions for screen 03 (authored)
│       └── extension.js      # interactions for screen 04 (authored)
├── src/                     # React shell (switcher + frame selector + persistence)
└── dist/                    # Build output (includes mobile.html / extension.html + their css/js)
```

## Getting started

```bash
npm install
npm run dev        # start dev server
npm run build      # build to dist/
npm run preview    # preview build
```

## QA Checklist (Pantalla 03)
- [ ] Dispositivo iPhone 15 (390×844), viewport ≤430px — sin scroll en body, solo `#ml-main`.
- [ ] Tema claro, `data-theme="light"`. Respeta reduce motion.
- [ ] Progreso: 4 segmentos, 3 llenos, `Fase 1 · 80% completada`, "Tarjeta 3 de 4".
- [ ] Carrusel swipeable (horizontal), dots sincronizados, `aria-hidden` correcto, `--i` 0-based.
- [ ] Ilustración SVG: halo pulsante, `edge-path` animada, 5 nodos, 6 pesos visibles (tarjeta 3).
- [ ] Quiz: A O(V²), B O((V+E) log V), C O(V·E). Correcto: B verde + check, banner, confeti, +50 XP (lógico). Incorrecto: A coral, B revelada, shake, "Ver pista", hintBox, scroll, sin XP.
- [ ] Acciones: ← Anterior, "Guardar para Web 💻" (toggle + aria-pressed), Continuar → (gradiente). ≥44px.
- [ ] Tabbar: Inicio/Ruta/Repaso/Perfil; Ruta activo violeta. Repaso abre hoja racha sin robar activo.
- [ ] Modales: Racha (Maki `think`, CTA enfocado) y Logro (`.medal--unlocked`, +100 XP → 1,570). Cierre por X/scrim/Esc.
- [ ] Toques ≥44px (acciones/tabs/quiz-opt), dots ≥28px, avatar ≥36px. Contraste AA.
- [ ] Frames `?state=` funcionan; shell selector sincroniza caption + iframe.

## QA Checklist (Pantalla 04)
- [ ] Lienzo exacto 1440×900, escalado de seguridad con mínimo 0.42; tema claro.
- [ ] Pestaña ChatGPT simulada con scrim de atenuación al 40 %.
- [ ] Bridge popup de 380 px (alto ≥280) abajo-derecha, separado 24 px del panel, con logo + Maki + título + cerrar.
- [ ] 3 fases (✅/🔵/🔒), CTA «🚀 Abrir itinerario de 3 fases» y enlace «Solo verificar fuentes»; `Escape` cierra.
- [ ] InsightLens de 320 px anclado a la derecha: 3 citas con semáforos 🟢/🟡/🔴, badges (CrossRef / DOI pendiente / No encontrada) y acciones contextuales.
- [ ] Contador «3 fuentes · 1 verificada · 1 ambigua · 1 falsa» + mini-barra de 3 segmentos.
- [ ] Desglose de código con tooltip (complejidad, dependencias, analogía) activo en hover/focus/clic.
- [ ] 4 chips socráticos que copian su prompt; checklist de 4 filas con progreso `x/4`.
- [ ] Footer «📤 Enviar a MakerLearn Fase 3» con aviso no punitivo si hay fuentes sin verificar.
- [ ] Microinteracciones: entrada con rebote, pulso de semáforos, borde pulsante de alucinación, tooltip de metadatos, **Maki guiña el ojo al verificar**, confeti y toasts.
- [ ] Contraste AA sobre glassmorphism (overlay al 92 %), navegación por teclado, `aria-*` anotados, datos ficticios.

## QA Checklist (Pantalla 02 · acompañamiento)
- [ ] Al fallar el test 04, Maki muestra «No pasa nada, equivocarse es parte de aprender» y un **empujón gratis**.
- [ ] Toast «Empujón gratis de Maki · Sin coste de XP» aparece antes de cualquier descuento.
- [ ] «Analizar con Maki» con un test fallido no culpabiliza y ofrece «dime “no sé” y te doy un empujón sin coste».
- [ ] Chat socrático: «no sé / perdido / bloqueado» responde con tono tranquilizador y pista sin coste.
- [ ] Las pistas se presentan como opcionales («si la necesitas») y los avisos no presionan.
- [ ] Variante `?state=fallido`: pista 2 libre, `RE` en el test 2, pista 3 con tooltip, sin errores de consola.

## Verificación headless
- Pantalla 02 — harness: `dist/__smoke.html`; script: `smoke.ps1` (HTTP + `data-enhanced`, variante `?state=fallido`, interacciones y consola).
- Pantalla 03 — harnesses: `dist/__mobile.html`, `dist/__shell.html`; scripts: `run-mobile.ps1`, `run-shell-shots.ps1`, `parse-mobile.js`, `parse-shell.js`.
- Pantalla 04 — harness: `dist/__ext.html`; scripts: `run-ext.ps1`, `parse-ext.js`. Escalado responsive: `dist/__extfit.html` + `run-extfit.ps1`, `parse-extfit.js`.
- Estado: **358/358** (mobile, 4 frames) + **325/325** (extension, 3 frames) + **65/65** (escalado responsive de la extensión en 5 viewports) + **48/48** (shell), consola limpia. Capturas en `mob/shot-*.png` y `mob/ext-*.png`.

Ver `MOBILE.md` y `EXTENSION.md` para los handoffs completos de Figma (capas, tokens, medidas, wiring, estados alternos, accesibilidad y QA).

## Nota sobre Figma MCP

No hay servidor MCP de Figma disponible en este entorno, por lo que las pantallas 03 y 04 se entregan como **prototipos navegables ejecutables** junto a sus documentos de handoff (`MOBILE.md`, `EXTENSION.md`) con el árbol de capas, tokens, componentes/variantes, medidas, wiring y microinteracciones listos para replicar en Figma.