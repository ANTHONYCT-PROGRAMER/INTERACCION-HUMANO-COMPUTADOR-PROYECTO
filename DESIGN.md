# Handoff de diseño — MakerLearn Studio · Pantalla 02 «Ruta Activa»

Documento de traspaso para llevar esta pantalla a Figma y para que ingeniería pueda
auditar cada medida contra el código real. **Todas las cifras de este documento están
medidas en `public/css/app.css` y `public/css/screen.css`**, no inventadas.

Archivos de referencia:

| Archivo | Rol |
|---|---|
| `public/css/tokens.css` | Tokens base (color, tipografía, espaciado, radios, sombras, movimiento) |
| `public/css/app.css` | Layout y componentes de la pantalla 02 (original, intacto) |
| `public/css/screen.css` | Ampliaciones del brief de handoff (overrides + añadidos) |
| `public/app.html` | Marcado de la pantalla (con las ampliaciones del brief) |
| `public/js/screen.js` | Lógica de interacción (de la que dependen los estados) |

---

## 1. Rejilla

### 1.1 Unidad base

- **Sub-rejilla: 4px** — la escala de espaciado de `tokens.css` avanza en pasos de 4px:
  `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`,
  `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`,
  `--space-12: 48px`, `--space-16: 64px`.
- **Ritmo de layout: 8px** — las relaciones entre bloques son múltiplos de 8.

### 1.2 Estructura de la pantalla

```
┌─────────────────────────────────────────────────────────────────┐
│ topbar                                            h = 72px      │
├───────────┬───────────────────────────────┬─────────────────────┤
│ rail izq. │ área de práctica (flex column)│ rail der. (Maki)    │
│ 260px     │ minmax(0, 1fr)                │ 340px               │
│           │  gap vertical 12px            │                     │
└───────────┴───────────────────────────────┴─────────────────────┘
                            bottom-nav h = 58px (sólo < 1080px)
```

| Zona | Medida | Origen |
|---|---|---|
| Topbar | `72px` | `--topbar-h` (app.css) |
| Rail izquierdo | `260px` | `--rail-left` |
| Rail derecho (Maki + Pistas + Criterios + Comprensión) | `340px` | `--rail-right` (el artefacto traía `336px`; el brief pide `340px`, `screen.css` lo sobreescribe) |
| Columna central | `minmax(0, 1fr)` | app.css |
| Separación entre columnas | `16px` | `--gap` |
| Separación vertical dentro del centro | `12px` | `.practice { gap: 12px }` |
| Bottom nav (móvil) | `58px` | `--bottom-nav-h` |
| Alto inicial del panel inferior | `200px` | `--term-h` |
| Panel colapsado | `44px` | `.panel.is-collapsed` |

### 1.3 Alturas de componentes (todas múltiplos de 4)

| Componente | Alto | Radio |
|---|---|---|
| Botón `.btn` | `44px` | `--radius-button` = 20px |
| Botón compacto `.btn--sm` | `44px` (mismo alto, menos padding) | 20px |
| Chip de sugerencia `.chip` | `44px` (`min-height`) | `--radius-pill` |
| Cabecera de panel / pestañas | `44px` | — |
| Fila de test `.test` | mínimo `27px` (`padding: 4px 0`) | — |
| Fila de criterio | `32px` (`padding: 6px 0` + icono 20px) | — |
| Avatar de Maki | `58px` | `--radius-lg` 16px |
| Anillo «Tu comprensión» | `56px` (radio 18, grosor 4) | — |
| Tarjeta `.card` | `padding: 13px` | `--radius-md` 12px |
| Botón de terminal / chip de estado | `19px` / `16px` de alto de línea | 7px / 4px |

### 1.4 Excepciones documentadas (no son errores, son deuda)

- `padding: 13px` en `.card`, `padding: 9px 14px 12px` en `.panel__body` y
  `padding: 0 12px` en `.panel__tab`: son valores de 1px fuera del ritmo de 8px
  heredados del artefacto original. **No se tocaron** para mantener el 1:1.
- Bordes de `1px` (`.card`, `.hint`, `.workbench`): trazos hairline, nunca se escalan.

### 1.5 Rejilla del panel derecho (340px)

```
padding lateral 13px → contenido 314px
├─ Maki: avatar 58px + gap 11px + identidad (flex)
├─ Burbuja de Maki: radio 10px, padding 9px 11px
├─ Hilo de chat: gap 8px, burbuja usuario alineada a la derecha
├─ Botón «Solicitar análisis socrático»: ancho 100%, alto 44px
└─ Input «Pregúntame algo…»: alto 44px + botón «Enviar»
```

---

## 2. Tipografía

### 2.1 Familias

| Uso | Familia | Token |
|---|---|---|
| UI, títulos, párrafos | Plus Jakarta Sans | `--font-body` |
| Terminal, tiempos de test, chips de estado, código, etiquetas | JetBrains Mono | `--font-mono` |

Carga: Google Fonts vía `<link>` en `public/app.html`
(`JetBrains Mono` 400/500/700, `Plus Jakarta Sans` 400/500/600/700/800).

### 2.2 Escala real usada en la pantalla 02

| Rol | Tamaño | Peso | Interlineado | Tracking |
|---|---|---|---|---|
| Título del reto `.challenge__title` | 17.5px | 700 | 1.32 | −0.032em |
| Nombre del tutor `.maki-card__name` | 14.5px | 800 | 1.2 | −0.025em |
| Cuerpo de tarjeta `.card__title` | 13px | 800 | — | −0.02em |
| Cuerpo de terminal `.panel__body` | 11px | 400 | 1.72 | — |
| Botón `.btn` | 12.5px | 700 | 1 | −0.01em |
| Burbuja de Maki `.maki-speech p` | 12px | 400 | 1.55 | — |
| Texto de UI estándar | 12.5px | 400 | 1.55 | — |
| Chip de estado `.test__status` | 8.5px | 700 | — | 0.02em |
| Etiqueta mono pequeña (`.hint__kind`, `.panel__count`) | 8–9.5px | 600–700 | — | 0.06em |
| Número de nivel / XP `.stat-streak__value` | 13px | 700 | — | — |

Reglas:

- **Todo número, tiempo, atajo y ruta va en `--font-mono`.** Los textos narrativos y
  los títulos van en `--font-body`.
- Los títulos bajan tracking (valores negativos); las etiquetas mono en mayúsculas
  suben tracking (0.06em).
- Jerarquía por peso, no por tamaño: la diferencia entre 12.5px y 17.5px es de 2
  escalones, el resto lo resuelve el peso (400/600/700/800).

---

## 3. Tokens de color usados por los estados del brief

| Estado | Token / valor | Uso |
|---|---|---|
| ✅ PASÓ | `--term-ok` `#7FE7C4` | chip de estado, icono de check, línea de terminal OK |
| ⏳ EN ESPERA | `#E6D3B0` sobre `rgba(255,176,32,.10)` | chip pendiente |
| ❌ FALLÓ | `--term-fail` `#FF8095` | chip fallido, etiqueta `TLE`, error de terminal |
| 🔒 BLOQUEADO | `--term-dim` `#8B93AD` | fila bloqueada, motivo de bloqueo |
| Acción / foco | `--violet-400`, `--violet-300` `#B3A1FF`, `--violet-line`, `--violet-soft` | botón Ejecutar, anillo de comprensión, glow |
| Superficies | `--surface`, `--surface-2`, `--surface-inset`, `--code-bg` | tarjetas, terminal, cursor |

El editor y la terminal mantienen su paleta oscura en ambos temas (decisión del
artefacto original).

---

## 4. Nombres de capas para Figma

Convención: `categoria/rol[/estado]`, en `snake_case` para tokens y `kebab-case` para
elementos. Los componentes que se repiten se convierten en **Component Set** con
variantes `Estado`.

### 4.1 Estructura de páginas

```
📄 02 · Ruta Activa
   🗂 00 · Thumbnail
   🗂 01 · Foundations        (tokens, tipografía, rejilla)
   🗂 02 · Components
   🗂 03 · Screen / desktop   (1600 × 1050)
   🗂 04 · Screen / mobile    (390 × 844)
   🗂 05 · States             (todas las variantes del brief)
```

### 4.2 Árbol de capas de la pantalla

```
frame/02-ruta-activa
├─ comp/topbar
│  ├─ brand/logo
│  ├─ nav/breadcrumbs
│  ├─ stat/streak            (variantes: idle | bumped)
│  ├─ stat/xp-ring           (variantes: 71% | 100%)
│  ├─ btn/notifications      (variantes: default | unread)
│  ├─ btn/theme              (variantes: dark | light)
│  └─ btn/avatar
├─ layout/body
│  ├─ rail/left · itinerario
│  │  └─ nav/phase-item      (variantes: done | active | locked)
│  ├─ section/practice
│  │  ├─ header/challenge
│  │  │  ├─ label/challenge-num
│  │  │  ├─ text/challenge-title
│  │  │  ├─ btn/save
│  │  │  ├─ stat/timer
│  │  │  └─ btn/statement
│  │  ├─ comp/workbench
│  │  │  ├─ editor/file-tabs
│  │  │  ├─ editor/gutter       (variantes: todo | fixed | error)
│  │  │  ├─ editor/code
│  │  │  ├─ panel/panel-head
│  │  │  │  └─ comp/tab         (variantes: tests-active | terminal-active | hints-active)
│  │  │  ├─ panel/tests
│  │  │  │  └─ comp/test-row    (variantes: passed | pending | failed | locked)
│  │  │  ├─ panel/terminal
│  │  │  │  ├─ line/command
│  │  │  │  ├─ line/success
│  │  │  │  ├─ line/error
│  │  │  │  ├─ line/skip
│  │  │  │  ├─ text/summary
│  │  │  │  └─ cursor/caret     (animación 1.1s)
│  │  │  ├─ panel/hints         (espejo de la tarjeta Pistas)
│  │  │  └─ skeleton/loading
│  │  └─ comp/action-bar
│  │     ├─ btn/prev
│  │     ├─ btn/run             (variantes: idle | hover | loading | disabled)
│  │     └─ btn/next            (variantes: disabled | enabled)
│  └─ rail/right · tutor
│     ├─ card/maki
│     │  ├─ avatar/maki         (variantes: idle | think | cheer)
│     │  ├─ text/maki-name
│     │  ├─ text/maki-status
│     │  ├─ bubble/speech
│     │  ├─ list/chat-thread
│     │  │  └─ comp/chat-message (variantes: user | maki)
│     │  ├─ btn/maki-analyze
│     │  └─ form/maki-chat
│     ├─ card/hints
│     │  ├─ comp/hint           (variantes: open | locked | ready)
│     │  └─ badge/hint-kind     (Concepto | Estructura | Sintaxis)
│     ├─ card/criteria
│     │  └─ comp/criterion      (variantes: done | pending)
│     └─ card/comprehension     (anillo: 54% | 68% | 82% | 100%)
├─ overlay/confetti             (44 partículas, 1.1–2.0s)
├─ overlay/xp-float             («+80 XP», 1.15s)
├─ overlay/toast                (variantes: success | error | info | xp)
└─ overlay/statement-modal
```

### 4.3 Nombres de variantes (exactos, los que usa el código)

| Componente Figma | Propiedad | Valores |
|---|---|---|
| `comp/test-row` | `Estado` | `passed`, `pending`, `failed`, `locked` |
| `comp/hint` | `Estado` | `open`, `ready`, `locked` |
| `comp/tab` | `Seleccionada` | `true`, `false` |
| `avatar/maki` | `Estado` | `idle`, `think`, `cheer` |
| `btn/run` | `Estado` | `idle`, `hover`, `loading`, `disabled` |
| `btn/next` | `Estado` | `disabled`, `enabled` |
| `comp/criterion` | `Hecho` | `true`, `false` |
| `stat/streak` | `Estado` | `idle`, `bumped` |
| `card/comprehension` | `Valor` | `54%`, `68%`, `82%`, `100%` |

Los nombres de variante coinciden con los atributos reales del DOM
(`data-status`, `data-state`, `is-active`, `data-maki`) para que el traspaso
Figma ↔ código sea mecánico.

---

## 5. Estados e interacciones del brief (contrato con desarrollo)

| # | Elemento | Comportamiento | Implementación |
|---|---|---|---|
| 1 | Pestañas del panel | 3 pestañas: **Tests · Terminal · Pistas**. Por defecto **Terminal** (conserva el log visible del brief) | `activatePanelTab()` en `screen.js` |
| 2 | Tests | Chip por fila: `✅ PASÓ` / `⏳ EN ESPERA` / `❌ FALLÓ` / `🔒 BLOQUEADO`. Estado inicial: 01–03 ✅, 04 ❌, 05 🔒 | `setTestStatus()`, `setAllTestsPending()` |
| 2b | Pestaña Tests durante una ejecución | Todas las filas ejecutables → ⏳ EN ESPERA; al terminar resuelven a ✅/❌ | `runTests()` → `finishRun()` |
| 2c | Fila 05 | Reto 3, genuinamente bloqueada (`🔒 BLOQUEADO`), con tooltip explicativo | `data-status="locked"` |
| 3 | Terminal | Cursor parpadeante al final de cada salida (`1.1s steps(1)`) | `.term-caret` + `appendTermCaret()` |
| 4 | Barra inferior | `← Anterior · ▶ Ejecutar Tests · Siguiente Reto →`; «Siguiente Reto» deshabilitado hasta pasar las 4 pruebas | `.workbench-foot`, `setNextEnabled()` |
| 5 | Maki | Avatar + nombre «Maki, tu tutor socrático» + estado «En línea 🟢», burbuja de diálogo, hilo, botón **🤔 Solicitar análisis socrático** y campo **Pregúntame algo…** | `.maki-*` en `screen.css`, `socraticReply()`, `pushMakiMessage()` |
| 6 | Tu comprensión | Anillo con **68%** inicial (`stroke-dasharray 113.1`); sube al resolver y al preguntar, baja al fallar | `setComprehension()` |
| 7 | Hover de acción | Glow violeta + `scale(1.03)` en «Ejecutar Tests» | `.run-btn:hover` |
| 8 | Recompensa | Confeti (44 partículas) + «+80 XP» flotante + racha 5 → 6 con rebote | `celebrate()`, `floatXP()`, `bumpStreak()`, `confetti()` |
| 9 | Pista bloqueada | `shake` 0.36s + tooltip con el motivo («Tras 1 intento fallido») | `.hint.is-shake`, `data-tip` |
| 10 | Parpadeo de Maki | Ciclo idle cada **4s** (el artefacto lo traía a 7.5s) | `.maki__eyes-open` |
| 11 | Pistas | Renombradas a **Concepto / Estructura / Sintaxis**; se desbloquean por **intentos fallidos** (2ª tras 1 fallo, 3ª tras 2). La 1ª (`Concepto`) arranca abierta: «1 de 3» | `syncHintLocks()`, `unlockHint()`, `renderHintsTab()` |
| 12 | Variante «Test fallido» | `app.html?state=fallido`: 01 ✅, 02 ❌ (`RE`, traza de error), 03–04 en espera/bloqueado, pista 2 desbloqueada, comprensión 54% | `applyFailedVariant()` |
| 13 | Empujón gratis al fallar | Tras un test fallido, Maki da una pista conceptual **sin coste de XP** y un toast `info` («Sin coste de XP») antes de mencionar las pistas de pago | `finishRun()` (rama `else`) |
| 14 | Pistas opcionales | Los avisos de desbloqueo dicen «ya puedes abrirla **si la necesitas**. Solo entonces se descuentan XP» y las notas añaden «(Pista N disponible si la necesitas)» | `finishRun()`, `toast()` |

### Acompañamiento (IA de acompañamiento)

La pantalla 02 se revisó para que el andamiaje no se perciba como castigo, útil para cualquier estudiante (no solo perfiles técnicos):

- **Tono empático al fallar**: «No pasa nada, equivocarse es parte de aprender», «es un detalle fino: la lógica ya es correcta» (se conserva el dato técnico del TLE).
- **Pista gratuita antes del coste en XP**: el empujón conceptual de Maki y el toast informativo llegan **antes** que cualquier pista que descuente XP.
- **Análisis de Maki sin culpa**: «Buenas noticias: la lógica base es correcta… no un error tuyo de concepto» + invitación explícita a pedir ayuda sin coste.
- **Chat socrático acogedor**: «no sé / perdido / bloqueado» → «Tranquilo, es normal atascarse aquí» + pista sin coste; el fallback ofrece lo mismo.
- **Lenguaje llano primero**: la explicación conceptual (trabajo repetido en la cola) precede a la fórmula/complejidad.

### Accesibilidad

- Pestañas con roving `tabindex`, `role="tab"`/`role="tabpanel"`, flechas ←/→/Home/End.
- `aria-live="polite"` en terminal, burbuja e hilo de Maki.
- Tooltips por `data-tip` visibles en `:hover` **y** `:focus-visible`.
- `@media (prefers-reduced-motion: reduce)`: se desactivan confeti, XP flotante,
  rebote de racha, parpadeo del cursor, parpadeo de Maki y shake.

---

## 6. Desviaciones deliberadas respecto al brief literal

1. **Emoji sólo en los chips de estado.** ✅ ⏳ ❌ 🔒 aparecen en los chips
   (`test__status`) tal como pide el brief; el resto de la interfaz usa el sprite SVG
   existente para no romper la consistencia del sistema de diseño.
2. **Modelo de 4 pruebas + fila bloqueada.** El brief habla de «Test 1 / 2 / 3»; se
   mantienen las 4 pruebas reales del artefacto (la 4ª es la que falla por TLE) y se
   añade una 5ª fila `🔒 BLOQUEADO` del siguiente reto, que sí está bloqueada de verdad.
3. **«Siguiente Reto» no navega.** Al pulsarlo muestra un toast de confirmación: no
   existe el reto 3 en este prototipo, así que no se inventa una pantalla.
4. **Tiempo de compilación `0.12 s`.** Se unificó el valor de la terminal para que
   coincida con el estado visible del brief.
