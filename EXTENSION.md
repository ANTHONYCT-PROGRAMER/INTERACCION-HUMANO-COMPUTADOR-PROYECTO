# EXTENSION.md — Handoff Figma: Pantalla 04 «Ecosistema de extensión» (Bridge + InsightLens)

## 1. Referencia del prototipo ejecutable
- HTML: `public/extension.html`
- CSS: `public/css/extension.css`
- JS: `public/js/extension.js`
- Integración shell: `src/App.tsx`, `src/styles/global.css`
- Build: `dist/extension.html`, `dist/css/extension.css`, `dist/js/extension.js`

El prototipo es **autónomo y aislado** (pantalla 04 únicamente). No se modifica ningún archivo original (`_original/` intacto) ni las pantallas 01–03. Se reutilizan `css/tokens.css` y `css/system.css` tal como existen en el proyecto.

## 2. Escenario, viewport y tema
- Lienzo: **1440 × 900 px** (el `.xl-screen` interior se mide exacto a 1440×900).
- El lienzo se presenta centrado y con **escalado de seguridad** (`fit()`): `min(1, (ancho−44)/1440, (alto−132)/900)`, con mínimo 0.42. A 1560×1140 el factor es **1.0** (verificado).
- Fondo: **pestaña de ChatGPT simulada** (riel de conversaciones + hilo + composer, decorativa) sobre la que se aplica un **scrim de atenuación del 40 %** (`.xl-dim`, `rgba(9,10,16,0.40)` — verificado por harness).
- Tema: el documento fija `<html data-theme="light">`. **No se redefine el cristal en `prefers-color-scheme: dark`**: hacerlo invertía el contraste del texto oscuro sobre el panel (regresión detectada y corregida; ver §9).
- Movimiento reducido: `@media (prefers-reduced-motion: reduce)` desactiva entrada del popup, pulso de semáforos, borde pulsante de alucinación, confeti, toasts y transición de plegado.

## 3. Estructura del árbol de capas (Figma)

```
Frame 04 · "Auditoría mixta" (estado base) — 1440×900
├─ Stage (fondo #0B0D14 con gradientes violeta/mint)
│  ├─ Caption ("MakerLearn · Ecosistema de extensión · 1440×900 · Estado: …")
│  └─ Screen 1440×900 (radio 18, sombra profunda, clip)
│     ├─ Layer 1 · ChatGPTMock (decorativo, aria-hidden)
│     │  ├─ Rail 260px (marca "AI Chat", 5 conversaciones, usuario "AR · Ana Ríos")
│     │  ├─ Thread
│     │  │  ├─ TopBar (título + pill "Modelo IA · v4")
│     │  │  ├─ Turn Usuario (burbuja gris: pide Dijkstra con priority_queue + referencias)
│     │  │  ├─ Turn IA (texto + citas subrayadas `.xl-cite` / `.xl-cite--bad`)
│     │  │  │  └─ CodeBlock `.xl-code` (barra de 3 luces + `dijkstra.cpp`, resaltado k/t/f/c/n)
│     │  │  └─ Composer (input simulado + botón enviar circular)
│     ├─ Layer 2 · Scrim `.xl-dim` (atenuado 40 % sobre el mock)
│     ├─ Layer 3 · Componente A · Bridge Extension (popup 380×280, abajo-derecha)
│     │  ├─ Header: Logo (grad-brand) + Maki 34×34 + Título "Aprender este tema en MakerLearn" + Cerrar (34 + ::after)
│     │  ├─ Detect: "Detectamos un tema que ya está en tu ruta: «Algoritmo de Dijkstra con priority_queue»"
│     │  ├─ PhasePreview (3 filas):
│     │  │  ├─ Fase 1 · Fundamentos y complejidad — ✅ Completada
│     │  │  ├─ Fase 2 · Implementación con montículo — 🔵 Siguiente
│     │  │  └─ Fase 3 · Optimización y casos límite — 🔒 Bloqueada
│     │  └─ CTA: [🚀 Abrir itinerario de 3 fases] (primary full-width 46px)
│     │     └─ Alt link: "Solo verificar fuentes"
│     └─ Layer 4 · Componente B · InsightLens (panel 320px anclado derecha)
│        ├─ Header: Marca (escudo) + "InsightLens" / "Auditor en tiempo real" + Toggle "Activo" + Plegar
│        ├─ Avisos de estado (un solo frame visible a la vez)
│        │  ├─ `#xl-alert-ok`  «Estás listo para entregar ✅» (mint)
│        │  └─ `#xl-alert-bad` «No entregues esta cita sin verificar.» (coral, role=alert)
│        ├─ §1 Semáforo de fiabilidad de citas
│        │  ├─ Card 🟢 VERIFICADA · Cormen, T. H. — Introduction to Algorithms (3rd ed.)
│        │  │  └─ badge CrossRef + [Ver paper] + tooltip (DOI/ISBN/coincidencias)
│        │  ├─ Card 🟡 AMBIGUA · Dijkstra, E. W. (1959) — A note on two problems…
│        │  │  └─ badge "DOI pendiente" + [Revisar DOI]
│        │  ├─ Card 🔴 ALUCINACIÓN DETECTADA · Smith, J. (2021). Deep Dijkstra Optimization. IEEE.
│        │  │  └─ badge "No encontrada" + [Reportar al modelo]
│        │  └─ Tally "3 fuentes · 1 verificada · 1 ambigua · 1 falsa" + MiniBar (3 segmentos)
│        ├─ §2 Desglose explicativo de código
│        │  ├─ CodeMini con la función `dijkstra(int src)` (botón `.xl-fn`)
│        │  └─ Ficha `.xl-tip`: Complejidad `O((V + E) log V)` · Dependencias `<queue>` `<vector>` · Memoria hasta E entradas · [Explícalo con una analogía]
│        ├─ §3 Generador de prompts socráticos (4 chips)
│        │  ├─ "Pídele que optimice memoria"
│        │  ├─ "Pregunta por vulnerabilidades SQL"
│        │  ├─ "Solicita casos límite (edge cases)"
│        │  └─ "Pide contraejemplo donde falle"
│        ├─ §4 Checklist pre-entrega (4 filas ≥40px)
│        │  ├─ ☑ Pruebas unitarias ejecutadas
│        │  ├─ ☐ Redacción parafraseada
│        │  ├─ ☐ Fuentes verificadas (2 de 3 pendientes)
│        │  └─ ☐ Comprendo cada línea (auto-evaluación)
│        │  └─ Progreso "x/4" (aria-live)
│        └─ Footer: [📤 Enviar a MakerLearn Fase 3] + nota de privacidad
│        └─ Overlays dentro del lienzo: Toasts (`.xl-toasts`) y Confeti (`.xl-confetti`)

Frame 05 · "Todo verificado" (?state=verificado)
├─ Las 3 tarjetas §1 en 🟢 VERIFICADA (badge CrossRef, acciones "Ver paper")
├─ MiniBar con 3 segmentos mint · Tally "3 fuentes · 3 verificadas · 0 ambiguas · 0 falsas"
├─ Aviso `#xl-alert-ok` visible · confeti al cargar
└─ Checklist: "Fuentes verificadas" marcada (progreso 2/4)

Frame 06 · "Alucinación crítica" (?state=alucinacion)
├─ Se mantiene la card roja de §1, ahora con `.is-alert` → **borde pulsante** coral
├─ Aviso `#xl-alert-bad` visible (role="alert") + toast de error al entrar
└─ Tally "3 fuentes · 1 verificada · 1 ambigua · 1 falsa"
```

## 4. Tokens, colores y componentes reutilizados
- **Tokens** (`css/tokens.css`, `[data-theme="light"]`): `--surface`, `--surface-2/3`, `--surface-inset`, `--line/-soft/-strong`, `--text/-2/-3`, `--violet-*`, `--mint-*`, `--amber-*`, `--coral-*`, `--focus-ring`, `--focus-halo`, `--grad-brand`, `--shadow-sm/md/lg/glow`, `--radius-*`, `--ease-out`, `--ease-spring`, `--dur-*`.
- **Componentes del sistema** (`css/system.css`): `.btn` (`.btn--primary`, `.btn--secondary`, `.btn--sm`), `.badge badge--mint|violet|amber|coral`, `.maki` / `.maki__eyes-open|happy|think` (se añade `.maki__eyes-wink`), `.toast` (estilo local `.xl-toast`).
- **Regla local obligatoria**: `[hidden]{display:none!important}` y `.sprite{position:absolute;width:0;height:0;overflow:hidden}` (en las pantallas 01–02 lo oculta `app.css`, que esta pantalla no carga).
- **Iconos**: sprite SVG propio en `extension.html` (`<svg class="sprite">`) con 10 símbolos: `i-graduation`, `i-x`, `i-chevron-right`, `i-check`, `i-link`, `i-search`, `i-info`, `i-sparkles` (extraídos de `design.html`) + `i-shield` y `i-alert` (nuevos). Los `svg` de línea replican el trazo de `.icon` (fill none / stroke currentColor / 1.75).

## 5. Medidas, espaciados y diseño
- Lienzo 1440×900; radio 18; `.xl-dim` a `inset:0`.
- **Bridge**: `width:380px`, `min-height:280px` (alto real ≈359 con contenido), `right:344px` (24px de separación con el panel de 320px), `bottom:26px`; radio 18; padding 16/16/14; gap 10.
- **InsightLens**: `width:320px`, anclado `top/right/bottom:0`; header ~72px; cuerpo con scroll propio (`overflow-y:auto`, `overscroll-behavior:contain`); footer fijo.
- **Glassmorphism AA**: `.xl-glass` = `background: rgba(255,255,255,0.92)` + `backdrop-filter: blur(20px) saturate(150%)`. El **overlay sólido al 92 %** es el que garantiza contraste AA sobre el fondo oscuro (verificado: alpha 0.92 y ratios ≥4.5 en §9). Borde violeta + doble sombra + halo (`0 0 34px -8px rgba(139,92,246,.55)`).
- **Áreas de toque/golpe**: botones y filas ≥40–46px; `.xl-bridge__close`, `.xl-collapse`, `.xl-toggle`, `.xl-linkbtn`, `.xl-chip` usan `::after` para ampliar el hit-area sin cambiar el layout.
- **Tipografía**: tamaños 10–15px en el panel, 12.5–14.5px en el popup; `--font-mono` para metadatos bibliográficos y código.

## 6. Interacciones, estados y lógica
- **Entrada del Bridge**: `@keyframes xl-bridge-in` — slide-up 46px + fade con rebote (`cubic-bezier(0.22,1.2,0.3,1)`, 620 ms). Reduce motion lo omite. *(Efecto medido: a mitad de animación `scale(1.008)`.)*
- **Semáforos**: `.xl-sema::after` con `@keyframes xl-pulse` (2.1 s), uno por card según `data-sev` (ok/warn/bad → mint/amber/coral).
- **Hover/focus en citas**: `mouseover`/`focusin` sobre `[data-tip]` fija `title` con los metadatos (DOI, ISBN, coincidencias). El título de la cita es `tabindex="0"` para teclado.
- **Acciones de cita**: `[data-act="open"]` → toast informativo + guiño de Maki; `[data-act="report"]` → toast de advertencia ("Reportado al modelo").
- **Panel colapsable**: `#xl-collapse` alterna `.is-collapsed` en `#xl-panel` (`translateX(288px)`), sincroniza `aria-expanded` y su `aria-label`. Al colapsar se oculta cuerpo y footer con `visibility:hidden`.
- **Toggle "Activo"**: `aria-pressed` true/false, etiqueta "Activo"/"En pausa", `aria-label` "Auditoría activa"/"Auditoría en pausa" + toast.
- **Desglose de código**: `.xl-fn` (botón) añade `.is-active` a `.xl-tip` en hover/focus, y `.is-pinned` al hacer clic. `aria-describedby="xl-tip"`.
- **Chips socráticos**: al pulsar, `navigator.clipboard.writeText(prompt)` + clase `.is-copied` (1.4 s) + toast con el texto si el portapapeles no está disponible.
- **Checklist**: cambio de estado recalcula "x/4" (`aria-live="polite"`); al completar los 4 → confeti + toast.
- **Footer**: si hay fuentes warn/bad → toast de aviso (permite enviar igual, tono no punitivo); si todo está verificado → confeti + toast de éxito.
- **Bridge CTAs**: "Abrir itinerario de 3 fases" → toast + guiño; "Solo verificar fuentes" → cierra el popup, despliega el panel, hace scroll a §1 y emite toast.
- **Teclado**: `Escape` cierra el popup; todos los controles son `<button>`/`<input>` nativos con `:focus-visible` (outline violeta 2px + offset 2px).
- **API de QA**: `window.mlExtension = { version:"1.0.0", setFrame, getFrame, setToggle, isToggleOn, toggleCollapse, isCollapsed, citeSeverities, tally, checkProgress, isBridgeOpen, closeBridge, toastCount, confettiRuns, makiState, grouped }`.
- **States por query**: `?state=base` (por defecto) · `?state=verificado` (alias `todo-verificado`, `ok`) · `?state=alucinacion` (alias `critica`).

## 7. Microinteracciones (resumen)
| Microinteracción | Implementación |
|---|---|
| Entrada slide-up + fade con rebote | `xl-bridge-in` (620 ms, overshoot 1.008) |
| Pulso de semáforos | `xl-pulse` en `.xl-sema::after`, color según `data-sev` |
| Borde pulsante de alucinación | `.xl-cite-card[data-sev="bad"].is-alert` → `xl-alert` (box-shadow 0→4px) |
| Tooltip de metadatos en citas | `mouseover`/`focusin` → `title` |
| Ficha de código reactiva | `.xl-tip.is-active` (hover/focus), `.is-pinned` (clic) |
| Chip copiado | `.xl-chip.is-copied` (mint) + copia al portapapeles |
| **Maki guiña el ojo al verificar** | `.maki[data-state="wink"]` 1 s (ojos wink) |
| Toasts | `xl-toast-in`/`xl-toast-out`, auto-cierre 3.4 s |
| Confeti | `.xl-confetti__bit` con `--xl-cf-x`/`--xl-cf-dur` aleatorios, 46–34 piezas |
| Plegado del panel | `translateX(288px)` 320 ms `--ease-out` |

## 8. Accesibilidad
- **Contraste AA**: overlay sólido al 92 % en el cristal; verificación con 13 comprobaciones de ratio (todas ≥4.5) en las 3 variantes (§9).
- **Estructura**: `<aside aria-labelledby>` para el panel, `<section aria-labelledby>` por bloque con `<h3>` numerado, `<ul>/<li>` para las citas, `role="group"` en los chips, `role="img"` + `aria-label` en la mini-barra y en el semáforo agregado.
- **Estados anunciados**: `aria-pressed` (toggle), `aria-expanded`/`aria-controls` (plegado), `aria-live="polite"` (progreso de checklist, toasts), `role="alert"` (aviso de alucinación + toast de error), `role="status"` (aviso de éxito).
- **Etiquetas anotadas**: cada acción de cita incluye `aria-label` con el nombre de la fuente; el cierre del popup, el plegado y el toggle tienen etiquetas explícitas.
- **Navegación por teclado**: Tab recorre popup → panel; `Escape` cierra el popup; foco visible en todo (`:focus-visible`); los hit-areas ampliados con `::after` no rompen el orden de tabulación.
- **Reduced motion**: todas las animaciones se desactivan; el estado de alucinación mantiene un halo estático en lugar del pulso.
- **Datos**: 100 % ficticios. La cita "Smith, J. (2021)… IEEE" es **deliberadamente inventada** para representar una alucinación; Cormen y Dijkstra(1959) son referencias reales usadas solo como ejemplo de citación.

## 9. Parámetros de test/QA (verificación headless)
- Chrome headless (`--dump-dom`, `--virtual-time-budget=7000`), 3 variantes, sobre iframe 1520×1080 para que el escalador quede en **factor 1.0** y el lienzo se mida exacto a 1440×900.
- Comprobado: geometría (lienzo 1440×900, bridge 380 y separación 344 al panel, panel 320 anclado a la derecha), scrim alpha 0.40, cristal alpha 0.92, 3 citas + 3 segmentos de barra, 4 bloques, 4 chips, checklist 4 (progreso 1/4 base, 2/4 en verificado), tooltip de código con `O((V + E) log V)` y `<queue>`/`<vector>`, toasts/confeti por contador, guiño de Maki, plegado y toggle, Escape, ausencia de scroll horizontal, `overflow-y:auto` en el panel, **20 comprobaciones de recorte de texto** (`scrollWidth/scrollHeight` sobre títulos, notas, etiquetas, badges, CTA, fases, avisos y tooltip), **3 comprobaciones de contención de layout** (chips en su fila, acciones de cita y botón del footer dentro de su contenedor) y **13 comprobaciones de contraste AA** por variante.
- Resultados: **325/325** comprobaciones superadas (base 123, verificado 100, alucinación 102), consola limpia en las 3 variantes.
- Shell React: **48/48** comprobaciones (switcher de 4 vistas, selector de 3 frames de extensión, iframe sin `is-light`, navegación 03→04 y cambio a «Alucinación crítica»).
- **Escalado responsive**: harness `__extfit.html` a 5 viewports (1024×768, 1280×720, 1440×900, 1560×1140, 1920×1080) → **65/65** comprobaciones: factor entre 0.653 y 1.0, `.xl-scaler` y `.xl-screen` coherentes con el factor, sin scroll horizontal ni vertical, ambos componentes visibles y consola limpia.
- Regresión detectada y corregida durante la verificación: el bloque `@media (prefers-color-scheme: dark)` sobre `.xl-glass` invertía el contraste del texto oscuro (ratio 1.06) porque la pantalla está fijada a `data-theme="light"`. Eliminado.
- Capturas: `mob/ext-base.png`, `mob/ext-verificado.png`, `mob/ext-alucinacion.png`.
- QA manual sugerido: hover/focus real en citas y en `dijkstra()`, teclado completo, `prefers-reduced-motion` activo, escalado a 1280×720 y a 1920×1080.

## 10. Nota sobre Figma MCP
**No existe servidor MCP de Figma disponible** en este entorno. Por ello se entrega este **prototipo navegable ejecutable** (`extension.html` + CSS/JS) + este `EXTENSION.md` (árbol de capas, tokens, componentes/variantes, medidas 1440×900, wiring, estados alternos y microinteracciones). El equipo de diseño puede importar/exportar directamente desde este handoff para replicar con precisión en Figma (autolayout, componentes, variables/tokens, overrides).
