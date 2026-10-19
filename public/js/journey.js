/* ---------------------------------------------------------------------------
   MakerLearn Studio · Pantalla 05 «Inicio» y Pantalla 06 «Fase» (móvil)

   Inicio    ?state=inicio | generando | itinerario
             El estudiante escribe su tema; la app lo divide en 3 fases.
   Fase      ?phase=1 | 2 | 3
             Detalle de cada fase del itinerario: objetivos, contenido,
             ejercicios y checklist de entrega.

   Reutiliza el contrato de clases del sistema (system.css + mobile.css):
     .ml-toast / .ml-confetti / .xp.is-bumped / .btn / .badge / .chip
     .quiz / .quiz-opt / .is-correct / .is-wrong / .quiz__feedback.is-visible
     .ml-sheet / .ml-scrim   (no se usan aquí)
   No depende de app.css.
   --------------------------------------------------------------------------- */

(function () {
  "use strict";

  /* =======================================================================
     0. Utilidades
     ======================================================================= */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  var REDUCE = false;
  try { REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { REDUCE = false; }

  function haptic(pattern) {
    try { if (navigator.vibrate) { navigator.vibrate(pattern || 8); } } catch (e) { /* sin soporte */ }
  }

  function focusQuietly(node) {
    if (!node) { return; }
    try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
  }

  function groupThousands(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function restart(node, cls) {
    if (!node) { return; }
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  var ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"']/g, function (ch) { return ESCAPE[ch]; });
  }

  /* =======================================================================
     1. Elementos compartidos por las dos pantallas
     ======================================================================= */

  var el = {
    main: $("#jr-main"),
    toasts: $("#jr-toasts"),
    confetti: $("#jr-confetti"),
    xp: $("#jr-xp"),
    xpOut: $("#jr-xp-b"),
    xpStat: $("#jr-xp-stat"),
    caption: $("#jr-caption-state"),
    device: $("#jr-device")
  };

  var XP_BASE = 1420;

  /* =======================================================================
     2. Toasts (mismo contrato que mobile.js)
     ======================================================================= */

  var TOAST_ICON = { success: "#i-check", error: "#i-x", info: "#i-info" };

  function dismissToast(node) {
    if (!node || node.classList.contains("is-leaving")) { return; }
    node.classList.add("is-leaving");
    window.setTimeout(function () {
      if (node.parentNode) { node.parentNode.removeChild(node); }
    }, 220);
  }

  function toast(type, title, message) {
    if (!el.toasts) { return null; }
    type = TOAST_ICON[type] ? type : "info";
    while (el.toasts.children.length >= 2) {
      el.toasts.removeChild(el.toasts.firstElementChild);
    }

    var node = document.createElement("div");
    node.className = "ml-toast ml-toast--" + type;
    node.setAttribute("role", type === "error" ? "alert" : "status");
    node.innerHTML =
      '<span class="ml-toast__icon">' +
        '<svg class="od-icon icon i-16" aria-hidden="true"><use href="' + TOAST_ICON[type] + '"></use></svg>' +
      '</span>' +
      '<span class="ml-toast__body"><strong></strong><span></span></span>' +
      '<button class="ml-toast__close" type="button" aria-label="Cerrar aviso">' +
        '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-x"></use></svg>' +
      '</button>';

    var strong = $("strong", node);
    var body = $(".ml-toast__body span", node);
    if (strong) { strong.textContent = title || ""; }
    if (body) { body.textContent = message || ""; }

    var close = $(".ml-toast__close", node);
    if (close) { close.addEventListener("click", function () { dismissToast(node); }); }

    el.toasts.appendChild(node);
    window.setTimeout(function () { dismissToast(node); }, 5200);
    return node;
  }

  /* =======================================================================
     3. Confeti + XP con conteo animado
     ======================================================================= */

  var CONFETTI_COLORS = ["#6C4CF1", "#8B5CF6", "#9A7BFF", "#00D4A0", "#FFB020"];

  function confetti(count) {
    if (!el.confetti || REDUCE) { return 0; }
    var total = count || 14;
    for (var i = 0; i < total; i++) {
      var bit = document.createElement("i");
      bit.className = "ml-confetti__bit";
      bit.style.left = (6 + Math.random() * 88).toFixed(2) + "%";
      bit.style.top = "-14px";
      bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      bit.style.setProperty("--bit-dx", (Math.random() * 90 - 45).toFixed(0) + "px");
      bit.style.setProperty("--bit-rot", (Math.random() * 540 - 270).toFixed(0) + "deg");
      bit.style.setProperty("--bit-dur", (1 + Math.random() * 0.7).toFixed(2) + "s");
      el.confetti.appendChild(bit);
      (function (node) {
        window.setTimeout(function () {
          if (node.parentNode) { node.parentNode.removeChild(node); }
        }, 2000);
      })(bit);
    }
    return total;
  }

  function renderXP(value) {
    if (el.xpOut) { el.xpOut.textContent = groupThousands(value); }
    if (el.xpStat) { el.xpStat.textContent = groupThousands(value); }
  }

  /* La animación puede ir por detrás: el valor lógico es la fuente de verdad. */
  var xpValue = XP_BASE;
  var xpTick = 0;

  function setXPBase() {
    xpValue = XP_BASE;
    renderXP(XP_BASE);
  }

  function bumpXP(delta, title, message) {
    var from = xpValue;
    var to = xpValue + delta;
    xpValue = to;

    restart(el.xp, "is-bumped");
    haptic([12, 40, 12]);

    if (REDUCE) {
      renderXP(to);
    } else {
      /* Red de seguridad: si rAF va por detrás (pestaña oculta, captura
         headless) el número visible acaba igualmente en el valor correcto. */
      var token = ++xpTick;
      var t0 = null;
      function tick(ts) {
        if (token !== xpTick) { return; }
        if (t0 === null) { t0 = ts; }
        var p = Math.min(1, (ts - t0) / 700);
        var eased = 1 - Math.pow(1 - p, 3);
        renderXP(Math.round(from + (to - from) * eased));
        if (p < 1) { window.requestAnimationFrame(tick); }
        else { renderXP(to); }
      }
      window.requestAnimationFrame(tick);
      window.setTimeout(function () {
        if (token === xpTick) { renderXP(to); }
      }, 780);
    }

    if (title) { toast("success", title, message); }
    return to;
  }

  function scrollTo(node, offset) {
    if (!el.main || !node) { return; }
    var box = el.main.getBoundingClientRect();
    var target = node.getBoundingClientRect();
    el.main.scrollTop += (target.top - box.top) - (offset || 10);
  }

  /* =======================================================================
     4. Datos del itinerario
     ======================================================================= */

  var SUGGESTIONS = [
    "Dijkstra en grafos",
    "Recursión",
    "Complejidad Big-O",
    "Montículos (heaps)",
    "Grafos y caminos mínimos"
  ];

  var PHASES = [
    {
      n: 1,
      title: "Fundamentos y complejidad",
      time: "12 min",
      progress: 3,
      state: "now",
      tagline: "Qué calcula, por qué necesita pesos no negativos y cuánto cuesta",
      lead: "<b>Dijkstra en Grafos</b> · Qué promete, por qué necesita pesos no negativos y cuánto cuesta.",
      goals: [
        { t: "Explicar qué calcula Dijkstra", done: true },
        { t: "Reconocer por qué hacen falta pesos no negativos", done: true },
        { t: "Deducir el coste O((V + E) log V)", done: true },
        { t: "Relajar una arista sin perderse", done: false }
      ],
      link: {
        kicker: "Te queda 1 tarjeta",
        title: "Por qué no valen los pesos negativos",
        note: "Continúa la lección en el móvil: es la tarjeta 4 de 4 de la Fase 1.",
        cta: "Ir a la tarjeta 4 de 4",
        href: "mobile.html?state=acierto"
      },
      blocks: [
        {
          type: "concept",
          title: "Qué calcula (y qué no)",
          text: "Dijkstra te da la <b>distancia mínima</b> desde un nodo origen a todos los alcanzables. No te da todos los caminos posibles y no funciona con pesos negativos.",
          emoji: "🚗",
          analogy: "es como el GPS: elige el mejor tramo disponible en cada momento."
        },
        {
          type: "concept",
          title: "Relajar una arista",
          text: "Relajar es preguntar: «¿llego más rápido pasando por aquí?». Si la suma mejora lo que ya sabías, actualizas la distancia y apuntas de dónde viniste.",
          emoji: "🚶",
          analogy: "si encuentras un atajo mejor, lo adoptas."
        },
        {
          type: "concept",
          title: "La cola de prioridad",
          text: "El truco está en sacar siempre el candidato más barato. Con un montículo cada extracción cuesta <b>log V</b> en vez de recorrer toda la lista.",
          emoji: "⛰️",
          analogy: "como una fila que atiende primero a quien está más cerca."
        },
        {
          type: "quiz",
          title: "Si una arista tuviera peso negativo, ¿qué se rompería?",
          correct: "b",
          correctTitle: "¡Exacto! +50 XP",
          correctMsg: "Dijkstra confía en que, al sacar el candidato más barato, ya no puede mejorar. Con un peso negativo esa confianza se rompe.",
          wrongTitle: "Casi lo tienes… y pensarlo ya es aprender",
          wrongMsg: "No pasa nada. Pista: piensa en el momento en que un nodo se da por «definitivo» y aparece después un camino más barato.",
          hint: "<b>Pista suave:</b> un nodo se marca como cerrado cuando sale de la cola. Si un peso negativo pudiera mejorarlo después, esa decisión sería precipitada.",
          options: [
            { id: "a", text: "Nada, seguiría funcionando igual" },
            { id: "b", text: "Un nodo dado por definitivo podría mejorar después" },
            { id: "c", text: "Cambiaría solo el orden de visita, sin afectar al resultado" }
          ]
        }
      ],
      maki: {
        ask: "Antes de seguir: ¿por qué crees que Dijkstra necesita que ningún peso sea negativo? Cuéntame tu intuición y la afinamos.",
        hint: "Empieza por el final: cuando un nodo sale de la cola, el algoritmo lo declara «cerrado». ¿Qué haría falta para que ese cierre fuese falso?",
        easy: "En una frase: Dijkstra es como caminar siempre hacia lo más cercano. Un peso negativo sería un atajo que aparece después de haber pasado de largo… y ya no vuelves."
      }
    },

    {
      n: 2,
      title: "Implementación con montículo",
      time: "14 min",
      progress: 0,
      state: "lock",
      tagline: "Del papel al código: cola de prioridad, distancias y camino reconstruido",
      lead: "<b>Dijkstra en Grafos</b> · Del papel al código: la cola de prioridad, los vectores de distancia y el camino reconstruido.",
      goals: [
        { t: "Escribir el bucle principal con una cola de prioridad", done: false },
        { t: "Mantener distancias y predecesores sin mezclarlos", done: false },
        { t: "Reconstruir el camino del destino al origen", done: false },
        { t: "Probar con un grafo pequeño hecho a mano", done: false }
      ],
      lockedNote: "Esta fase se abre al terminar la Fase 1. Puedes echar un vistazo, pero ve con calma: no hace falta entenderlo todo hoy.",
      blocks: [
        {
          type: "steps",
          title: "El algoritmo, en 5 pasos",
          steps: [
            "Marca <b>dist[origen] = 0</b> y el resto en ∞. Mete el origen en la cola.",
            "Saca el nodo con la distancia más pequeña: el montículo te lo da hecho.",
            "Si ya estaba cerrado, ignóralo y sigue (entrada obsoleta).",
            "Relaja sus aristas: si <b>dist[u] + w &lt; dist[v]</b>, actualiza <b>dist[v]</b> y <b>prev[v]</b>.",
            "Repite hasta vaciar la cola. El resultado está en <b>dist[]</b> y la ruta en <b>prev[]</b>."
          ]
        },
        {
          type: "code",
          title: "Dijkstra con cola de prioridad",
          bar: "C++17 · priority_queue",
          code:
            '<span class="c">// Dijkstra con cola de prioridad (min-heap)</span>\n' +
            '<span class="t">vector</span>&lt;<span class="t">long long</span>&gt; dist(n, INF);\n' +
            '<span class="t">vector</span>&lt;<span class="t">int</span>&gt; prev(n, -1);\n' +
            '<button class="jr-fn" type="button" data-fn="0">priority_queue</button>&lt;pair&lt;<span class="t">long long</span>,<span class="t">int</span>&gt;,\n' +
            '               vector&lt;pair&lt;<span class="t">long long</span>,<span class="t">int</span>&gt;&gt;,\n' +
            '               greater&lt;&gt;&gt; pq;\n' +
            '\n' +
            'dist[src] = <span class="s">0</span>;\n' +
            'pq.push({<span class="s">0</span>, src});\n' +
            '\n' +
            '<span class="k">while</span> (!pq.empty()) {\n' +
            '  <span class="k">auto</span> [d, u] = pq.top(); pq.pop();\n' +
            '  <span class="k">if</span> (<button class="jr-fn" type="button" data-fn="1">d &gt; dist[u]</button>) <span class="k">continue</span>;  <span class="c">// obsoleta</span>\n' +
            '  <span class="k">for</span> (<span class="k">auto</span> [v, w] : adj[u]) {\n' +
            '    <span class="k">if</span> (<button class="jr-fn" type="button" data-fn="2">dist[u] + w</button> &lt; dist[v]) {\n' +
            '      dist[v] = dist[u] + w;\n' +
            '      <button class="jr-fn" type="button" data-fn="3">prev[v] = u</button>;\n' +
            '      pq.push({dist[v], v});\n' +
            '    }\n' +
            '  }\n' +
            '}',
          tips: [
            { k: "priority_queue", v: "Guarda pares <code>(distancia, nodo)</code> y devuelve siempre el de menor distancia. Con <code>greater&lt;&gt;</code> el montículo es de mínimos." },
            { k: "if (d > dist[u]) continue", v: "Entrada obsoleta: al mejorar una distancia, el par viejo sigue en la cola. Descartarlo evita trabajo repetido." },
            { k: "dist[u] + w", v: "La relajación: pregúntate si llegar por <code>u</code> es más barato. Si sí, actualiza la distancia." },
            { k: "prev[v] = u", v: "Sin el predecesor sabrás el coste, pero no la ruta. Se reconstruye hacia atrás desde el destino." }
          ],
          meta: [
            { k: "Complejidad", v: "O((V + E) log V)" },
            { k: "Memoria", v: "O(V + E)" },
            { k: "Dependencias", v: "&lt;queue&gt;, &lt;vector&gt;" },
            { k: "Ojo con", v: "pesos negativos ❌" }
          ]
        },
        {
          type: "checklist",
          title: "Antes de dar la fase por terminada",
          items: [
            { t: "Ignoro las entradas obsoletas", h: "`if (d > dist[u]) continue;` acelera mucho." },
            { t: "Uso long long para las distancias", h: "∞ + ∞ y las sumas grandes desbordan un int." },
            { t: "Reconstruyo el camino con prev[]", h: "Sin esto sabrás el coste, pero no la ruta." },
            { t: "Pruebo con un grafo de 4 nodos a mano", h: "Comparar contra tu cálculo en papel detecta errores rápido." }
          ]
        }
      ],
      maki: {
        ask: "Si el código no te sale a la primera, es normal: casi todo el mundo depura aquí. ¿Qué parte quieres que veamos juntos?",
        hint: "Si el resultado sale mal, mira primero el montículo: ¿estás metiendo el par en el orden (distancia, nodo)?",
        easy: "Piéndolo así: la cola es una fila que siempre atiende al más cercano, y cada vez que mejoras una distancia avisas a la fila otra vez."
      }
    },

    {
      n: 3,
      title: "Optimización y casos límite",
      time: "12 min",
      progress: 0,
      state: "lock",
      tagline: "Afinar el rendimiento, cubrir los casos borde y entregar tranquilo",
      lead: "<b>Dijkstra en Grafos</b> · Afinar el rendimiento, cubrir los casos borde y entregar sin miedo a que se rompa.",
      goals: [
        { t: "Decidir cuándo conviene el montículo y cuándo basta una lista", done: false },
        { t: "Cubrir los casos límite que rompen las entregas", done: false },
        { t: "Medir con datos reales en lugar de a ojo", done: false },
        { t: "Entregar con la checklist completa", done: false }
      ],
      lockedNote: "Esta fase se abre al terminar la Fase 2. Puedes echar un vistazo, pero ve con calma: no hace falta entenderlo todo hoy.",
      blocks: [
        {
          type: "concept",
          title: "Optimizar con criterio",
          text: "El montículo ya te da <b>O((V + E) log V)</b>. Antes de tocar nada más, mide: si con los datos reales tarda milisegundos, no hay nada que optimizar.",
          emoji: "🧭",
          analogy: "optimizar sin medir es como ajustar el GPS sin salir de casa."
        },
        {
          type: "concept",
          title: "Las dos mejoras que casi siempre pagan",
          text: "Cortar cuando sacas el destino (si solo te interesa un nodo) y saltarte las entradas obsoletas. Nada de micro-optimizar a ciegas.",
          emoji: "✂️",
          analogy: "recortar el trabajo que no necesitas, no el que sí."
        },
        {
          type: "edge",
          title: "Casos límite que hay que cubrir",
          rows: [
            { c: "Grafo vacío o sin aristas", e: "dist[origen] = 0 · el resto ∞", why: "El bucle no entra y devuelve el vector inicial. No hace falta un caso especial." },
            { c: "Pesos iguales a cero", e: "Se relajan bien: no son negativos", why: "Dijkstra solo prohíbe los negativos. Un peso 0 es válido y no crea caminos infinitos." },
            { c: "Nodo inalcanzable", e: "Queda en ∞ · no lo imprimas como número", why: "Al reconstruir con prev[] llegarás a -1: trátalo como «sin ruta»." },
            { c: "Pesos negativos", e: "❌ no es Dijkstra · usa Bellman-Ford", why: "Si el enunciado los permite, el algoritmo correcto es otro. Detectar esto te ahorra entregar mal." },
            { c: "Autoaristas o aristas repetidas", e: "Se ignoran o se conserva la menor", why: "Una arista u→u siempre empeora el resultado; conservar el mínimo evita relajaciones inútiles." }
          ]
        },
        {
          type: "checklist",
          title: "Checklist pre-entrega",
          entrega: true,
          items: [
            { t: "Mi solución pasa los 4 casos límite", h: "Vacío, pesos 0, inalcanzable y negativos." },
            { t: "Medí con datos reales y anoté el tiempo", h: "Un número vale más que una opinión." },
            { t: "El camino reconstruido se imprime legible", h: "«A → C → D (coste 12)», no una lista de índices." },
            { t: "Cité las fuentes que usé", h: "InsightLens te ayuda a verificar citas antes de entregar." }
          ]
        }
      ],
      maki: {
        ask: "Cuando entregues te haré una pregunta de defensa. ¿Te sientes con fuerzas o prefieres repasar algo primero?",
        hint: "Repasa solo lo que te da inseguridad: los casos límite y el reconstruido del camino son los que más se olvidan.",
        easy: "Resumen en 3 líneas: mide antes de optimizar, cubre los casos borde y entrega con la checklist cerrada. Lo demás es pulir."
      },
      defense: "Pregunta de defensa: ¿por qué tu solución no vale si el enunciado permitiera pesos negativos? Cuéntamelo con tus palabras."
    }
  ];

  function phaseByNumber(n) {
    for (var i = 0; i < PHASES.length; i++) {
      if (PHASES[i].n === n) { return PHASES[i]; }
    }
    return null;
  }

  function otherPhase(n) {
    return PHASES[n - 1] || PHASES[0];
  }

  /* =======================================================================
     5. Pantalla 05 · Inicio
     ======================================================================= */

  var home = {
    active: false,
    frame: "inicio",
    topic: "",
    generated: false,
    busy: false,
    timer: null,
    maki: 0
  };

  var homeEl = {
    form: $("#jr-form"),
    input: $("#jr-topic"),
    field: $(".jr-field"),
    go: $("#jr-go"),
    chips: $("#jr-chips"),
    skel: $("#jr-skel"),
    skelMsg: $("#jr-skel-msg"),
    result: $("#jr-result"),
    resultTopic: $("#jr-result-topic"),
    resultCtx: $("#jr-result-ctx"),
    resultTitle: $("#jr-result-title"),
    phases: $("#jr-phases"),
    error: $("#jr-error"),
    errorTopic: $("#jr-error-topic"),
    errorRetry: $("#jr-error-retry"),
    errorIdea: $("#jr-error-idea"),
    errorPlan: $("#jr-error-plan"),
    start: $("#jr-start"),
    continueWrap: $("#jr-continue-wrap"),
    resume: $("#jr-resume"),
    maki: $(".jr-maki"),
    makiQ: $("#jr-maki-q"),
    makiIdea: $("#jr-maki-idea"),
    makiHelp: $("#jr-maki-help"),
    avatar: $("#jr-avatar"),
    tabs: $("#jr-tabs")
  };

  var HOME_FRAME_LABEL = {
    inicio: "Inicio",
    generando: "Generando itinerario",
    itinerario: "Itinerario listo",
    error: "No se pudo generar"
  };

  var HOME_MAKI = [
    "¿No sabes por dónde empezar? Elige una idea y te la divido en fases. Y si te atascas, te doy una pista gratis: aquí nadie se queda atrás.",
    "Funciona en 3 fases: primero entiendes la idea, luego la pasas a código y al final la optimizas y la entregas. Puedes parar cuando quieras.",
    "No hay respuestas tontas. Si algo no encaja, dímelo: las dudas son la parte más útil de estudiar."
  ];

  function setTopic(value) {
    home.topic = String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, 64);
    if (homeEl.input) {
      homeEl.input.value = home.topic;
      if (home.topic) { homeEl.input.setAttribute("aria-invalid", "false"); }
    }
    if (homeEl.chips) {
      $$(".jr-chip", homeEl.chips).forEach(function (chip) {
        chip.classList.toggle("is-used", chip.getAttribute("data-topic") === home.topic);
      });
    }
    return home.topic;
  }

  function prettyTopic(value) {
    var t = String(value || "").trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function phaseRow(p) {
    var now = p.state === "now";
    var mark = now ? "🔵" : "🔒";
    var tag = now ? "En curso" : "Bloqueada";
    var sub = now ? p.tagline : "Se abre al terminar la fase anterior";
    return '<button class="jr-phase is-' + p.state + '" type="button" data-phase="' + p.n + '">' +
        '<span class="jr-phase__mark" aria-hidden="true">' + mark + '</span>' +
        '<span class="jr-phase__body">' +
          '<span class="jr-phase__t">Fase ' + p.n + ' · ' + esc(p.title) + '</span>' +
          '<span class="jr-phase__s">' + esc(sub) + '</span>' +
        '</span>' +
        '<span class="jr-phase__tag">' + tag + '</span>' +
      '</button>';
  }

  function renderItinerary(topic) {
    var clean = prettyTopic(topic || "Dijkstra en grafos");
    home.generated = true;

    if (homeEl.resultTopic) {
      homeEl.resultTopic.innerHTML = "Vas a estudiar <b>" + esc(clean) + "</b>. Empieza por la Fase 1: nadie nace sabiendo esto.";
    }
    if (homeEl.resultCtx) {
      homeEl.resultCtx.innerHTML = "3 fases · <b>≈ 38 min</b>";
    }
    if (homeEl.phases) {
      homeEl.phases.innerHTML = PHASES.map(phaseRow).join("");
    }
    if (homeEl.start) {
      homeEl.start.innerHTML = 'Empezar Fase 1' +
        '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-arrow-right"></use></svg>';
    }
    return clean;
  }

  function setHomeMakiState(state) {
    var svg = $(".maki", homeEl.maki);
    if (svg) { svg.setAttribute("data-state", state); }
  }

  function setHomeBusy(on) {
    home.busy = !!on;
    if (homeEl.go) {
      /* el ring de carga es CSS (.is-busy); el icono se oculta solo */
      homeEl.go.classList.toggle("is-busy", home.busy);
      homeEl.go.setAttribute("aria-disabled", home.busy ? "true" : "false");
    }
  }

  function showSkeleton() {
    if (homeEl.skelMsg) {
      homeEl.skelMsg.textContent = "Armando tu itinerario de 3 fases…";
    }
  }

  function renderError(topic) {
    var clean = prettyTopic(topic || home.topic || "tu tema");
    home.generated = false;
    if (homeEl.errorTopic) {
      homeEl.errorTopic.innerHTML = "No pudimos armar el itinerario de <b>" + esc(clean) + "</b>. No es culpa tuya: la conexión falló a mitad de camino.";
    }
  }

  /* Aplica un frame visual sin temporizadores: así los cuatro estados son
     deterministas para el shell y para los arneses de verificación. */
  function applyHomeFrame(key) {
    key = (key === "generando" || key === "itinerario" || key === "error") ? key : "inicio";
    home.frame = key;
    if (home.timer) { window.clearTimeout(home.timer); home.timer = null; }

    var generating = key === "generando";
    var ready = key === "itinerario";
    var failed = key === "error";

    if (homeEl.skel) { homeEl.skel.hidden = !generating; }
    if (homeEl.result) { homeEl.result.hidden = !ready; }
    if (homeEl.error) { homeEl.error.hidden = !failed; }
    if (homeEl.continueWrap) { homeEl.continueWrap.hidden = generating || ready || failed; }

    setHomeBusy(generating);
    if (generating) {
      showSkeleton();
      setHomeMakiState("think");
    } else if (ready) {
      setHomeMakiState("cheer");
    } else {
      setHomeMakiState("idle");
    }

    if (ready) {
      renderItinerary(home.topic || "Dijkstra en grafos");
    } else if (failed) {
      renderError(home.topic);
    } else {
      home.generated = false;
    }

    if (el.caption) { el.caption.textContent = HOME_FRAME_LABEL[key]; }
    if (el.main) { el.main.scrollTop = 0; }
    if (failed) { focusQuietly(homeEl.error); }
    setXPBase();
    return home.frame;
  }

  /* Fallo del servicio: estado de recuperación, nunca una puerta cerrada. */
  function simulateFailure(topic) {
    if (topic !== undefined) { setTopic(topic); }
    applyHomeFrame("error");
    haptic([10, 30, 10]);
    return home.frame;
  }

  /* Camino interactivo: esqueleto → itinerario con una pausa breve. */
  function startGeneration(topic) {
    if (topic !== undefined) { setTopic(topic); }
    var clean = home.topic;
    if (!clean) {
      toast("info", "Cuéntame un tema", "Escribe qué quieres estudiar o toca una de las ideas. Yo lo organizo.");
      restart(homeEl.field, "is-shake");
      haptic([8, 40, 8]);
      if (homeEl.input) { homeEl.input.setAttribute("aria-invalid", "true"); }
      focusQuietly(homeEl.input);
      return false;
    }

    if (homeEl.input) { homeEl.input.setAttribute("aria-invalid", "false"); }
    applyHomeFrame("generando");
    if (homeEl.form) { homeEl.form.setAttribute("aria-busy", "true"); }
    haptic(10);

    home.timer = window.setTimeout(function () {
      home.timer = null;
      if (homeEl.form) { homeEl.form.setAttribute("aria-busy", "false"); }
      renderItinerary(clean);
      applyHomeFrame("itinerario");
      confetti(16);
      bumpXP(20, "Tema guardado · +20 XP", "Decidir qué estudiar también cuenta. ¡Buen primer paso!");
      if (el.main) { el.main.scrollTop = 0; }
      /* anuncio: el foco acompaña al contenido nuevo */
      focusQuietly(homeEl.resultTitle);
    }, REDUCE ? 120 : 1200);

    return true;
  }

  function nextHomeMaki() {
    home.maki = (home.maki + 1) % HOME_MAKI.length;
    if (homeEl.makiQ) { homeEl.makiQ.textContent = HOME_MAKI[home.maki]; }
    setHomeMakiState(home.maki === 0 ? "idle" : "think");
    return HOME_MAKI[home.maki];
  }

  function initHome() {
    home.active = true;

    if (homeEl.form) {
      homeEl.form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (home.busy) { return; }
        startGeneration();
      });
    }

    if (homeEl.input) {
      homeEl.input.addEventListener("input", function () { setTopic(homeEl.input.value); });
    }

    if (homeEl.chips) {
      homeEl.chips.addEventListener("click", function (e) {
        var chip = e.target.closest ? e.target.closest(".jr-chip") : null;
        if (!chip || home.busy) { return; }
        focusQuietly(homeEl.input);
        startGeneration(chip.getAttribute("data-topic") || "");
      });
    }

    if (homeEl.phases) {
      homeEl.phases.addEventListener("click", function (e) {
        var row = e.target.closest ? e.target.closest(".jr-phase") : null;
        if (!row) { return; }
        var n = parseInt(row.getAttribute("data-phase"), 10) || 1;
        /* las fases bloqueadas también se pueden visitar: la propia pantalla
           de fase explica con calma que aún no toca (sin puertas cerradas) */
        window.location.href = "phase.html?phase=" + n;
      });
    }

    if (homeEl.start) {
      homeEl.start.addEventListener("click", function () {
        window.location.href = "phase.html?phase=1";
      });
    }

    if (homeEl.resume) {
      homeEl.resume.addEventListener("click", function () {
        window.location.href = "mobile.html?state=acierto";
      });
    }

    if (homeEl.makiIdea) {
      homeEl.makiIdea.addEventListener("click", function () {
        var pick = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
        haptic(8);
        toast("info", "Maki eligió por ti", "Nada de parálisis: empezamos por algo concreto y lo ajustamos después.");
        startGeneration(pick);
      });
    }

    /* ---- recuperación: el fallo nunca deja al estudiante sin salida ---- */
    if (homeEl.errorRetry) {
      homeEl.errorRetry.addEventListener("click", function () {
        toast("info", "Vamos otra vez", "Si vuelve a fallar, prueba con un plan base: no pierdes el tema.");
        startGeneration();
      });
    }

    if (homeEl.errorIdea) {
      homeEl.errorIdea.addEventListener("click", function () {
        var pick = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
        haptic(8);
        toast("info", "Otra idea, sin problema", "Cambiar de tema a tiempo también es inteligente.");
        startGeneration(pick);
      });
    }

    if (homeEl.errorPlan) {
      homeEl.errorPlan.addEventListener("click", function () {
        toast("info", "Plan base listo", "Tres fases genéricas con tu tema dentro: ajústalas cuando quieras.");
        applyHomeFrame("itinerario");
        focusQuietly(homeEl.resultTitle);
      });
    }

    if (homeEl.makiHelp) {
      homeEl.makiHelp.addEventListener("click", function () {
        nextHomeMaki();
        haptic(6);
      });
    }

    if (homeEl.avatar) {
      homeEl.avatar.addEventListener("click", function () {
        toast("info", "Perfil de Ana", "Racha de 5 días · nivel 7 · 1 de 3 medallas.");
      });
    }

    if (homeEl.tabs) {
      homeEl.tabs.addEventListener("click", function (e) {
        var tab = e.target.closest ? e.target.closest(".ml-tab") : null;
        if (!tab) { return; }
        if (tab.getAttribute("data-tab") === "perfil") {
          e.preventDefault();
          toast("info", "Próximamente", "Aquí vivirán tus medallas, tu racha y tus ajustes.");
        }
      });
    }

    var frame = "inicio";
    try {
      var raw = (new URLSearchParams(window.location.search).get("state") || "").toLowerCase();
      if (raw === "generando" || raw === "itinerario" || raw === "error") { frame = raw; }
    } catch (err) { /* sin URLSearchParams */ }

    if (!home.topic && (frame === "itinerario" || frame === "error")) {
      setTopic("Dijkstra en grafos");
    }
    applyHomeFrame(frame);
  }

  /* =======================================================================
     6. Pantalla 06 · Fase
     ======================================================================= */

  var phase = {
    active: false,
    n: 1,
    checks: {},
    quizDone: false,
    quizAttempts: 0,
    sent: false,
    openEdge: null,
    openTip: null,
    /* el XP del quiz de cada fase solo se otorga una vez por sesión */
    awarded: {},
    confettiRuns: 0
  };

  var phaseEl = {
    chip: $("#jr-phase-chip"),
    time: $("#jr-phase-time"),
    title: $("#jr-phase-title"),
    lead: $("#jr-phase-lead"),
    seg: $("#jr-phase-seg"),
    body: $("#jr-body"),
    prev: $("#jr-prev"),
    prevLabel: $("#jr-prev-label"),
    next: $("#jr-next"),
    nextLabel: $("#jr-next-label"),
    tabs: $("#jr-tabs"),
    avatar: $("#jr-avatar")
  };

  function locks(n) {
    if (!phase.checks[n]) {
      var p = otherPhase(n);
      var list = [];
      (p.blocks || []).forEach(function (b) {
        if (b.type === "checklist") {
          b.items.forEach(function () { list.push(false); });
        }
      });
      phase.checks[n] = list;
    }
    return phase.checks[n];
  }

  function checksTotal(n) {
    var p = otherPhase(n);
    var total = 0;
    (p.blocks || []).forEach(function (b) {
      if (b.type === "checklist") { total += b.items.length; }
    });
    return total;
  }

  function checksDone(n) {
    return locks(n).filter(Boolean).length;
  }

  /* ---------- render de bloques ---------- */

  function goalsHtml(p) {
    var items = p.goals.map(function (g) {
      return '<li class="jr-goal">' +
        '<span class="jr-goal__i" aria-hidden="true">' +
          '<svg class="od-icon icon i-14"><use href="' + (g.done ? "#i-check" : "#i-target") + '"></use></svg>' +
        '</span>' +
        '<span>' + esc(g.t) + '</span>' +
      '</li>';
    }).join("");

    var done = p.goals.filter(function (g) { return g.done; }).length;

    return '<section class="jr-block">' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' +
          '<svg class="od-icon icon i-14"><use href="#i-target"></use></svg>' +
        '</span>' +
        '<h2 class="jr-block__title">Qué vas a lograr</h2>' +
        '<span class="jr-badge-count">' + done + "/" + p.goals.length + '</span>' +
      '</div>' +
      '<ul class="jr-goals">' + items + '</ul>' +
    '</section>';
  }

  function linkHtml(l) {
    return '<section class="jr-continue">' +
      '<div class="jr-continue__row">' +
        '<span class="jr-continue__thumb" aria-hidden="true">' +
          '<svg class="od-icon icon i-20"><use href="#i-play"></use></svg>' +
        '</span>' +
        '<span class="jr-continue__meta">' +
          '<span class="jr-continue__kicker">' + esc(l.kicker) + '</span>' +
          '<span class="jr-continue__t">' + esc(l.title) + '</span>' +
        '</span>' +
      '</div>' +
      '<p class="jr-block__text">' + esc(l.note) + '</p>' +
      '<a class="btn btn--primary" href="' + esc(l.href) + '">' + esc(l.cta) +
        '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-arrow-right"></use></svg>' +
      '</a>' +
    '</section>';
  }

  function conceptHtml(b, n) {
    return '<section class="jr-block">' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' + n + '</span>' +
        '<h2 class="jr-block__title">' + esc(b.title) + '</h2>' +
      '</div>' +
      '<p class="jr-block__text">' + b.text + '</p>' +
      '<p class="jr-analogy"><span aria-hidden="true">' + b.emoji + '</span> Analogía: ' + esc(b.analogy) + '</p>' +
    '</section>';
  }

  function stepsHtml(b, n) {
    var items = b.steps.map(function (s) {
      return '<li class="jr-step"><span class="jr-step__n" aria-hidden="true"></span><span>' + s + '</span></li>';
    }).join("");
    return '<section class="jr-block">' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' + n + '</span>' +
        '<h2 class="jr-block__title">' + esc(b.title) + '</h2>' +
      '</div>' +
      '<ol class="jr-steps">' + items + '</ol>' +
    '</section>';
  }

  function codeHtml(b, n) {
    var meta = b.meta.map(function (m) {
      return '<div class="jr-meta__row">' +
        '<span class="jr-meta__k">' + esc(m.k) + '</span>' +
        '<span class="jr-meta__v">' + m.v + '</span>' +
      '</div>';
    }).join("");

    return '<section class="jr-block">' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' + n + '</span>' +
        '<h2 class="jr-block__title">' + esc(b.title) + '</h2>' +
      '</div>' +
      '<div class="jr-code">' +
        '<div class="jr-code__bar"><span>' + esc(b.bar) + '</span>' +
          '<span>toca lo subrayado</span>' +
        '</div>' +
        '<pre>' + b.code + '</pre>' +
      '</div>' +
      '<div class="jr-tip" id="jr-tip" hidden></div>' +
      '<div class="jr-meta">' + meta + '</div>' +
    '</section>';
  }

  function edgeHtml(b, n) {
    var rows = b.rows.map(function (r, i) {
      var whyId = "jr-edge-why-" + n + "-" + i;
      return '<div class="jr-edge__item">' +
          '<button class="jr-edge__row" type="button" data-edge="' + i + '" aria-expanded="false"' +
            ' aria-controls="' + whyId + '">' +
            '<span class="jr-edge__case">' +
              '<span class="jr-edge__c">' + esc(r.c) + '</span>' +
              '<span class="jr-edge__e">' + esc(r.e) + '</span>' +
            '</span>' +
            '<svg class="od-icon icon i-16 jr-edge__chev" aria-hidden="true"><use href="#i-chevron-right"></use></svg>' +
          '</button>' +
          '<p class="jr-edge__why" id="' + whyId + '" hidden>' + esc(r.why) + '</p>' +
        '</div>';
    }).join("");
    return '<section class="jr-block">' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' + n + '</span>' +
        '<h2 class="jr-block__title">' + esc(b.title) + '</h2>' +
      '</div>' +
      '<div class="jr-edge">' + rows + '</div>' +
    '</section>';
  }

  function checklistHtml(b, n) {
    var items = b.items.map(function (it, i) {
      return '<button class="jr-check" type="button" data-check="' + i + '" aria-pressed="false">' +
          '<span class="jr-check__box" aria-hidden="true">' +
            '<svg class="od-icon icon i-14"><use href="#i-check"></use></svg>' +
          '</span>' +
          '<span class="jr-check__body">' +
            '<span class="jr-check__t">' + esc(it.t) + '</span>' +
            '<span class="jr-check__h">' + esc(it.h) + '</span>' +
          '</span>' +
        '</button>';
    }).join("");

    return '<section class="jr-block jr-block--check" data-checklist>' +
      '<div class="jr-block__head">' +
        '<span class="jr-block__n" aria-hidden="true">' + n + '</span>' +
        '<h2 class="jr-block__title">' + esc(b.title) + '</h2>' +
      '</div>' +
      '<div class="jr-checks">' + items + '</div>' +
      '<div class="jr-checkprog">' +
        '<div class="jr-checkprog__row">' +
          '<span>Progreso de la checklist</span>' +
          '<span><b id="jr-checks-done">0</b> / ' + b.items.length + '</span>' +
        '</div>' +
        '<div class="jr-bar"><span class="jr-bar__i" id="jr-checks-bar"></span></div>' +
      '</div>' +
      '<div class="jr-alert jr-alert--mint" id="jr-check-msg" hidden>' +
        '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-check"></use></svg>' +
        '<span><b>Checklist completa.</b> Puedes entregar cuando quieras; si algo se rompe, es una pista, no un fracaso.</span>' +
      '</div>' +
    '</section>';
  }

  function quizHtml(b, n) {
    var opts = b.options.map(function (o) {
      return '<label class="quiz-opt" data-opt="' + o.id + '">' +
          '<input type="radio" name="jr-quiz-answer" value="' + o.id + '">' +
          '<span class="quiz-opt__key" aria-hidden="true">' + o.id.toUpperCase() + '</span>' +
          '<span class="quiz-opt__text">' + esc(o.text) + '</span>' +
          '<span class="quiz-opt__state" aria-hidden="true"></span>' +
        '</label>';
    }).join("");

    return '<section class="quiz ml-quiz" id="jr-quiz" data-quiz data-correct="' + b.correct + '"' +
        ' data-correct-title="' + esc(b.correctTitle) + '"' +
        ' data-correct-msg="' + esc(b.correctMsg) + '"' +
        ' data-wrong-title="' + esc(b.wrongTitle) + '"' +
        ' data-wrong-msg="' + esc(b.wrongMsg) + '">' +
      '<div class="quiz__top">' +
        '<span class="badge badge--violet">Comprobación · Fase ' + phase.n + '</span>' +
        '<span class="xp"><svg class="od-icon icon i-14" aria-hidden="true"><use href="#i-bolt"></use></svg><b>50</b><span>XP</span></span>' +
      '</div>' +
      '<form id="jr-quiz-form">' +
        '<h2 id="jr-quiz-q">' + esc(b.title) + '</h2>' +
        '<fieldset class="quiz__options">' +
          '<legend class="sr-only">Elige una respuesta</legend>' + opts +
        '</fieldset>' +
        '<div class="quiz__actions">' +
          '<button class="btn btn--primary" type="submit" data-quiz-submit hidden>Comprobar</button>' +
          '<button class="btn btn--secondary" type="button" data-quiz-retry>Reintentar</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" id="jr-hint-btn" hidden>' +
            '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-bulb"></use></svg> Ver pista' +
          '</button>' +
          '<span class="quiz__hint">Sin penalización en el primer intento</span>' +
        '</div>' +
        '<div class="quiz__feedback" data-quiz-feedback aria-live="polite">' +
          '<svg class="od-icon icon i-18" aria-hidden="true"><use data-quiz-icon href="#i-check"></use></svg>' +
          '<div><strong data-quiz-title></strong><p data-quiz-msg></p></div>' +
        '</div>' +
        '<p class="ml-hintbox" id="jr-hintbox" hidden>' +
          '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-bulb"></use></svg>' +
          '<span>' + b.hint + '</span>' +
        '</p>' +
      '</form>' +
    '</section>';
  }

  function makiHtml(p) {
    return '<section class="jr-maki" aria-labelledby="jr-maki-who">' +
      '<svg class="maki maki-avatar" data-maki data-state="think" viewBox="0 0 160 160" role="img" aria-label="Maki, tu acompañante de MakerLearn">' +
        '<ellipse cx="80" cy="146" rx="36" ry="6" fill="rgba(0,0,0,.14)"/>' +
        '<path d="M34 50 28 22 58 32Z" fill="#5A3BE0" stroke="#5A3BE0" stroke-width="7" stroke-linejoin="round"/>' +
        '<path d="M126 50 132 22 102 32Z" fill="#5A3BE0" stroke="#5A3BE0" stroke-width="7" stroke-linejoin="round"/>' +
        '<rect x="26" y="30" width="108" height="46" rx="18" fill="#8B5CF6"/>' +
        '<rect x="20" y="62" width="120" height="70" rx="18" fill="#6C4CF1"/>' +
        '<path d="M46 66h68" stroke="#9A7BFF" stroke-width="2" stroke-linecap="round" opacity=".55"/>' +
        '<g class="maki__blink maki__eyes-open">' +
          '<circle cx="58" cy="90" r="17" fill="#F4F5FA"/><circle cx="102" cy="90" r="17" fill="#F4F5FA"/>' +
          '<circle cx="61" cy="92" r="6.5" fill="#1A1D2A"/><circle cx="99" cy="92" r="6.5" fill="#1A1D2A"/>' +
          '<circle cx="63.5" cy="89" r="2.2" fill="#F4F5FA"/><circle cx="101.5" cy="89" r="2.2" fill="#F4F5FA"/>' +
        '</g>' +
        '<g class="maki__eyes-think">' +
          '<circle cx="58" cy="90" r="15" fill="#F4F5FA"/><circle cx="102" cy="90" r="15" fill="#F4F5FA"/>' +
          '<circle cx="58" cy="90" r="5.5" fill="#1A1D2A"/><circle cx="104" cy="86" r="6.5" fill="#1A1D2A"/>' +
          '<circle cx="60" cy="88" r="2" fill="#F4F5FA"/><circle cx="106" cy="84" r="2.2" fill="#F4F5FA"/>' +
        '</g>' +
        '<g class="maki__eyes-happy">' +
          '<path d="M46 92c4-7 10-7 12 0" fill="none" stroke="#1A1D2A" stroke-width="4.5" stroke-linecap="round"/>' +
          '<path d="M90 92c6-6 12-4 14-1" fill="none" stroke="#1A1D2A" stroke-width="4.5" stroke-linecap="round"/>' +
        '</g>' +
        '<path d="M80 100 88 110 80 120 72 110Z" fill="#FFB020"/>' +
        '<path d="M80 124v8M80 132h-15M80 132h15" fill="none" stroke="#00D4A0" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="64" cy="132" r="3.2" fill="#00D4A0"/><circle cx="96" cy="132" r="3.2" fill="#00D4A0"/>' +
        '<g class="maki__thought" fill="#B3A1FF"><circle cx="128" cy="30" r="4.5"/><circle cx="138" cy="21" r="3.2"/><circle cx="146" cy="13" r="2.2"/></g>' +
        '<g class="maki__sparkles">' +
          '<path d="m24 38 2.4 6.8L33 47l-6.6 2.2L24 56l-2.4-6.8L15 47l6.6-2.2L24 38Z" fill="#B3A1FF"/>' +
          '<path d="m138 66 1.9 5.3 5.1 1.7-5.1 1.7-1.9 5.3-1.9-5.3-5.1-1.7 5.1-1.7 1.9-5.3Z" fill="#00D4A0"/>' +
          '<path d="m132 112 1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6 1.6-4.4Z" fill="#FFB020"/>' +
        '</g>' +
      '</svg>' +
      '<div class="jr-maki__body">' +
        '<span class="jr-maki__who" id="jr-maki-who">Maki · tu acompañante</span>' +
        '<p class="jr-maki__q" id="jr-maki-q">' + esc(p.maki.ask) + '</p>' +
        '<div class="jr-maki__actions">' +
          '<button class="jr-maki__btn" type="button" data-maki="hint">' +
            '<svg class="od-icon icon i-14" aria-hidden="true"><use href="#i-bulb"></use></svg> Dame una pista' +
          '</button>' +
          '<button class="jr-maki__btn" type="button" data-maki="easy">' +
            '<svg class="od-icon icon i-14" aria-hidden="true"><use href="#i-info"></use></svg> Explícamelo fácil' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderBlock(b, index) {
    if (b.type === "concept") { return conceptHtml(b, index); }
    if (b.type === "steps") { return stepsHtml(b, index); }
    if (b.type === "code") { return codeHtml(b, index); }
    if (b.type === "edge") { return edgeHtml(b, index); }
    if (b.type === "checklist") { return checklistHtml(b, index); }
    if (b.type === "quiz") { return quizHtml(b, index); }
    return "";
  }

  function renderPhase(n) {
    var p = otherPhase(n);
    phase.n = p.n;

    /* ---- cabecera ---- */
    if (phaseEl.chip) { phaseEl.chip.textContent = "Fase " + p.n + " de 3"; }
    if (phaseEl.time) { phaseEl.time.textContent = p.time; }
    if (phaseEl.title) { phaseEl.title.textContent = p.title; }
    if (phaseEl.lead) { phaseEl.lead.innerHTML = p.lead; }
    if (phaseEl.seg) {
      phaseEl.seg.setAttribute("aria-label", "Avance de la Fase " + p.n);
      phaseEl.seg.setAttribute("aria-valuenow", String(p.progress));
      phaseEl.seg.setAttribute("aria-valuetext", p.progress + " de 4 objetivos");
      var cells = "";
      for (var i = 0; i < 4; i++) { cells += '<span class="ml-seg__i' + (i < p.progress ? " is-full" : "") + '"></span>'; }
      phaseEl.seg.innerHTML = cells;
    }

    /* ---- cuerpo ---- */
    if (phaseEl.body) {
      var out = [];
      if (p.lockedNote) {
        out.push('<p class="jr-alert">' +
          '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-lock"></use></svg>' +
          '<span>' + esc(p.lockedNote) + '</span></p>');
      }
      if (p.link) { out.push(linkHtml(p.link)); }
      out.push(goalsHtml(p));
      p.blocks.forEach(function (b, i) { out.push(renderBlock(b, i + 1)); });
      out.push(makiHtml(p));
      phaseEl.body.innerHTML = out.join("");
    }

    /* ---- acciones ---- */
    if (phaseEl.prevLabel) { phaseEl.prevLabel.textContent = p.n === 1 ? "Inicio" : "Fase " + (p.n - 1); }
    if (phaseEl.prev) {
      var usePrev = $("use", phaseEl.prev);
      if (usePrev) { usePrev.setAttribute("href", p.n === 1 ? "#i-home" : "#i-arrow-left"); }
      phaseEl.prev.setAttribute("aria-label", p.n === 1 ? "Volver a Inicio" : "Ir a la Fase " + (p.n - 1));
    }
    if (phaseEl.nextLabel) {
      phaseEl.nextLabel.innerHTML = p.n === 3
        ? '<span aria-hidden="true">📤</span> Enviar a MakerLearn'
        : "Ir a la Fase " + (p.n + 1);
    }
    if (phaseEl.next) {
      var useNext = $("use", phaseEl.next);
      if (useNext) { useNext.setAttribute("href", p.n === 3 ? "#i-send" : "#i-arrow-right"); }
    }

    if (el.caption) { el.caption.textContent = "Fase " + p.n; }
    if (el.main) { el.main.scrollTop = 0; }
    return p.n;
  }

  /* ---------- checklist ---------- */

  function syncChecklist() {
    var total = checksTotal(phase.n);
    var done = checksDone(phase.n);
    var bar = $("#jr-checks-bar");
    var out = $("#jr-checks-done");
    var msg = $("#jr-check-msg");

    if (bar) { bar.style.width = (total ? (done / total) * 100 : 0) + "%"; }
    if (out) { out.textContent = String(done); }
    if (msg) { msg.hidden = done !== total || total === 0; }

    $$("[data-check]").forEach(function (btn) {
      var i = parseInt(btn.getAttribute("data-check"), 10);
      var on = !!locks(phase.n)[i];
      btn.classList.toggle("is-done", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    return done;
  }

  function toggleCheck(index, force) {
    var list = locks(phase.n);
    if (!list.length) { return 0; }
    if (typeof index !== "number") { index = 0; }
    var next = (force === undefined) ? !list[index] : !!force;
    list[index] = next;

    var done = syncChecklist();
    haptic(6);

    if (next && done === list.length) {
      toast("success", "Checklist completa", "Nada te frena para entregar. Puedes reenviar las veces que necesites.");
    }
    return done;
  }

  /* ---------- código: tips + casos límite ---------- */

  function openTip(index) {
    var tip = $("#jr-tip");
    var p = otherPhase(phase.n);
    var code = null;
    (p.blocks || []).forEach(function (b) { if (b.type === "code") { code = b; } });
    if (!tip || !code) { return null; }

    $$("[data-fn]").forEach(function (btn) {
      btn.classList.toggle("is-active", parseInt(btn.getAttribute("data-fn"), 10) === index);
    });

    if (phase.openTip === index) {
      phase.openTip = null;
      tip.hidden = true;
      $$("[data-fn]").forEach(function (btn) { btn.classList.remove("is-active"); });
      return null;
    }

    var t = code.tips[index];
    if (!t) { return null; }
    phase.openTip = index;
    tip.hidden = false;
    tip.innerHTML = '<span class="jr-tip__k">' + esc(t.k) + '</span>' +
      '<span class="jr-tip__v">' + t.v + '</span>';
    return t.k;
  }

  function toggleEdge(index) {
    var rows = $$("[data-edge]");
    var row = null;
    rows.forEach(function (r) { if (parseInt(r.getAttribute("data-edge"), 10) === index) { row = r; } });
    if (!row) { return null; }
    var why = row.nextElementSibling;
    var open = phase.openEdge !== index;

    rows.forEach(function (r) {
      r.classList.remove("is-open");
      r.setAttribute("aria-expanded", "false");
    });

    if (why && why.classList.contains("jr-edge__why")) { why.hidden = !open; }

    if (open) {
      row.classList.add("is-open");
      row.setAttribute("aria-expanded", "true");
      phase.openEdge = index;
      haptic(6);
      return index;
    }
    phase.openEdge = null;
    return null;
  }

  /* ---------- quiz ---------- */

  function resetQuiz() {
    var quiz = $("#jr-quiz");
    if (!quiz) { return; }
    $$(".quiz-opt", quiz).forEach(function (o) {
      o.classList.remove("is-correct", "is-wrong");
      var input = $("input", o);
      if (input) { input.checked = false; }
    });
    var fb = $("[data-quiz-feedback]", quiz);
    if (fb) { fb.className = "quiz__feedback"; fb.hidden = true; }
    var hintbox = $("#jr-hintbox");
    if (hintbox) { hintbox.hidden = true; }
    var hintBtn = $("#jr-hint-btn");
    if (hintBtn) { hintBtn.hidden = true; }
    var submit = $("[data-quiz-submit]", quiz);
    if (submit) { submit.hidden = false; }
    quiz.classList.remove("is-shake", "is-pop", "is-locked");
    phase.quizDone = false;
    phase.quizAttempts = 0;
  }

  function answerQuiz(value) {
    var quiz = $("#jr-quiz");
    if (!quiz) { return null; }
    var correct = quiz.getAttribute("data-correct") || "b";
    var right = value === correct;

    $$(".quiz-opt", quiz).forEach(function (o) {
      var v = o.getAttribute("data-opt");
      o.classList.remove("is-correct", "is-wrong");
      if (v === value) { o.classList.add(right ? "is-correct" : "is-wrong"); }
      if (!right && v === correct) { o.classList.add("is-correct"); }
      var input = $("input", o);
      if (input) { input.checked = v === value; }
    });

    var fb = $("[data-quiz-feedback]", quiz);
    if (fb) {
      fb.hidden = false;
      fb.className = "quiz__feedback is-visible " + (right ? "is-correct" : "is-wrong");
      var title = $("[data-quiz-title]", fb);
      var msg = $("[data-quiz-msg]", fb);
      var icon = $("[data-quiz-icon]", fb);
      if (title) { title.textContent = quiz.getAttribute(right ? "data-correct-title" : "data-wrong-title") || ""; }
      if (msg) { msg.textContent = quiz.getAttribute(right ? "data-correct-msg" : "data-wrong-msg") || ""; }
      if (icon) { icon.setAttribute("href", right ? "#i-check" : "#i-x"); }
    }

    restart(quiz, right ? "is-pop" : "is-shake");
    quiz.classList.add("is-locked");
    var submit = $("[data-quiz-submit]", quiz);
    if (submit) { submit.hidden = true; }
    var hintBtn = $("#jr-hint-btn");
    if (hintBtn) { hintBtn.hidden = right; }

    if (right) {
      phase.quizDone = true;
      if (!phase.awarded[phase.n]) {
        phase.awarded[phase.n] = true;
        bumpXP(50, "¡Correcto! +50 XP", "Lo has razonado, no adivinado. Así se queda.");
        confetti(14);
        phase.confettiRuns += 1;
      }
    } else {
      phase.quizAttempts += 1;
      haptic([10, 30, 10]);
    }

    return right;
  }

  /* ---------- entrega (Fase 3) ---------- */

  function entregar() {
    var total = checksTotal(3);
    var done = checksDone(3);
    if (phase.sent) {
      toast("info", "Ya la enviaste", "Puedes reenviar cuando quieras: guardamos tu última versión.");
      return true;
    }
    if (done < total) {
      toast("info", "Casi lo tienes", "Te faltan " + (total - done) + " puntos de la checklist. Sin prisa: revísalos y vuelve a enviar.");
      var block = $("[data-checklist]");
      if (block) { scrollTo(block, 70); }
      haptic(8);
      return false;
    }

    phase.sent = true;
    confetti(26);
    phase.confettiRuns += 1;
    bumpXP(120, "¡Enviado a MakerLearn!", "Fase 3 entregada. Si algo se rompe, es una pista: puedes reenviar.");

    var p = otherPhase(3);
    var q = $("#jr-maki-q");
    if (q && p.defense) { q.textContent = p.defense; }
    var maki = $(".maki", $(".jr-maki"));
    if (maki) { maki.setAttribute("data-state", "cheer"); }
    return true;
  }

  /* ---------- interacción delegada ---------- */

  function initPhase() {
    phase.active = true;

    if (phaseEl.body) {
      phaseEl.body.addEventListener("click", function (e) {
        var target = e.target;

        var check = target.closest ? target.closest("[data-check]") : null;
        if (check) { toggleCheck(parseInt(check.getAttribute("data-check"), 10)); return; }

        var fn = target.closest ? target.closest("[data-fn]") : null;
        if (fn) { openTip(parseInt(fn.getAttribute("data-fn"), 10)); return; }

        var edge = target.closest ? target.closest("[data-edge]") : null;
        if (edge) { toggleEdge(parseInt(edge.getAttribute("data-edge"), 10)); return; }

        var makiBtn = target.closest ? target.closest("[data-maki]") : null;
        if (makiBtn) {
          var p = otherPhase(phase.n);
          var q = $("#jr-maki-q");
          var kind = makiBtn.getAttribute("data-maki");
          if (q) { q.textContent = kind === "hint" ? p.maki.hint : p.maki.easy; }
          var svg = $(".maki", $(".jr-maki"));
          if (svg) { svg.setAttribute("data-state", kind === "hint" ? "think" : "cheer"); }
          haptic(6);
          return;
        }
      });

      /* quiz: mismo contrato que la pantalla 03 */
      phaseEl.body.addEventListener("submit", function (e) {
        var form = e.target;
        if (!form || form.id !== "jr-quiz-form") { return; }
        e.preventDefault();
        var picked = $('input[name="jr-quiz-answer"]:checked', form);
        if (picked) { answerQuiz(picked.value); }
      });

      phaseEl.body.addEventListener("change", function (e) {
        var input = e.target;
        if (!input || input.name !== "jr-quiz-answer") { return; }
        var quiz = $("#jr-quiz");
        if (quiz && quiz.classList.contains("is-locked")) { return; }
        answerQuiz(input.value);
      });

      phaseEl.body.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("[data-quiz-retry]")) {
          resetQuiz();
          return;
        }
        if (e.target.closest && e.target.closest("#jr-hint-btn")) {
          var hintbox = $("#jr-hintbox");
          if (hintbox) { hintbox.hidden = false; }
          var btn = $("#jr-hint-btn");
          if (btn) { btn.hidden = true; }
        }
      });
    }

    if (phaseEl.prev) {
      phaseEl.prev.addEventListener("click", function () {
        if (phase.n === 1) { window.location.href = "home.html"; }
        else { window.location.href = "phase.html?phase=" + (phase.n - 1); }
      });
    }

    if (phaseEl.next) {
      phaseEl.next.addEventListener("click", function () {
        if (phase.n === 3) { entregar(); return; }
        window.location.href = "phase.html?phase=" + (phase.n + 1);
      });
    }

    if (phaseEl.avatar) {
      phaseEl.avatar.addEventListener("click", function () {
        toast("info", "Perfil de Ana", "Racha de 5 días · nivel 7 · 1 de 3 medallas.");
      });
    }

    if (phaseEl.tabs) {
      phaseEl.tabs.addEventListener("click", function (e) {
        var tab = e.target.closest ? e.target.closest(".ml-tab") : null;
        if (!tab) { return; }
        if (tab.getAttribute("data-tab") === "perfil") {
          e.preventDefault();
          toast("info", "Próximamente", "Aquí vivirán tus medallas, tu racha y tus ajustes.");
        }
      });
    }

    var n = 1;
    try {
      var raw = parseInt(new URLSearchParams(window.location.search).get("phase"), 10);
      if (raw === 1 || raw === 2 || raw === 3) { n = raw; }
    } catch (err) { /* sin URLSearchParams */ }

    setPhase(n);
  }

  function setPhase(n) {
    phase.quizDone = false;
    phase.quizAttempts = 0;
    phase.openEdge = null;
    phase.openTip = null;
    locks(n);
    renderPhase(n);
    syncChecklist();
    resetQuiz();
    setXPBase();
    return phase.n;
  }

  /* =======================================================================
     7. Escala del dispositivo (misma regla que la pantalla 03)
     ======================================================================= */

  function fitDevice() {
    if (!window.innerWidth || window.innerWidth <= 430) {
      document.documentElement.style.removeProperty("--ml-scale");
      return;
    }
    var scale = Math.min(1, (window.innerHeight - 116) / 844, (window.innerWidth - 40) / 390);
    scale = Math.max(0.38, scale);
    document.documentElement.style.setProperty("--ml-scale", scale.toFixed(4));
  }

  window.addEventListener("resize", fitDevice);

  /* =======================================================================
     8. Arranque + API para el shell React y los arneses
     ======================================================================= */

  window.mlJourney = {
    /* Inicio */
    setHomeFrame: function (key) { return applyHomeFrame(key); },
    getHomeFrame: function () { return home.frame; },
    setTopic: setTopic,
    getTopic: function () { return home.topic; },
    generate: function (topic) { return startGeneration(topic); },
    fail: function (topic) { return simulateFailure(topic); },
    isGenerated: function () { return !!home.generated; },
    suggestions: SUGGESTIONS.slice(),
    makiMessage: function () {
      var node = document.querySelector("#jr-maki-q");
      return node ? node.textContent : null;
    },

    /* Fase */
    setPhase: setPhase,
    getPhase: function () { return phase.n; },
    getPhaseTitle: function () { return phaseEl.title ? phaseEl.title.textContent : null; },
    toggleCheck: toggleCheck,
    checklistDone: function () { return checksDone(phase.n); },
    checklistTotal: function () { return checksTotal(phase.n); },
    openEdge: toggleEdge,
    openTip: openTip,
    answerQuiz: answerQuiz,
    resetQuiz: resetQuiz,
    isQuizDone: function () { return !!phase.quizDone; },
    entregar: entregar,
    isSent: function () { return !!phase.sent; },

    /* Comunes */
    toast: toast,
    confetti: confetti,
    toastCount: function () { return el.toasts ? el.toasts.children.length : 0; },
    confettiRuns: function () { return phase.confettiRuns; },
    xp: function () { return groupThousands(xpValue); },
    xpDom: function () { return el.xpOut ? el.xpOut.textContent : null; },
    version: "1.0.0"
  };

  fitDevice();

  if ($("#jr-form")) { initHome(); }
  else if ($("#jr-phase-title")) { initPhase(); }
})();
