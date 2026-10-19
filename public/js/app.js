/* MakerLearn Studio — design system interactions */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------
     Theme
     --------------------------------------------------------------- */

  var themeMeta = $('meta[name="theme-color"]');
  var themeToggle = $("[data-theme-toggle]");
  var themeIcon = $("[data-theme-icon]");

  function storeTheme(theme) {
    try { localStorage.setItem("ml-theme", theme); } catch (err) { /* private mode */ }
  }

  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    $$("[data-set-theme]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.setTheme === theme));
    });
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0F1117" : "#F7F8FC");
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
    if (themeIcon) themeIcon.setAttribute("href", theme === "dark" ? "#i-sun" : "#i-moon");
    if (persist) storeTheme(theme);
  }

  $$("[data-set-theme]").forEach(function (btn) {
    btn.addEventListener("click", function () { setTheme(btn.dataset.setTheme, true); });
  });
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }
  setTheme(root.dataset.theme === "light" ? "light" : "dark", false);

  /* ---------------------------------------------------------------
     Mobile drawer
     --------------------------------------------------------------- */

  var sidebar = $("#sidebar");
  var scrim = $(".sidebar-scrim");
  var drawerOpen = $("[data-drawer-open]");
  var drawerClose = $("[data-drawer-close]");

  var mainWrap = $(".main-wrap");

  function syncSidebarInert() {
    if (!sidebar || !("inert" in sidebar)) return;
    if (window.innerWidth >= 1100) sidebar.inert = false;
    else sidebar.inert = !document.body.classList.contains("drawer-open");
  }

  function setDrawer(open, restoreFocus) {
    document.body.classList.toggle("drawer-open", open);
    if (drawerOpen) drawerOpen.setAttribute("aria-expanded", String(open));
    if (scrim) scrim.hidden = !open;
    if (mainWrap && "inert" in mainWrap) mainWrap.inert = open;
    syncSidebarInert();
    if (open && drawerClose) {
      window.setTimeout(function () { drawerClose.focus(); }, 60);
    } else if (!open && restoreFocus && drawerOpen) {
      drawerOpen.focus();
    }
  }

  syncSidebarInert();

  if (drawerOpen) drawerOpen.addEventListener("click", function () { setDrawer(true, false); });
  if (drawerClose) drawerClose.addEventListener("click", function () { setDrawer(false, true); });
  if (scrim) scrim.addEventListener("click", function () { setDrawer(false, true); });

  $$(".nav__link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 1100) {
        window.setTimeout(function () { setDrawer(false, false); }, 30);
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      setDrawer(false, true);
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1100 && document.body.classList.contains("drawer-open")) {
      setDrawer(false, false);
    }
    syncSidebarInert();
  });

  /* ---------------------------------------------------------------
     Scrollspy
     --------------------------------------------------------------- */

  var navLinks = $$('.nav__link[href^="#"]');
  var sections = navLinks.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);

  function setActiveSection(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------------------------------------------------------------
     Toasts
     --------------------------------------------------------------- */

  var toastRegion = $("#toasts");
  var toastIcons = { success: "#i-check", error: "#i-x", info: "#i-info" };

  function dismissToast(el) {
    if (!el || el.classList.contains("is-leaving")) return;
    el.classList.add("is-leaving");
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 220);
  }

  function toast(type, title, message) {
    if (!toastRegion) return;
    type = toastIcons[type] ? type : "info";
    while (toastRegion.children.length >= 3) toastRegion.removeChild(toastRegion.firstElementChild);

    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.setAttribute("role", type === "error" ? "alert" : "status");

    var iconWrap = document.createElement("span");
    iconWrap.className = "toast__icon";
    iconWrap.innerHTML = '<svg class="od-icon icon i-16" aria-hidden="true"><use href="' + toastIcons[type] + '"></use></svg>';

    var body = document.createElement("div");
    body.className = "toast__body";
    var titleEl = document.createElement("strong");
    titleEl.className = "toast__title";
    titleEl.textContent = title;
    var msg = document.createElement("span");
    msg.className = "toast__msg";
    msg.textContent = message;
    body.appendChild(titleEl);
    body.appendChild(msg);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "toast__close";
    close.setAttribute("aria-label", "Cerrar notificación");
    close.innerHTML = '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-x"></use></svg>';
    close.addEventListener("click", function () { dismissToast(el); });

    el.appendChild(iconWrap);
    el.appendChild(body);
    el.appendChild(close);
    toastRegion.appendChild(el);

    var timer = window.setTimeout(function () { dismissToast(el); }, 5200);
    el.addEventListener("mouseenter", function () { window.clearTimeout(timer); });
    el.addEventListener("mouseleave", function () {
      timer = window.setTimeout(function () { dismissToast(el); }, 2600);
    });
  }

  $$("[data-toast]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toast(
        btn.dataset.toast,
        btn.dataset.toastTitle || "Notificación de ejemplo",
        btn.dataset.toastMsg || "Así se comunica un cambio de estado en MakerLearn."
      );
    });
  });

  /* ---------------------------------------------------------------
     Clipboard
     --------------------------------------------------------------- */

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(area);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-copy]");
    if (!trigger) return;
    event.preventDefault();
    var value = trigger.getAttribute("data-copy");
    copyText(value).then(function () {
      toast("success", "Copiado al portapapeles", value);
    }).catch(function () {
      toast("error", "No se pudo copiar", "Selecciona el valor y cópialo manualmente.");
    });
  });

  /* ---------------------------------------------------------------
     Token filter
     --------------------------------------------------------------- */

  var tokenSearch = $("[data-token-search]");
  var tokenItems = $$("[data-token]");
  var tokenCount = $("[data-token-count]");
  var tokenEmpty = $("[data-token-empty]");

  if (tokenSearch) {
    tokenSearch.addEventListener("input", function () {
      var query = tokenSearch.value.trim().toLowerCase();
      var visible = 0;
      tokenItems.forEach(function (item) {
        var match = item.getAttribute("data-token").toLowerCase().indexOf(query) !== -1;
        item.hidden = !match;
        if (match) visible += 1;
      });
      if (tokenCount) tokenCount.textContent = visible + " / " + tokenItems.length + " tokens";
      if (tokenEmpty) tokenEmpty.hidden = visible !== 0;
    });
  }

  /* ---------------------------------------------------------------
     Quiz
     --------------------------------------------------------------- */

  var quiz = $("[data-quiz]");
  if (quiz) {
    var quizForm = $("form", quiz);
    var quizSubmit = $("[data-quiz-submit]", quiz);
    var quizRetry = $("[data-quiz-retry]", quiz);
    var quizFeedback = $("[data-quiz-feedback]", quiz);
    var quizIcon = $("[data-quiz-icon]", quiz);
    var quizTitle = $("[data-quiz-title]", quiz);
    var quizMsg = $("[data-quiz-msg]", quiz);
    var correctValue = quiz.dataset.correct;
    var answered = false;

    function animateQuiz(cls) {
      if (reduceMotion) return;
      quiz.classList.remove("is-shake", "is-pop");
      void quiz.offsetWidth;
      quiz.classList.add(cls);
      window.setTimeout(function () { quiz.classList.remove(cls); }, 500);
    }

    function resetQuiz() {
      answered = false;
      $$(".quiz-opt", quiz).forEach(function (opt) {
        opt.classList.remove("is-correct", "is-wrong");
        var input = $("input", opt);
        input.disabled = false;
        input.checked = false;
      });
      quizFeedback.className = "quiz__feedback";
      quizFeedback.removeAttribute("role");
      quizSubmit.hidden = false;
      quizRetry.hidden = true;
      var first = $(".quiz-opt input", quiz);
      if (first) first.focus();
    }

    if (quizForm) {
      quizForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (answered) return;
        var checked = $("input:checked", quizForm);
        if (!checked) {
          toast("info", "Elige una opción", "Selecciona A, B o C antes de comprobar tu respuesta.");
          var firstInput = $(".quiz-opt input", quizForm);
          if (firstInput) firstInput.focus();
          return;
        }
        answered = true;
        var isCorrect = checked.value === correctValue;
        $$(".quiz-opt", quiz).forEach(function (opt) {
          var input = $("input", opt);
          input.disabled = true;
          if (input.value === correctValue) opt.classList.add("is-correct");
          else if (input.checked) opt.classList.add("is-wrong");
        });

        quizFeedback.classList.add("is-visible", isCorrect ? "is-correct" : "is-wrong");
        quizFeedback.setAttribute("role", "status");
        quizIcon.setAttribute("href", isCorrect ? "#i-check" : "#i-x");
        quizTitle.textContent = isCorrect ? quiz.dataset.correctTitle : quiz.dataset.wrongTitle;
        quizMsg.textContent = isCorrect ? quiz.dataset.correctMsg : quiz.dataset.wrongMsg;
        quizSubmit.hidden = true;
        quizRetry.hidden = false;
        animateQuiz(isCorrect ? "is-pop" : "is-shake");
        quizRetry.focus();
        if (isCorrect) bumpXP(20, "Comprobación superada. La explicación ya está visible.");
      });
    }

    if (quizRetry) quizRetry.addEventListener("click", resetQuiz);
  }

  /* ---------------------------------------------------------------
     Hints + XP
     --------------------------------------------------------------- */

  var xpEl = $("[data-xp]");
  var xpSeed = xpEl ? parseInt(xpEl.getAttribute("data-xp-value") || xpEl.textContent.replace(/[^\d]/g, ""), 10) : 2480;
  var xpValue = isNaN(xpSeed) ? 2480 : xpSeed;
  if (xpEl) xpEl.textContent = xpValue.toLocaleString("es-ES");

  function bumpXP(amount, message) {
    xpValue = Math.max(0, xpValue + amount);
    if (xpEl) {
      xpEl.setAttribute("data-xp", String(xpValue));
      xpEl.textContent = xpValue.toLocaleString("es-ES");
      var pill = xpEl.closest(".xp");
      if (pill && !reduceMotion) {
        pill.classList.remove("is-bumped");
        void pill.offsetWidth;
        pill.classList.add("is-bumped");
      }
    }
    var label = amount > 0 ? "+" + amount + " XP" : "−" + Math.abs(amount) + " XP";
    if (amount > 0) toast("success", label, message);
    else toast("info", label, message);
  }

  var hintNodes = $$("[data-hint]");
  hintNodes.forEach(function (hint, index) {
    var toggle = $(".hint__toggle", hint);
    var panel = $(".hint__panel", hint);
    var next = hintNodes[index + 1];

    if (!toggle) return;
    toggle.addEventListener("click", function () {
      if (toggle.disabled) return;
      var willOpen = !hint.classList.contains("is-open");
      hint.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));

      if (willOpen && !hint.dataset.revealed) {
        hint.dataset.revealed = "true";
        var cost = parseInt(toggle.dataset.cost || "0", 10);
        if (cost) bumpXP(-cost, "Pista " + (index + 1) + " revelada · apunta a la pista mínima.");
        if (next) {
          next.classList.remove("is-locked");
          var nextToggle = $(".hint__toggle", next);
          if (nextToggle) nextToggle.disabled = false;
        }
      }
    });
  });

  var xpDemo = $("[data-xp-add]");
  if (xpDemo) {
    xpDemo.addEventListener("click", function () {
      bumpXP(40, "Reto completado. La racha de 12 días sigue viva.");
    });
  }

  /* ---------------------------------------------------------------
     Maki
     --------------------------------------------------------------- */

  var maki = $("[data-maki]");
  var makiSpeech = $("[data-maki-speech]");
  var makiMessages = {
    idle: "<b>Hipótesis primero:</b> si el sensor devuelve un valor vacío, ¿qué debería hacer tu rover? Propón una respuesta antes de tocar el código.",
    think: "<b>Pista, no solución:</b> revisa el orden de tus condicionales. ¿Estás comprobando el caso límite antes de leer el valor?",
    cheer: "<b>¡Exacto!</b> Un deque resuelve ambos extremos. Ahora explica en una frase por qué tu solución escala."
  };

  if (maki) {
    $$("[data-maki-state]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var state = btn.dataset.makiState;
        maki.setAttribute("data-state", state);
        if (makiSpeech) makiSpeech.innerHTML = makiMessages[state] || makiMessages.idle;
        $$("[data-maki-state]").forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === btn));
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     Terminal
     --------------------------------------------------------------- */

  var terminal = $("[data-terminal]");
  if (terminal) {
    var termOut = $("[data-term-out]", terminal);
    var termRun = $("[data-term-run]", terminal);
    var termReset = $("[data-term-reset]", terminal);
    var termRunLabel = $("[data-term-run-label]", terminal);
    var termStatus = $("[data-term-status]", terminal);
    var termTabs = $$("[data-term-tab]", terminal);
    var activeTab = "env";
    var runTimer = null;
    var running = false;

    var scripts = {
      env: {
        lines: [
          { cls: "cmd", text: "makerlearn env --check" },
          { cls: "dim", text: "Comprobando tu entorno de aprendizaje…" },
          { cls: "ok", text: "✓ python 3.12.4  listo" },
          { cls: "ok", text: "✓ node 22.3.0  listo" },
          { cls: "ok", text: "✓ pytest 8.2.1  listo" },
          { cls: "out", text: "3 tareas pendientes · última sesión hace 2 h" },
          { cls: "prompt" }
        ],
        done: "Entorno comprobado. Todo listo para continuar."
      },
      test: {
        lines: [
          { cls: "cmd", text: "makerlearn test --unit deque" },
          { cls: "dim", text: "Cargando suite · unidad 03" },
          { cls: "ok", text: "✓ test_append_left" },
          { cls: "ok", text: "✓ test_append_right" },
          { cls: "ok", text: "✓ test_pop_both_ends" },
          { cls: "ok", text: "✓ test_bounds" },
          { cls: "out", text: "4 passed · 0 failed · 0.42s" },
          { cls: "prompt" }
        ],
        done: "Comando completado. 4 pruebas superadas."
      }
    };

    function termLine(item) {
      var line = document.createElement("span");
      line.className = "term-line term-line--" + item.cls;
      if (item.cls === "cmd") {
        var prompt = document.createElement("span");
        prompt.className = "prompt";
        prompt.textContent = "$ ";
        line.appendChild(prompt);
        line.appendChild(document.createTextNode(item.text));
      } else if (item.cls === "prompt") {
        var p = document.createElement("span");
        p.className = "prompt";
        p.textContent = "$ ";
        line.appendChild(p);
        var caret = document.createElement("span");
        caret.className = "caret";
        caret.setAttribute("aria-hidden", "true");
        line.appendChild(caret);
      } else {
        line.textContent = item.text;
      }
      return line;
    }

    function termIntro() {
      termOut.textContent = "";
      var hint = document.createElement("span");
      hint.className = "term-line term-line--dim";
      hint.textContent = activeTab === "env"
        ? "Pulsa Ejecutar para comprobar el entorno."
        : "Pulsa Ejecutar para lanzar la suite de pruebas.";
      termOut.appendChild(hint);
      var prompt = document.createElement("span");
      prompt.className = "term-line term-line--cmd";
      var p = document.createElement("span");
      p.className = "prompt";
      p.textContent = "$ ";
      prompt.appendChild(p);
      var caret = document.createElement("span");
      caret.className = "caret";
      caret.setAttribute("aria-hidden", "true");
      prompt.appendChild(caret);
      termOut.appendChild(prompt);
    }

    function stopTerminal() {
      if (runTimer) window.clearTimeout(runTimer);
      runTimer = null;
      running = false;
      if (termRun) termRun.disabled = false;
      if (termRunLabel) termRunLabel.textContent = "Ejecutar";
    }

    function runTerminal() {
      if (running) return;
      stopTerminal();
      running = true;
      termOut.textContent = "";
      termRun.disabled = true;
      termRunLabel.textContent = "Ejecutando…";
      if (termStatus) termStatus.textContent = "Ejecutando comando en la terminal.";

      var script = scripts[activeTab].lines;
      var index = 0;

      function addNext() {
        if (index >= script.length) {
          running = false;
          termRun.disabled = false;
          termRunLabel.textContent = "Ejecutar";
          if (termStatus) termStatus.textContent = scripts[activeTab].done;
          return;
        }
        termOut.appendChild(termLine(script[index]));
        index += 1;
        termOut.scrollTop = termOut.scrollHeight;
        if (index >= script.length) {
          addNext();
          return;
        }
        runTimer = window.setTimeout(addNext, reduceMotion ? 10 : 190);
      }

      addNext();
    }

    function activateTab(tab) {
      activeTab = tab.dataset.termTab;
      termTabs.forEach(function (other) {
        var selected = other === tab;
        other.setAttribute("aria-selected", String(selected));
        other.tabIndex = selected ? 0 : -1;
      });
      var panel = $("#term-panel");
      if (panel) panel.setAttribute("aria-labelledby", tab.id);
      stopTerminal();
      termIntro();
    }

    termTabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activateTab(tab); });
      tab.addEventListener("keydown", function (event) {
        var nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % termTabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + termTabs.length) % termTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = termTabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        termTabs[nextIndex].focus();
        activateTab(termTabs[nextIndex]);
      });
    });

    if (termRun) termRun.addEventListener("click", runTerminal);
    if (termReset) termReset.addEventListener("click", function () { stopTerminal(); termIntro(); });
    termIntro();
  }

  /* ---------------------------------------------------------------
     Tooltips
     --------------------------------------------------------------- */

  $$(".tip__trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var tip = trigger.closest(".tip");
      var willOpen = !tip.classList.contains("is-open");
      $$(".tip").forEach(function (other) { other.classList.remove("is-open"); });
      tip.classList.toggle("is-open", willOpen);
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".tip")) {
      $$(".tip").forEach(function (tip) { tip.classList.remove("is-open"); });
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      $$(".tip").forEach(function (tip) { tip.classList.remove("is-open"); });
    }
  });

  /* ---------------------------------------------------------------
     Skeletons
     --------------------------------------------------------------- */

  var skeletonToggle = $("[data-skeleton-toggle]");
  var skeletonDemo = $("[data-skeleton-demo]");
  if (skeletonToggle && skeletonDemo) {
    var skeletonContent = $("[data-skeleton-content]", skeletonDemo);
    var skeletonPlaceholder = $("[data-skeleton-placeholder]", skeletonDemo);
    var skeletonStatus = $("[data-skeleton-status]", skeletonDemo);
    var skeletonTimer = null;

    skeletonToggle.addEventListener("click", function () {
      if (skeletonDemo.getAttribute("aria-busy") === "true") return;
      skeletonDemo.setAttribute("aria-busy", "true");
      skeletonToggle.disabled = true;
      skeletonContent.hidden = true;
      skeletonPlaceholder.hidden = false;
      if (skeletonStatus) skeletonStatus.textContent = "Cargando proyectos…";
      skeletonTimer = window.setTimeout(function () {
        skeletonContent.hidden = false;
        skeletonPlaceholder.hidden = true;
        skeletonDemo.setAttribute("aria-busy", "false");
        skeletonToggle.disabled = false;
        if (skeletonStatus) skeletonStatus.textContent = "Proyectos cargados.";
      }, 1300);
    });
  }

  /* ---------------------------------------------------------------
     Email validation
     --------------------------------------------------------------- */

  var email = $("[data-email]");
  if (email) {
    var emailField = email.closest(".field");
    var emailError = $("[data-email-error]", emailField);
    var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateEmail() {
      var value = email.value.trim();
      var ok = emailValid.test(value);
      emailField.classList.toggle("is-invalid", !ok);
      emailField.classList.toggle("is-valid", ok);
      email.setAttribute("aria-invalid", String(!ok));
      if (emailError) {
        emailError.textContent = value.length === 0
          ? "Este campo es obligatorio. Escribe tu correo institucional."
          : "Escribe un correo completo, por ejemplo ana@uni.edu.";
      }
      return ok;
    }

    email.addEventListener("blur", validateEmail);
    email.addEventListener("input", function () {
      if (emailField.classList.contains("is-invalid")) {
        var ok = emailValid.test(email.value.trim());
        if (ok) {
          emailField.classList.remove("is-invalid");
          email.setAttribute("aria-invalid", "false");
        }
      }
      emailField.classList.toggle("is-valid", emailValid.test(email.value.trim()));
    });
  }

  /* ---------------------------------------------------------------
     Loading button demo
     --------------------------------------------------------------- */

  var loadingDemo = $("[data-demo-loading]");
  if (loadingDemo) {
    var loadingText = $("[data-demo-text]", loadingDemo);
    var loadingLabel = loadingDemo.getAttribute("data-demo-label") || (loadingText ? loadingText.textContent : "Guardar avance");
    loadingDemo.addEventListener("click", function () {
      if (loadingDemo.classList.contains("is-loading")) return;
      loadingDemo.classList.add("is-loading");
      loadingDemo.setAttribute("aria-busy", "true");
      if (loadingText) loadingText.textContent = "Guardando…";
      window.setTimeout(function () {
        loadingDemo.classList.remove("is-loading");
        loadingDemo.setAttribute("aria-busy", "false");
        if (loadingText) loadingText.textContent = loadingLabel;
        toast("success", "Avance guardado", "Tu progreso se sincronizó con la unidad 3.");
      }, 1500);
    });
  }
})();
