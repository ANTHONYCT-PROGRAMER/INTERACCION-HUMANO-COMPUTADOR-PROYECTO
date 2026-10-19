/* ---------------------------------------------------------------------------
   MakerLearn Studio · Pantalla 03 «Aprender» (móvil)
   Interacciones: swipe de tarjetas, micro-quiz con feedback, confeti, XP con
   conteo animado, háptica y hojas modales (racha perdida / logro).

   Contrato de clases del sistema de diseño (system.css):
     .quiz / .quiz-opt / .is-correct / .is-wrong / .quiz__feedback.is-visible
     .quiz.is-shake / .quiz.is-pop / .xp.is-bumped / .btn / .chip / .badge
   No depende de app.css.

   Frames por URL:  ?state=acierto | incorrecto | racha | logro
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
  try { REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (e) { /* sin matchMedia */ }

  function haptic(pattern) {
    try { if (navigator.vibrate) { navigator.vibrate(pattern); } }
    catch (e) { /* sin soporte */ }
  }

  function focusQuietly(node) {
    if (!node) { return; }
    try { node.focus({ preventScroll: true }); } catch (e) { /* fallback */ }
  }

  function groupThousands(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function restart(node, cls) {
    if (!node) { return; }
    node.classList.remove(cls);
    void node.offsetWidth; /* reinicia la animación */
    node.classList.add(cls);
  }

  /* =======================================================================
     1. Elementos
     ======================================================================= */

  var el = {
    main: $("#ml-main"),
    viewport: $("#ml-viewport"),
    track: $("#ml-track"),
    cards: $$(".ml-card"),
    dotsWrap: $("#ml-dots"),
    dots: $$(".ml-dots__b"),
    count: $("#ml-count"),
    seg: $("#ml-seg"),
    segs: $$(".ml-seg__i"),
    prev: $("#ml-prev"),
    next: $("#ml-next"),
    save: $("#ml-save"),
    example: $("#ml-example"),
    xp: $("#ml-xp"),
    xpOut: $("#ml-xp-b"),
    streak: $("#ml-streak"),
    quiz: $("#ml-quiz"),
    feedback: $("[data-quiz-feedback]"),
    feedbackIcon: $("[data-quiz-icon]"),
    feedbackTitle: $("[data-quiz-title]"),
    feedbackMsg: $("[data-quiz-msg]"),
    submit: $("[data-quiz-submit]"),
    retry: $("[data-quiz-retry]"),
    quizHint: $("#ml-quiz-hint"),
    hintBtn: $("#ml-hint-btn"),
    hintBox: $("#ml-hintbox"),
    toasts: $("#ml-toasts"),
    confetti: $("#ml-confetti"),
    scrim: $("#ml-scrim"),
    sheetRacha: $("#ml-sheet-racha"),
    sheetLogro: $("#ml-sheet-logro"),
    caption: $("#ml-caption-state")
  };

  var CARD_TOTAL = el.cards.length;          /* 4 tarjetas */
  var CARD_START = 2;                        /* arranca en «Tarjeta 3 de 4» */
  var CORRECT = (el.quiz && el.quiz.dataset.correct) || "b";
  var XP_BASE = 1420;

  var cardIndex = CARD_START;
  var answered = false;
  var lastFocus = null;
  var currentFrame = "acierto";

  /* =======================================================================
     2. Avisos dentro del teléfono
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
    if (!el.toasts) { return; }
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
    window.setTimeout(function () { dismissToast(node); }, 4600);
  }

  /* =======================================================================
     3. Confeti sutil
     ======================================================================= */

  var CONFETTI_COLORS = ["#6C4CF1", "#8B5CF6", "#9A7BFF", "#00D4A0", "#FFB020"];

  function confetti(count) {
    if (!el.confetti || REDUCE) { return; }
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
  }

  /* =======================================================================
     4. XP con conteo animado
     ======================================================================= */

  function renderXP(value) {
    if (el.xpOut) { el.xpOut.textContent = groupThousands(value); }
  }

  /* Valor lógico del XP: la animación puede ir por detrás, así que la fuente
     de verdad es este número y no el texto del DOM. */
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
  }

  /* =======================================================================
     5. Carrusel de tarjetas
     ======================================================================= */

  function setCard(n, silent) {
    cardIndex = Math.max(0, Math.min(CARD_TOTAL - 1, n));

    if (el.track) {
      el.track.style.setProperty("--i", String(cardIndex));
      el.track.style.setProperty("--drag", "0px");
    }
    if (el.viewport) { el.viewport.classList.remove("is-dragging"); }

    el.cards.forEach(function (card, i) {
      card.setAttribute("aria-hidden", i === cardIndex ? "false" : "true");
      card.classList.toggle("is-active", i === cardIndex);
    });

    el.dots.forEach(function (dot, i) {
      if (i === cardIndex) { dot.setAttribute("aria-current", "true"); }
      else { dot.removeAttribute("aria-current"); }
    });

    if (el.count) { el.count.textContent = "Tarjeta " + (cardIndex + 1) + " de " + CARD_TOTAL; }

    el.segs.forEach(function (seg, i) { seg.classList.toggle("is-full", i <= cardIndex); });
    if (el.seg) { el.seg.setAttribute("aria-valuenow", String(cardIndex + 1)); }

    if (el.prev) { el.prev.disabled = cardIndex === 0; }

    if (!silent) { haptic(6); }
  }

  var drag = { active: false, id: null, x: 0, y: 0, dx: 0, axis: null };

  function endDrag() {
    var wasAxisX = drag.axis === "x";
    var dx = drag.dx;
    drag.active = false;
    drag.axis = null;
    drag.dx = 0;
    if (el.viewport) { el.viewport.classList.remove("is-dragging"); }
    if (el.track) { el.track.style.setProperty("--drag", "0px"); }
    if (!wasAxisX) { return; }

    var threshold = (el.viewport ? el.viewport.clientWidth : 330) * 0.22;
    if (dx <= -threshold) { setCard(cardIndex + 1, true); haptic(8); }
    else if (dx >= threshold) { setCard(cardIndex - 1, true); haptic(8); }
    else { setCard(cardIndex, true); }
  }

  if (el.viewport) {
    el.viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) { return; }
      if (e.target && e.target.closest && e.target.closest("button, a")) { return; }
      drag.active = true;
      drag.id = e.pointerId;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.dx = 0;
      drag.axis = null;
    });

    el.viewport.addEventListener("pointermove", function (e) {
      if (!drag.active) { return; }
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;

      if (drag.axis === null) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          drag.axis = "x";
          el.viewport.classList.add("is-dragging");
          try { el.viewport.setPointerCapture(drag.id); } catch (err) { /* opcional */ }
        } else if (Math.abs(dy) > 8) {
          drag.active = false;
          return;
        } else {
          return;
        }
      }
      if (drag.axis !== "x") { return; }

      var limit = el.viewport.clientWidth || 330;
      if ((cardIndex === 0 && dx > 0) || (cardIndex === CARD_TOTAL - 1 && dx < 0)) { dx *= 0.32; }
      drag.dx = Math.max(-limit, Math.min(limit, dx));
      e.preventDefault();
      if (el.track) { el.track.style.setProperty("--drag", drag.dx.toFixed(1) + "px"); }
    });

    el.viewport.addEventListener("pointerup", endDrag);
    el.viewport.addEventListener("pointercancel", endDrag);
    el.viewport.addEventListener("pointerleave", endDrag);
  }

  if (el.dotsWrap) {
    el.dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { setCard(i); });
    });
  }

  el.cards.forEach(function (card, i) {
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "diapositiva");
    card.setAttribute("aria-label", "Tarjeta " + (i + 1) + " de " + CARD_TOTAL);
  });

  var cardsSection = $(".ml-cards");
  if (cardsSection) {
    cardsSection.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { setCard(cardIndex + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { setCard(cardIndex - 1); e.preventDefault(); }
    });
  }

  /* =======================================================================
     6. Micro-quiz
     ======================================================================= */

  function optionEl(value) {
    return el.quiz ? $('.quiz-opt[data-opt="' + value + '"]', el.quiz) : null;
  }

  function markOption(value, state) {
    var option = optionEl(value);
    if (!option) { return; }
    option.classList.remove("is-correct", "is-wrong");
    if (state) { option.classList.add(state); }
  }

  function checkRadio(value) {
    var radio = el.quiz ? $('input[type="radio"][value="' + value + '"]', el.quiz) : null;
    if (radio) { radio.checked = true; }
  }

  function lockOptions(locked) {
    if (!el.quiz) { return; }
    $$("input[type=radio]", el.quiz).forEach(function (radio) { radio.disabled = locked; });
  }

  function setFeedback(kind) {
    if (!el.quiz) { return; }
    if (el.feedback) { el.feedback.className = "quiz__feedback is-visible is-" + kind; }
    if (el.feedbackIcon) { el.feedbackIcon.setAttribute("href", kind === "correct" ? "#i-check" : "#i-x"); }
    if (el.feedbackTitle) {
      el.feedbackTitle.textContent = (kind === "correct" ? el.quiz.dataset.correctTitle : el.quiz.dataset.wrongTitle) || "";
    }
    if (el.feedbackMsg) {
      el.feedbackMsg.textContent = (kind === "correct" ? el.quiz.dataset.correctMsg : el.quiz.dataset.wrongMsg) || "";
    }
  }

  function resetQuiz() {
    if (!el.quiz) { return; }
    $$(".quiz-opt", el.quiz).forEach(function (option) {
      option.classList.remove("is-correct", "is-wrong");
    });
    $$("input[type=radio]", el.quiz).forEach(function (radio) {
      radio.disabled = false;
      radio.checked = false;
    });
    el.quiz.classList.remove("is-locked", "is-shake", "is-pop");
    if (el.feedback) { el.feedback.className = "quiz__feedback"; }
    if (el.submit) { el.submit.hidden = false; }
    if (el.retry) { el.retry.hidden = true; }
    if (el.hintBtn) { el.hintBtn.hidden = true; }
    if (el.hintBox) { el.hintBox.hidden = true; }
    if (el.quizHint) { el.quizHint.hidden = false; }
    answered = false;
  }

  /**
   * Resuelve la comprobación.
   * @param {string} picked       valor elegido ("a" | "b" | "c")
   * @param {boolean} interactive true si lo provocó la persona usuaria
   *                              (confeti, háptica y +XP); false para frames.
   */
  function answer(picked, interactive) {
    if (!el.quiz || !picked) { return; }
    var isRight = picked === CORRECT;

    if (isRight) {
      markOption(picked, "is-correct");
    } else {
      markOption(picked, "is-wrong");
      markOption(CORRECT, "is-correct"); /* se revela la correcta */
    }
    checkRadio(picked);
    setFeedback(isRight ? "correct" : "wrong");

    lockOptions(true);
    el.quiz.classList.add("is-locked");
    if (el.submit) { el.submit.hidden = true; }
    if (el.retry) { el.retry.hidden = false; }
    if (el.quizHint) { el.quizHint.hidden = true; }
    if (el.hintBtn) { el.hintBtn.hidden = isRight; }
    if (el.hintBox) { el.hintBox.hidden = true; }
    answered = true;

    if (!interactive) { return; }

    if (isRight) {
      restart(el.quiz, "is-pop");
      haptic([14, 40, 14]);
      confetti(16);
      bumpXP(50, "¡Correcto! +50 XP", (el.quiz.dataset.correctMsg || ""));
    } else {
      restart(el.quiz, "is-shake");
      haptic(60);
      toast("info", "Casi… revisa la teoría", "Sin XP esta vez: usa «Ver pista» y reinténtalo.");
    }
    focusQuietly(el.retry);
  }

  if (el.submit) {
    el.submit.addEventListener("click", function (e) {
      e.preventDefault();
      var picked = el.quiz ? $('input[name="ml-quiz-answer"]:checked', el.quiz) : null;
      if (!picked) {
        toast("info", "Elige una opción", "Toca A, B o C antes de comprobar.");
        focusQuietly($(".quiz-opt", el.quiz));
        return;
      }
      answer(picked.value, true);
    });
  }

  if (el.retry) {
    el.retry.addEventListener("click", function () {
      resetQuiz();
      focusQuietly($(".quiz-opt", el.quiz));
    });
  }

  if (el.hintBtn) {
    el.hintBtn.addEventListener("click", function () {
      if (el.hintBox) { el.hintBox.hidden = false; }
      el.hintBtn.hidden = true;
      haptic(8);
    });
  }

  /* =======================================================================
     7. Hojas modales
     ======================================================================= */

  function openSheet(which) {
    var sheet = which === "racha" ? el.sheetRacha : el.sheetLogro;
    if (!sheet) { return; }
    closeSheets(true);
    lastFocus = document.activeElement;
    if (el.scrim) { el.scrim.hidden = false; }
    sheet.hidden = false;
    focusQuietly($("[data-sheet-cta]", sheet) || $(".ml-sheet__close", sheet));
  }

  function closeSheets(silent) {
    [el.sheetRacha, el.sheetLogro].forEach(function (sheet) {
      if (sheet) { sheet.hidden = true; }
    });
    if (el.scrim) { el.scrim.hidden = true; }
    if (!silent) {
      focusQuietly(lastFocus);
      lastFocus = null;
    }
  }

  $$("[data-sheet-close]").forEach(function (button) {
    button.addEventListener("click", function () { closeSheets(false); });
  });
  if (el.scrim) { el.scrim.addEventListener("click", function () { closeSheets(false); }); }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeSheets(false); }
  });

  function openLogro(interactive) {
    openSheet("logro");
    confetti(24);
    if (interactive) {
      bumpXP(100, "Logro desbloqueado", "Medalla «Maestro del montículo» · +100 XP.");
    }
  }

  $$("[data-sheet-cta]").forEach(function (button) {
    button.addEventListener("click", function () {
      var which = button.getAttribute("data-sheet-cta");
      closeSheets(true);
      lastFocus = null;
      if (which === "racha") {
        setCard(0);
        toast("success", "Racha a salvo 🔥", "Repaso de 30 s iniciado: 1 tarjeta de la Fase 1.");
      } else {
        var text = "He desbloqueado la medalla «Maestro del montículo» en MakerLearn.";
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
          }
        } catch (e) { /* sin permiso de portapapeles */ }
        toast("success", "Logro listo para compartir", "Enlace copiado al portapapeles.");
      }
    });
  });

  /* =======================================================================
     8. Barra inferior de acciones y tab bar
     ======================================================================= */

  if (el.prev) {
    el.prev.addEventListener("click", function () { setCard(cardIndex - 1); });
  }
  if (el.next) {
    el.next.addEventListener("click", function () {
      if (cardIndex < CARD_TOTAL - 1) { setCard(cardIndex + 1); }
      else { openLogro(true); }
    });
  }
  if (el.save) {
    el.save.addEventListener("click", function () {
      var on = !el.save.classList.contains("is-saved");
      el.save.classList.toggle("is-saved", on);
      el.save.setAttribute("aria-pressed", on ? "true" : "false");
      toast(
        on ? "success" : "info",
        on ? "Guardado para Web 💻" : "Guardado retirado",
        on ? "Continúa la Fase 1 en el escritorio cuando quieras." : "Ya no aparecerá en tu escritorio."
      );
      haptic(10);
    });
  }
  if (el.example) {
    el.example.addEventListener("click", function () {
      toast(
        "info",
        "Ejemplo con números",
        "Con 1.000 nodos y 5.000 aristas, el montículo baja de ~10⁶ a ~6·10⁴ comparaciones."
      );
      haptic(8);
    });
  }

  $$(".ml-tab").forEach(function (tab) {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      var which = tab.getAttribute("data-tab");

      /* «Repaso» es el disparador natural del estado b */
      if (which === "repaso") { openSheet("racha"); return; }

      $$(".ml-tab").forEach(function (other) {
        other.classList.remove("is-active");
        other.removeAttribute("aria-current");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-current", "page");

      if (which === "inicio") {
        /* «Inicio» ya tiene pantalla propia (05): se navega a ella */
        window.location.href = "home.html";
      } else if (which === "perfil") {
        toast("info", "Perfil", "Tus medallas y tu racha viven aquí.");
      } else {
        toast("info", "Ruta activa", "Fase 1 · Dijkstra en Grafos · Tarjeta " + (cardIndex + 1) + " de " + CARD_TOTAL + ".");
      }
    });
  });

  /* =======================================================================
     9. Frames (estados alternos)
     ======================================================================= */

  var FRAME_LABEL = {
    acierto: "Acierto (+50 XP)",
    incorrecto: "Incorrecto + pista",
    racha: "Racha perdida",
    logro: "Logro desbloqueado"
  };

  function scrollToQuiz() {
    if (!el.main || !el.quiz) { return; }
    var host = el.main.getBoundingClientRect();
    var target = el.quiz.getBoundingClientRect();
    el.main.scrollTop += (target.top - el.main.getBoundingClientRect().top) - 10;
    void host;
  }

  function applyFrame(key) {
    currentFrame = (key === "incorrecto" || key === "racha" || key === "logro") ? key : "acierto";
    resetQuiz();
    closeSheets(true);
    setXPBase();
    if (el.caption) { el.caption.textContent = {
      acierto: "Acierto (+50 XP)",
      incorrecto: "Incorrecto + pista",
      racha: "Racha perdida",
      logro: "Logro desbloqueado"
    }[key] || "Acierto (+50 XP)"; }

    setCard(CARD_START, true);

    if (key === "incorrecto") {
      answer("a", false);
      if (el.main && el.quiz) {
        var box = el.main.getBoundingClientRect();
        var target = el.quiz.getBoundingClientRect();
        el.main.scrollTop += (target.top - box.top) - 8;
      }
    } else if (key === "racha") {
      answer("b", false);
      openSheet("racha");
    } else if (key === "logro") {
      answer("b", false);
      openSheet("logro");
      confetti(24);
    } else {
      answer("b", false);
    }
  }

  /* =======================================================================
     9. Escala del dispositivo
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
     10. Arranque
     ======================================================================= */

  var frameFromUrl = "acierto";
  try {
    var raw = (new URLSearchParams(window.location.search).get("state") || "").toLowerCase();
    if (raw === "incorrecto" || raw === "racha" || raw === "logro") { frameFromUrl = raw; }
  } catch (e) { /* sin URLSearchParams */ }

  /* API mínima para el shell React y los arneses de verificación */
  window.mlMobile = {
    setFrame: function (key) { applyFrame(key); return currentFrame; },
    getFrame: function () { return currentFrame; },
    setCard: setCard,
    getCard: function () { return cardIndex + 1; },
    answer: answer,
    openSheet: openSheet,
    closeSheets: function () { closeSheets(false); },
    isAnswered: function () { return answered; },
    xp: function () { return groupThousands(xpValue); },
    xpDom: function () { return el.xpOut ? el.xpOut.textContent : null; },
    version: "1.0.0"
  };

  fitDevice();
  applyFrame(frameFromUrl);
})();
