/* ============================================================================
   MakerLearn Studio · Pantalla 04 — Ecosistema de extensión
   Bridge Extension + panel lateral InsightLens.

   Contrato de estados (query string, igual que las pantallas 02 y 03):
     extension.html                → auditoría mixta (1 verificada · 1 ambigua · 1 falsa)
     extension.html?state=verificado   → las 3 fuentes verificadas + confeti + aviso «listo para entregar»
     extension.html?state=alucinacion  → fuente roja pulsante + alerta «no entregues esta cita»

   API pública para QA / shell React: window.mlExtension
   ========================================================================== */
(function () {
  "use strict";

  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FRAME_LABELS = {
    base: "Auditoría mixta",
    verificado: "Todo verificado",
    alucinacion: "Alucinación crítica"
  };

  /* ---------------------------------------------------------------- datos de citas */
  var BASE_CITES = [
    {
      id: "cormen",
      sev: "ok",
      label: "Verificada",
      title: "Cormen, T. H. — Introduction to Algorithms (3rd ed.)",
      meta: "MIT Press · 2009 · §24.3 · pp. 658–662",
      badge: "CrossRef",
      badgeKind: "mint",
      note: "Coincide con CrossRef y Google Scholar.",
      tooltip: "DOI 10.5555/1074034 · ISBN 978-0-262-03384-8 · 1 coincidencia exacta",
      link: { label: "Ver paper", icon: "i-link" }
    },
    {
      id: "dijkstra",
      sev: "warn",
      label: "Ambigua",
      title: "Dijkstra, E. W. (1959) — A note on two problems in connexion with graphs",
      meta: "Numerische Mathematik · vol. 1 · pp. 269–271",
      badge: "DOI pendiente",
      badgeKind: "amber",
      note: "Título coincide, autor existe; revisa DOI.",
      tooltip: "Autor y revista existen · falta enlazar el DOI · 1 coincidencia parcial",
      link: { label: "Revisar DOI", icon: "i-search" }
    },
    {
      id: "smith",
      sev: "bad",
      label: "Alucinación detectada",
      title: "Smith, J. (2021). Deep Dijkstra Optimization. IEEE.",
      meta: "Autor y revista sin registro bibliográfico",
      badge: "No encontrada",
      badgeKind: "coral",
      note: "No existe en Google Scholar, CrossRef ni arXiv.",
      tooltip: "0 coincidencias · firma bibliográfica inválida · posible cita inventada",
      action: { label: "Reportar al modelo", icon: "i-alert" }
    }
  ];

  function verifiedSet() {
    return BASE_CITES.map(function (c) {
      return {
        id: c.id,
        sev: "ok",
        label: "Verificada",
        title: c.title,
        meta: c.meta,
        badge: "CrossRef",
        badgeKind: "mint",
        note: "Verificada en CrossRef y Google Scholar. Lista para citar.",
        tooltip: c.tooltip,
        link: { label: "Ver paper", icon: "i-link" }
      };
    });
  }

  var CITE_SETS = {
    base: BASE_CITES,
    verificado: verifiedSet(),
    alucinacion: BASE_CITES
  };

  /* ---------------------------------------------------------------- helpers */
  var $ = function (sel) { return document.querySelector(sel); };
  var el = {
    screen: $("#xl-screen"),
    scaler: $("#xl-scaler"),
    caption: $("#xl-caption-state"),
    cites: $("#xl-cites"),
    tallyText: $("#xl-tally-text"),
    tallyBar: $("#xl-tally-bar"),
    alertOk: $("#xl-alert-ok"),
    alertBad: $("#xl-alert-bad"),
    bridge: $("#xl-bridge"),
    bridgeMaki: $("#xl-bridge .maki"),
    panel: $("#xl-panel"),
    toggle: $("#xl-toggle"),
    toggleLabel: $("#xl-toggle-label"),
    collapse: $("#xl-collapse"),
    toasts: $("#xl-toasts"),
    confetti: $("#xl-confetti"),
    chips: $("#xl-chips"),
    send: $("#xl-send"),
    checkProgress: $("#xl-check-progress")
  };

  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  function haptic(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* noop */ } }
  }

  /* ---------------------------------------------------------------- toasts */
  var TOAST_ICON = { success: "i-check", info: "i-sparkles", warn: "i-info", error: "i-alert" };
  var toastCount = 0;
  function toast(kind, title, msg) {
    if (!el.toasts) { return; }
    toastCount += 1;
    var node = document.createElement("div");
    node.className = "xl-toast xl-toast--" + kind;
    node.setAttribute("role", kind === "error" ? "alert" : "status");
    node.innerHTML =
      '<span class="xl-toast__icon" aria-hidden="true"><svg><use href="#' +
      (TOAST_ICON[kind] || "i-info") + '"></use></svg></span>' +
      '<span><strong class="xl-toast__title"></strong><span class="xl-toast__msg"></span></span>';
    node.querySelector(".xl-toast__title").textContent = title;
    node.querySelector(".xl-toast__msg").textContent = msg || "";
    el.toasts.appendChild(node);
    window.setTimeout(function () {
      node.classList.add("is-out");
      window.setTimeout(function () { node.remove(); }, 240);
    }, 3400);
  }

  /* ---------------------------------------------------------------- confeti */
  var CONF_COLORS = ["#6C4CF1", "#8B5CF6", "#00D4A0", "#FFB020", "#FF5470"];
  var confettiRuns = 0;
  function confetti(count) {
    if (!el.confetti || REDUCE) { return; }
    confettiRuns += 1;
    var n = count || 44;
    for (var i = 0; i < n; i++) {
      var bit = document.createElement("i");
      bit.className = "xl-confetti__bit";
      bit.style.left = (18 + Math.random() * 64) + "%";
      bit.style.background = CONF_COLORS[i % CONF_COLORS.length];
      bit.style.setProperty("--xl-cf-x", (Math.random() * 260 - 130).toFixed(0) + "px");
      bit.style.setProperty("--xl-cf-dur", (1300 + Math.random() * 900).toFixed(0) + "ms");
      bit.style.animationDelay = (Math.random() * 260).toFixed(0) + "ms";
      el.confetti.appendChild(bit);
      (function (node) {
        window.setTimeout(function () { node.remove(); }, 2600);
      })(bit);
    }
  }

  /* ---------------------------------------------------------------- Maki */
  var makiTimer = null;
  function makiWink() {
    if (!el.bridgeMaki) { return; }
    el.bridgeMaki.setAttribute("data-state", "wink");
    if (makiTimer) { window.clearTimeout(makiTimer); }
    makiTimer = window.setTimeout(function () {
      el.bridgeMaki.setAttribute("data-state", "open");
    }, 1000);
  }

  /* ---------------------------------------------------------------- estado */
  var frame = "base";

  function renderCites(severity, flagAlert) {
    var set = CITE_SETS[severity] || CITE_SETS.base;
    el.cites.innerHTML = "";

    set.forEach(function (c) {
      var li = document.createElement("li");
      li.className = "xl-cite-card";
      li.setAttribute("data-sev", c.sev);
      li.setAttribute("data-cite", c.id);
      if (flagAlert && c.sev === "bad") { li.classList.add("is-alert"); }

      var actions = "";
      if (c.link) {
        actions +=
          '<button class="xl-linkbtn" type="button" data-act="open" data-cite-id="' + c.id + '"' +
          ' aria-label="' + c.link.label + ': ' + c.title.replace(/"/g, "&quot;") + '">' +
          '<svg aria-hidden="true"><use href="#' + c.link.icon + '"></use></svg>' + c.link.label + '</button>';
      }
      if (c.action) {
        actions +=
          '<button class="xl-linkbtn xl-linkbtn--danger" type="button" data-act="report" data-cite-id="' + c.id + '"' +
          ' aria-label="Reportar al modelo la cita inventada: ' + c.title.replace(/"/g, "&quot;") + '">' +
          '<svg aria-hidden="true"><use href="#' + c.action.icon + '"></use></svg>' + c.action.label + '</button>';
      }

      li.innerHTML =
        '<div class="xl-cite-card__row">' +
          '<span class="xl-sema" aria-hidden="true"></span>' +
          '<span class="xl-sev-label">' + c.label + '</span>' +
          '<span class="badge badge--' + c.badgeKind + ' xl-cite-card__badge">' + c.badge + '</span>' +
        '</div>' +
        '<p class="xl-cite-card__title" data-tip="' + c.tooltip.replace(/"/g, "&quot;") + '" tabindex="0">' + c.title + '</p>' +
        '<p class="xl-cite-card__meta">' + c.meta + '</p>' +
        '<p class="xl-cite-card__note">' + c.note + '</p>' +
        (actions ? '<div class="xl-cite-card__actions">' + actions + '</div>' : "");

      el.cites.appendChild(li);
    });

    var ok = 0, warn = 0, bad = 0;
    set.forEach(function (c) {
      if (c.sev === "ok") { ok += 1; }
      else if (c.sev === "warn") { warn += 1; }
      else { bad += 1; }
    });

    el.tallyText.textContent =
      set.length + " fuentes · " + ok + " verificada" + (ok === 1 ? "" : "s") +
      " · " + warn + " ambigua" + (warn === 1 ? "" : "s") +
      " · " + bad + " falsa" + (bad === 1 ? "" : "s");

    el.tallyBar.innerHTML = "";
    set.forEach(function (c) {
      var seg = document.createElement("span");
      seg.className = "xl-bar__seg";
      seg.setAttribute("data-sev", c.sev);
      el.tallyBar.appendChild(seg);
    });
    el.tallyBar.setAttribute(
      "aria-label",
      "Fiabilidad de las fuentes: " + ok + " verificadas, " + warn + " ambiguas, " + bad + " falsas"
    );
  }

  function updateChecklistProgress() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll(".xl-check input"));
    var done = boxes.filter(function (b) { return b.checked; }).length;
    var out = el.checkProgress.querySelector("span:last-child");
    out.textContent = done + "/" + boxes.length;
    return { done: done, total: boxes.length };
  }

  function applyFrame(name) {
    frame = FRAME_LABELS[name] ? name : "base";

    if (frame === "verificado") {
      renderCites("verificado", false);
      el.alertOk.hidden = false;
      el.alertBad.hidden = true;
      $("#xl-chk-3").checked = true;
    } else if (frame === "alucinacion") {
      renderCites("alucinacion", true);
      el.alertOk.hidden = true;
      el.alertBad.hidden = false;
    } else {
      renderCites("base", false);
      el.alertOk.hidden = true;
      el.alertBad.hidden = true;
    }

    el.caption.textContent = FRAME_LABELS[frame];
    updateChecklistProgress();

    if (frame === "verificado") { window.setTimeout(function () { confetti(46); }, 260); }
    if (frame === "alucinacion") { toast("error", "Alucinación crítica", "Una cita no existe. Revísala antes de entregar."); }
  }

  /* ---------------------------------------------------------------- interacciones */
  function wireCites() {
    el.cites.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-act]");
      if (!btn) { return; }
      var id = btn.getAttribute("data-cite-id");
      var act = btn.getAttribute("data-act");
      if (act === "open") {
        haptic(10);
        toast("info", "Abriendo fuente", "Se abriría el paper en una pestaña nueva.");
        makiWink();
      } else if (act === "report") {
        haptic([12, 30, 12]);
        toast("warn", "Reportado al modelo", "MakerLearn avisará de citas inventadas en el chat.");
      }
      void id;
    });

    /* tooltip con metadatos al pasar el cursor / enfocar la cita */
    el.cites.addEventListener("mouseover", function (event) {
      var t = event.target.closest("[data-tip]");
      if (t) { t.setAttribute("title", t.getAttribute("data-tip")); }
    });
    el.cites.addEventListener("focusin", function (event) {
      var t = event.target.closest("[data-tip]");
      if (t) { t.setAttribute("title", t.getAttribute("data-tip")); }
    });
  }

  function wireBridge() {
    var close = $("#xl-bridge-close");
    var open = $("#xl-bridge-open");
    var verify = $("#xl-bridge-verify");

    close.addEventListener("click", function () {
      el.bridge.hidden = true;
      toast("info", "Aviso cerrado", "Seguirá disponible en el icono de la barra del navegador.");
    });

    open.addEventListener("click", function () {
      haptic([10, 24, 10]);
      toast("success", "Itinerario abierto", "3 fases · empiezas en la Fase 2 (Implementación con montículo).");
      makiWink();
    });

    verify.addEventListener("click", function () {
      haptic(8);
      el.bridge.hidden = true;
      el.panel.classList.remove("is-collapsed");
      el.collapse.setAttribute("aria-expanded", "true");
      el.toggle.setAttribute("aria-pressed", "true");
      el.toggleLabel.textContent = "Activo";
      $("#xl-block-cites").scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
      toast("info", "Verificando fuentes", "InsightLens ha revisado las 3 citas de la respuesta.");
      makiWink();
    });
  }

  function wirePanel() {
    el.toggle.addEventListener("click", function () {
      var on = el.toggle.getAttribute("aria-pressed") === "true";
      el.toggle.setAttribute("aria-pressed", on ? "false" : "true");
      el.toggleLabel.textContent = on ? "En pausa" : "Activo";
      el.toggle.setAttribute("aria-label", on ? "Auditoría en pausa" : "Auditoría activa");
      toast(on ? "warn" : "success", on ? "Auditoría en pausa" : "Auditoría activa",
        on ? "InsightLens no analizará nuevas respuestas." : "Vuelve a revisar citas y código en tiempo real.");
    });

    el.collapse.addEventListener("click", function () {
      var collapsed = el.panel.classList.toggle("is-collapsed");
      el.collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
      el.collapse.setAttribute("aria-label", collapsed ? "Desplegar panel InsightLens" : "Plegar panel InsightLens");
    });

    $("#xl-explain").addEventListener("click", function () {
      haptic(10);
      toast("info", "Analogía express",
        "El montículo es como la fila de urgencias: siempre atiende primero al caso más prioritario.");
      makiWink();
    });

    $("#xl-fn").addEventListener("focus", function () {
      $("#xl-tip").classList.add("is-active");
      $("#xl-tip").scrollIntoView({ block: "nearest" });
    });
    $("#xl-fn").addEventListener("blur", function () { $("#xl-tip").classList.remove("is-active"); });
    $("#xl-fn").addEventListener("mouseenter", function () { $("#xl-tip").classList.add("is-active"); });
    $("#xl-fn").addEventListener("mouseleave", function () { $("#xl-tip").classList.remove("is-active"); });
    $("#xl-fn").addEventListener("click", function () { $("#xl-tip").classList.toggle("is-pinned"); });
  }

  function wireChips() {
    el.chips.addEventListener("click", function (event) {
      var chip = event.target.closest(".xl-chip");
      if (!chip) { return; }
      var prompt = chip.getAttribute("data-prompt");
      haptic(8);
      chip.classList.add("is-copied");
      window.setTimeout(function () { chip.classList.remove("is-copied"); }, 1400);
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).then(function () { copied = true; }).catch(function () { /* noop */ });
      }
      toast("success", "Prompt copiado", copied ? "Pégalo en el chat para seguir preguntando." : prompt);
    });
  }

  function wireChecklist() {
    document.querySelectorAll(".xl-check input").forEach(function (box) {
      box.addEventListener("change", function () {
        var s = updateChecklistProgress();
        if (s.done === s.total) {
          confetti(28);
          toast("success", "Checklist completa", "Buen trabajo: tienes todo listo para entregar con confianza.");
        }
      });
    });
  }

  function wireSend() {
    el.send.addEventListener("click", function () {
      haptic([14, 40, 14]);
      var falsas = document.querySelectorAll('.xl-cite-card[data-sev="bad"]').length +
        document.querySelectorAll('.xl-cite-card[data-sev="warn"]').length;
      if (falsas > 0) {
        toast("warn", "Envío con avisos", "Hay " + falsas + " fuente(s) sin verificar. Puedes enviarlo igual: aprender es iterar.");
      } else {
        confetti(34);
        toast("success", "Enviado a MakerLearn Fase 3", "3 fases · tu progreso se guarda en la ruta activa.");
      }
    });
  }

  /* ---------------------------------------------------------------- escala */
  function fit() {
    if (!el.scaler) { return; }
    var availW = window.innerWidth - 44;
    var availH = window.innerHeight - 132;
    var scale = Math.min(1, availW / 1440, availH / 900);
    scale = Math.max(0.42, scale);
    el.scaler.style.transformOrigin = "top left";
    el.scaler.style.transform = "scale(" + scale + ")";
    el.scaler.style.width = 1440 * scale + "px";
    el.scaler.style.height = 900 * scale + "px";
  }

  /* ---------------------------------------------------------------- arranque */
  function readFrame() {
    var m = /[?&]state=([a-zA-Z-]+)/.exec(window.location.search);
    if (!m) { return "base"; }
    var raw = m[1].toLowerCase();
    if (raw === "todo-verificado" || raw === "verificado" || raw === "ok") { return "verificado"; }
    if (raw === "alucinacion" || raw === "critica") { return "alucinacion"; }
    return "base";
  }

  function init() {
    fit();
    window.addEventListener("resize", fit);

    applyFrame(readFrame());
    wireCites();
    wireBridge();
    wirePanel();
    wireChips();
    wireChecklist();
    wireSend();

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !el.bridge.hidden) {
        el.bridge.hidden = true;
        toast("info", "Aviso cerrado", "Puedes reabrirlo desde la barra del navegador.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ---------------------------------------------------------------- API de QA */
  window.mlExtension = {
    version: "1.0.0",
    setFrame: function (name) { applyFrame(name); },
    getFrame: function () { return frame; },
    setToggle: function (on) {
      el.toggle.setAttribute("aria-pressed", on ? "true" : "false");
      el.toggleLabel.textContent = on ? "Activo" : "En pausa";
    },
    isToggleOn: function () { return el.toggle.getAttribute("aria-pressed") === "true"; },
    toggleCollapse: function () { el.collapse.click(); },
    isCollapsed: function () { return el.panel.classList.contains("is-collapsed"); },
    citeSeverities: function () {
      return Array.prototype.slice.call(document.querySelectorAll(".xl-cite-card"))
        .map(function (n) { return n.getAttribute("data-sev"); });
    },
    tally: function () { return el.tallyText.textContent; },
    checkProgress: function () { return updateChecklistProgress(); },
    isBridgeOpen: function () { return !el.bridge.hidden; },
    closeBridge: function () { el.bridge.hidden = true; },
    toastCount: function () { return toastCount; },
    confettiRuns: function () { return confettiRuns; },
    makiState: function () { return el.bridgeMaki ? el.bridgeMaki.getAttribute("data-state") : null; },
    grouped: group
  };
})();
