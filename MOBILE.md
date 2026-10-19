# MOBILE.md — Handoff Figma: Pantalla 03 «Aprender» (Micro-learning · Fase 1)

## 1. Referencia del prototipo ejecutable
- HTML: `public/mobile.html`
- CSS: `public/css/mobile.css`
- JS: `public/js/mobile.js`
- Integración shell: `src/App.tsx`, `src/styles/global.css`
- Build: `dist/mobile.html`, `dist/css/mobile.css`, `dist/js/mobile.js`

El prototipo es **autónomo y aislado** (pantalla 03 únicamente). No se modifica ningún archivo original (`_original/` intacto). Se reutilizan `css/tokens.css` y `css/system.css` tal como existen en el proyecto.

## 2. Dispositivo, viewport y tema
- Dispositivo objetivo: **iPhone 15**
- Viewport: **390×844 px** (ancho × alto)
- Escala de seguridad: ≤ 430px (responsive down). `.ml-main` es el único contenedor con scroll interno; `body` no hace scroll.
- Tema: claro (`<html data-theme="light">`). Respeta `prefers-color-scheme: dark` a nivel de tokens si el sistema lo solicita (los tokens ya definen variantes). 
- Soporte de movimiento reducido: `@media (prefers-reduced-motion: reduce)` — desactiva animaciones/transiciones/scroll suave y reduce confeti/parpadeo Maki/Xp.

## 3. Estructura del árbol de capas (Figma)
Recomendado organizar capas por secciones, con componentes y autolayout:

```
Frame 01 · "Acierto (+50 XP)" (estado base)
├─ StatusBar (iOS) — tiempo "9:41", 3 iconos (señal, wifi, batería)
├─ Topbar
│  ├─ Brand (logo mini + "MakerLearn Studio")
│  ├─ Streak (🔥 5)
│  ├─ XP (1,420)
│  └─ Avatar (AR) + hitarea 36×36 (::after)
├─ HeaderProgreso
│  ├─ Title "Dijkstra en Grafos"
│  ├─ Subtitle "Fase 1 · 80% completada"
│  ├─ ProgressSegments (4 segmentos, 3 llenos) — aria-valuenow=3
│  └─ Count "Tarjeta 3 de 4"
├─ Carousel (ml-viewport)
│  ├─ Track (translate3d con --i)
│  ├─ Card 01 (tarjeta conceptual)
│  ├─ Card 02
│  ├─ Card 03 — activa (default)
│  │  ├─ Illustration (SVG: grafo, nodos A–E, aristas con pesos 2/6/3/5/1, nodo D destacado + halo + edge-path animados)
│  │  ├─ Title "¿Por qué una cola de prioridad?"
│  │  ├─ Body (≤ 40 palabras)
│  │  ├─ Analogy (chip amber) "Analogía: en urgencias se atiende primero a quien tiene mayor urgencia 🏥"
│  │  └─ CTA "💡 Ver ejemplo"
│  └─ Card 04
├─ Dots (4 puntos, dot 3 activo)
├─ QuizCard
│  ├─ Top (badge "Pregunta 3" + pill XP "50XP" violeta)
│  ├─ Question "¿Cuál es la complejidad temporal con montículo binario?"
│  ├─ Options (3 pills): A O(V²), B O((V+E) log V) ✓, C O(V·E)
│  ├─ Feedback (banner correcto/incorrecto) + icon + retry/hint
│  └─ HintBox (revelado en incorrecto)
├─ ActionsBar (fijo)
│  ├─ Btn Ghost "← Anterior"
│  ├─ Btn Secondary "Guardar para Web 💻" (togglable .is-saved + aria-pressed)
│  └─ Btn Primary Gradient "Continuar →"
├─ TabBar (4 tabs): Inicio, Ruta (activo), Repaso, Perfil
├─ Modals (hojas laterales/bottom sheets)
│  ├─ Scrim (#ml-scrim)
│  ├─ SheetRacha (#ml-sheet-racha) — Maki "think" + CTA "Repasar 1 tarjeta · 30 s (sin prisa)"
│  └─ SheetLogro (#ml-sheet-logro) — Medalla "Maestro del montículo" (medal--unlocked) + CTA "Compartir logro"
└─ Overlays (confetti, toasts)

Frame 02 · "Incorrecto" (estado alterno a)
├─ Quiz: Opción A marcada roja (.quiz-opt.is-wrong), B revelada verde (.quiz-opt.is-correct)
├─ Feedback: "Casi lo tienes… equivocarse forma parte de aprender" + 2ª línea "No te preocupes. Te ayudo a razonar paso a paso…", icon X, botón "Ver pista" visible
├─ HintBox oculto inicialmente → visible al pulsar pista
├─ Sin sheets abiertas; scroll automático al bloque del quiz
└─ XP permanece 1,420 (sin otorgar)

Frame 03 · "Racha" (estado alterno b)
├─ SheetRacha abierto, scrim visible, foco en CTA (comportamiento accesible)
├─ Maki avatar en estado `data-state="think"` (ojos think visibles, ojos open ocultos)
└─ Quiz en estado correcto (B) para contexto

Frame 04 · "Logro" (estado alterno c)
├─ SheetLogro abierto, scrim visible
├─ Medalla `.ml-medal__stage.medal--unlocked` (anillo mint activo)
└─ XP lógico pasa a 1,570 tras otorgar +100 (animado al abrir logro)
```

## 4. Tokens, colores y componentes reutilizados
- **Tokens**: `css/tokens.css` ([data-theme="light"]). Colores base, violet/mint/coral/amber, superficies, radios, sombras, espaciados.
- **Sistema**: `css/system.css` — componentes `.quiz`, `.quiz-opt`, `.quiz__feedback`, `.medal`, `.btn`, `.chip`, `.badge`, `.maki-avatar`, `.sheet`, `.toast`, etc. 
- **Clases clave heredadas (contrato)**:
  - Quiz: `.quiz.is-shake`, `.quiz.is-pop`, `.quiz-opt.is-correct|is-wrong`, `.quiz__feedback.is-visible.is-correct|is-wrong`, `.quiz__feedback .quiz__icon use[href="#i-check"]|href="#i-x"]`, `.xp.is-bumped`, `.quiz-opt__state` (::before) para "Correcta"/estado.
  - Medalla: `.medal__stage.medal--unlocked` activa anillo/disco mint.
  - Maki: `.maki[data-state="think|open|happy"]`, `.maki__eyes-think`, `.maki__eyes-open` con `display`/transiciones.
  - Carrusel: `.ml-viewport`, `.ml-track` con `--i` (0-based por tarjeta), `--drag`, `.ml-card[aria-hidden]`, `.ml-dots__b[aria-current="true"]`.
- **Utilidades CSS locales** (`mobile.css`): `[hidden]{display:none!important}`, `.ml-strike`, `.ml-weight--bad`, `.ml-flip`, áreas de golpe (`.hit-areas`, reforzadas para dots/avatar/tabbar/acciones).

## 5. Medidas, espaciados, autolayout y diseño
- Status bar iOS: altura típica, alineado a safe area; tiempo `9:41` (referencial).
- Topbar: padding horizontal 12–16, gap entre bloques, avatar 28–36px (hit ≥36px).
- Header progreso: título 16–18px, subtítulo 12–13px, barra segmentada 4 segmentos con gap 4–6px, `is-full` para 3 llenos.
- Carrusel: `.ml-viewport` con `overflow:hidden`, padding vertical para que la sombra de tarjeta respire (evita corte). Track usa `will-change: transform`, `touch-action: pan-y` (swipe horizontal). Transiciones spring con `cubic-bezier(0.25,0.1,0.25,1)`/suavizado por `--drag`.
- Ilustración SVG: viewport interno, nodos con radio 8–10, pesos `.ml-weight` (6 pesos visibles en tarjeta 3), arista `.ml-edge--path` animada (stroke-dashoffset), halo `.ml-halo` con pulso sutil (reduce motion lo desactiva). Nombres A,D,B,C,E según markup.
- Quiz: card con padding 16, opciones ≥44px de alto/táctiles, feedback con icono check/X.
- Acciones: barra fija abajo, botones ≥44px (Prev/Save/Next). `Guardar para Web` es toggle (`.is-saved`, `aria-pressed="true"`).
- Tab bar: 4 tabs ≥44px, `aria-current="page"` en Ruta.
- Modales: sheets con `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, scrim con cierre por Esc/click fuera/foco, CTA enfocado al abrir (focus management con `focusQuietly`).

## 6. Interacciones, estados y lógica
- **Swipes**: detección dominante horizontal (ignora scroll vertical), umbrales de cambio de tarjeta, resistencia en extremos, soporte teclado (← →), `is-dragging`. Índice `--i` 0-based por tarjeta (card 1→0, card 3→2, card 4→3). API: `mlMobile.setCard(index)` (0-based), `getCard()` (1-based).
- **Quiz**:
  - Estados: sin responder → submit habilitado; correcto → feedback `.is-correct`, B `.is-correct`, A no marcado wrong, submit oculto, retry visible, hintBtn oculto; incorrecto → A `.is-wrong`, B revelada `.is-correct`, feedback `.is-wrong`, shake `.quiz.is-shake`, opciones bloqueadas, retry + "Ver pista" visibles, scroll al quiz (`#ml-main` scrollTop > 0).
  - Pseudo-elemento `.quiz-opt__state::before` muestra "Correcta" para la opción correcta (verificado en harness).
- **XP**: valor lógico `xpValue` (fuente de verdad). `bumpXP(delta,title,msg)` usa `xpValue` (evita desfase entre animaciones concurrentes). `xp()` devuelve valor lógico formateado (p.ej. "1,420","1,470","1,570"), `xpDom()` texto del DOM. Animación count-up 700ms (ease-out cúbico), `is-bumped` en `#ml-xp`. 
  - Flujo demostrativo: base 1,420 → +50 al acierto correcto → 1,470 → +100 al abrir Logro (tarjeta 4 → Continuar) → 1,570.
- **Modales/frames por query**: `?state=acierto|incorrecto|racha|logro`. Al cargar, `applyFrame()` setea clases/estado (racha/logro abren sheets + enfocan CTA; incorrecto activa estado de error + scroll). API expuesta: `window.mlMobile = { setCard, getCard, next, prev, openSheet, closeSheets, setFrame, getFrame, xp, xpDom, isAnswered, version:"1.0.0" }`.
- **Toasts**: cola interna (info/success/warn/error), aparecen en `.ml-toast-stack` (superior derecha). Ej.: "Ver ejemplo", feedback de acierto/error, "Guardado en Favoritos/Web" (toggle).
- **Confeti**: piezas `.ml-confetti__bit` generadas dinámicamente al acierto (sutil). Reduce motion las omite.
- **Haptics**: leves vibraciones en selección/acierto/cambio de tarjeta (Web Vibration API si disponible).
- **Tabs**: navegación entre tabs (Ruta activa por defecto). Pulsar "Repaso" abre la hoja `#ml-sheet-racha` sin robar el estado activo de Ruta (comportamiento intencional). Cierre por X/scrim/Esc.

## 7. Coherencia con el brief (notas de diseño)
- **Progreso**: `Fase 1 · 80% completada` junto a barra de **4 segmentos, 3 llenos** ("Tarjeta 3 de 4"). Esta aparente discrepancia (80% vs 3/4=75%) se mantiene tal como aparece en el brief original. Se documenta aquí para evitar cambios arbitrarios; si se desea alinear, se puede actualizar a 75% o a 4/4 con otro valor — decisión de diseño a validar en Figma (no modificada en código).
- **XP base vs animado**: en frames estáticos se muestra `XP 1,420`. Los incrementos (+50/+100) se **demuestran mediante interacción** (respuesta correcta + abrir logro). Esto está reflejado en el caption del shell y en los asserts de verificación.
- **Medalla**: añadir obligatoriamente `.medal--unlocked` al contenedor `.ml-medal__stage` para activar el anillo mint/efectos definidos en `system.css`.
- **Iconografía**: sprite SVG único en `mobile.html` (#i-*). Se conservan emojis (`💡`, `🏥`, `💻`) tal como solicita el brief.
- **Accesibilidad**: hit-areas ≥44×44 (acciones, tabs, quiz-opt), dots ≥28×28, avatar ≥36×36, foco visible, `aria-hidden` en tarjetas inactivas, `aria-current="true"` en dots/tabs, `aria-pressed` en toggle Save, sheets con `role="dialog"`/`aria-modal`.
- **IA de acompañamiento (transversal, para todas las carreras)**: el microcopy de esta pantalla se revisó para que ningún estudiante (no solo ingeniería de sistemas) se sienta evaluado negativamente:
  - Error que normaliza en lugar de castigar: «Casi lo tienes… equivocarse forma parte de aprender» + «No te preocupes. Te ayudo a razonar paso a paso: extraer mínimo cuesta log V y relajar E aristas.»
  - Pista con andamiaje progresivo: primero el **porqué** en lenguaje llano («Dijkstra elige siempre el nodo más cercano…»), después la fórmula `O((V + E) log V)`.
  - Analogías cotidianas y no técnicas: GPS, atajo a pie, urgencias, descuento en la factura.
  - Racha sin presión: «¡Tu progreso sigue creciendo!» y «con 30 segundos es suficiente»; el CTA ofrece "sin prisa" y la salida es «Ahora no, gracias».
  - Logro centrado en el proceso: «¡Bien hecho! Fase 1 superada» / «Lo lograste a tu ritmo. Cada intento te ha acercado aquí.»

## 8. Estados alternos (frames Figma)
| Frame | Estado | Cambios clave |
|---|---|---|
| 01 | Acierto (+50 XP) | B correcta, feedback `.is-correct`, icon check, XP 1,420→1,470 al responder, confeti, sin sheets. |
| 02 | Incorrecto (acompañamiento) | A wrong (coral), B revealed (mint), feedback `.is-wrong`, icon X, "Ver pista" visible, hintBox oculto→visible, `.quiz.is-shake`, scroll al quiz, XP 1,420 (sin cambio). |
| 03 | Racha | SheetRacha abierto ("¡Tu progreso sigue creciendo!"), scrim, Maki `think`, CTA "Repasar 1 tarjeta · 30 s (sin prisa)", foco en CTA. |
| 04 | Logro desbloqueado | SheetLogro abierto, `.medal--unlocked`, título "¡Bien hecho! Fase 1 superada", medalla "Maestro del montículo", XP 1,420→1,470→1,570 (al abrir logro). |

## 9. Parámetros de test/QA (verificación headless)
- Verificación automática ejecutada con Chrome headless (`--dump-dom`, `--virtual-time-budget=6000`), asserts DOM, clases/estados, contraste AA, hit-areas ≥44px, scroll en `incorrecto`, foco/apertura/cierre de sheets, contador XP lógico, confeti.
- Resultados: **358/358** comprobaciones superadas (4 frames), consola limpia. Shell React: **48/48** comprobaciones superadas (switcher de 4 vistas, selector de 4 frames móviles, iframe `is-light`, navegación entre frames, vista 04 «Extensión» y vuelta a Diseño). Capturas: `mob/shot-acierto.png`, `shot-incorrecto.png`, `shot-racha.png`, `shot-logro.png`.
- QA manual sugerido (Figma/preview): viewport ≤430px, swipe horizontal fluido, teclado ←→, Esc cierra sheets, reduce motion activo/desactivo, modo oscuro (respeta preferencias), accesibilidad con lector de pantalla (roles/aria).

## 10. Nota sobre Figma MCP
**No existe servidor MCP de Figma disponible** en este entorno. Por ello se entrega este **prototipo navegable ejecutable** (`mobile.html` + CSS/JS) + este `MOBILE.md` (estructura de capas, tokens, componentes/variantes, medidas 390×844, wiring, estados alternos y microinteracciones). El equipo de diseño puede importar/exportar directamente desde este handoff para replicar con precisión en Figma (autolayout, componentes, variables/tokens, overrides).