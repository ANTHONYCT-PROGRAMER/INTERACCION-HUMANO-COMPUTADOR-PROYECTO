/* MakerLearn Studio — Ruta Activa (pantalla de práctica) */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------
     Tema
     --------------------------------------------------------------- */

  var themeMeta = $('meta[name="theme-color"]');
  var themeToggle = $("#theme-toggle");

  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0F1117" : "#F7F8FC");
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
      themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    }
    if (persist) {
      try { localStorage.setItem("ml-theme", theme); } catch (err) { /* almacenamiento no disponible */ }
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }
  setTheme(root.dataset.theme === "light" ? "light" : "dark", false);

  /* ---------------------------------------------------------------
     Toasts
     --------------------------------------------------------------- */

  var toastRegion = $("#toasts");
  var toastIcons = { success: "#i-check", error: "#i-x", info: "#i-info", xp: "#i-sparkles" };

  function dismissToast(el) {
    if (!el || el.classList.contains("is-out")) return;
    el.classList.add("is-out");
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 200);
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

    var bodyEl = document.createElement("div");
    bodyEl.className = "toast__body";
    var titleEl = document.createElement("strong");
    titleEl.className = "toast__title";
    titleEl.textContent = title;
    var msg = document.createElement("span");
    msg.className = "toast__msg";
    msg.textContent = message;
    bodyEl.appendChild(titleEl);
    bodyEl.appendChild(msg);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "toast__close";
    close.setAttribute("aria-label", "Cerrar notificación");
    close.innerHTML = '<svg class="od-icon icon i-16" aria-hidden="true"><use href="#i-x"></use></svg>';
    close.addEventListener("click", function () { dismissToast(el); });

    el.appendChild(iconWrap);
    el.appendChild(bodyEl);
    el.appendChild(close);
    toastRegion.appendChild(el);

    var timer = window.setTimeout(function () { dismissToast(el); }, 5200);
    el.addEventListener("mouseenter", function () { window.clearTimeout(timer); });
    el.addEventListener("mouseleave", function () {
      timer = window.setTimeout(function () { dismissToast(el); }, 2600);
    });
  }

  /* ---------------------------------------------------------------
     XP y nivel
     --------------------------------------------------------------- */

  var XP_GOAL = 2000;
  var RING_C = 97.39;
  var xpCounter = $("#xp-counter");
  var xpRingValue = $("#xp-ring-value");
  var xpLevelEl = $(".xp-ring__level");
  var xpButton = $("#xp-button");
  var xpLevel = 7;
  var xpInLevel = 1420;

  function fmtNum(n) { return n.toLocaleString("en-US"); }

  function renderXP() {
    if (xpCounter) xpCounter.textContent = fmtNum(xpInLevel) + " XP";
    if (xpRingValue) {
      xpRingValue.setAttribute("stroke-dashoffset", String(RING_C * (1 - Math.min(1, xpInLevel / XP_GOAL))));
    }
    if (xpLevelEl) xpLevelEl.textContent = String(xpLevel);
    if (xpButton) {
      var pct = Math.round((xpInLevel / XP_GOAL) * 100);
      xpButton.setAttribute("aria-label",
        "Nivel " + xpLevel + ". " + fmtNum(xpInLevel) + " de " + fmtNum(XP_GOAL) + " XP para el nivel " +
        (xpLevel + 1) + ". Ver progreso");
      xpButton.setAttribute("data-tip",
        "Nivel " + xpLevel + " · " + fmtNum(xpInLevel) + " / " + fmtNum(XP_GOAL) + " XP");
      xpButton.dataset.pct = String(pct);
    }
  }

  function bumpXP(amount, message) {
    xpInLevel = Math.max(0, xpInLevel + amount);
    var leveledUp = false;
    while (xpInLevel >= XP_GOAL) {
      xpInLevel -= XP_GOAL;
      xpLevel += 1;
      leveledUp = true;
    }
    renderXP();
    if (leveledUp) {
      toast("success", "¡Subiste al nivel " + xpLevel + "!", "Tu XP se reinició para el nuevo nivel. Sigue así.");
    } else if (amount > 0) {
      toast("xp", "+" + amount + " XP", message);
    } else if (amount < 0) {
      toast("info", "−" + Math.abs(amount) + " XP", message);
    }
  }

  if (xpButton) {
    xpButton.addEventListener("click", function () {
      toast("info", "Nivel " + xpLevel + " · " + fmtNum(xpInLevel) + " / " + fmtNum(XP_GOAL) + " XP",
        xpButton.dataset.pct + "% del nivel " + xpLevel + " completado. " +
        fmtNum(XP_GOAL - xpInLevel) + " XP para el nivel " + (xpLevel + 1) + ".");
    });
  }

  renderXP();

  /* ---------------------------------------------------------------
     Cajones móviles (itinerario / tutor)
     --------------------------------------------------------------- */

  var scrim = $("#drawer-scrim");
  var practice = $(".practice");
  var openDrawerName = null;
  var lastDrawerTrigger = null;
  var drawerBreakpoints = { itinerary: 980, tutor: 1180 };
  var bottomTabs = $$(".bottom-nav__item");

  function setBottomTab(tabName) {
    bottomTabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.mobileTab === tabName);
      if (tab.dataset.mobileTab === tabName) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }

  function syncDrawerTriggers() {
    $$("[data-open-drawer]").forEach(function (btn) {
      btn.setAttribute("aria-expanded", String(btn.dataset.openDrawer === openDrawerName));
    });
  }

  function openDrawer(name, trigger) {
    var rail = document.getElementById(name);
    if (!rail) return;
    if (openDrawerName && openDrawerName !== name) closeDrawer(false);
    openDrawerName = name;
    rail.classList.add("is-open");
    if (scrim) scrim.hidden = false;
    body.classList.add("has-drawer");
    if (practice && "inert" in practice) practice.inert = true;
    syncDrawerTriggers();
    setBottomTab(name === "itinerary" ? "route" : "maki");
    lastDrawerTrigger = trigger || lastDrawerTrigger;
    var closeBtn = $("[data-close-drawer]", rail);
    if (closeBtn) window.setTimeout(function () { closeBtn.focus(); }, 60);
  }

  function closeDrawer(restoreFocus) {
    if (!openDrawerName) return;
    var rail = document.getElementById(openDrawerName);
    if (rail) rail.classList.remove("is-open");
    openDrawerName = null;
    if (scrim) scrim.hidden = true;
    body.classList.remove("has-drawer");
    if (practice && "inert" in practice) practice.inert = false;
    syncDrawerTriggers();
    setBottomTab("editor");
    if (restoreFocus && lastDrawerTrigger) lastDrawerTrigger.focus();
    lastDrawerTrigger = null;
  }

  $$("[data-open-drawer]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openDrawer(btn.dataset.openDrawer, btn);
    });
  });

  $$("[data-close-drawer]").forEach(function (btn) {
    btn.addEventListener("click", function () { closeDrawer(true); });
  });

  if (scrim) scrim.addEventListener("click", function () { closeDrawer(true); });

  bottomTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.dataset.openDrawer) return; // lo gestiona su propio listener
      closeDrawer(false);
      setBottomTab(tab.dataset.mobileTab);
    });
  });

  window.addEventListener("resize", function () {
    if (!openDrawerName) return;
    var bp = drawerBreakpoints[openDrawerName] || Infinity;
    if (window.innerWidth > bp) closeDrawer(false);
  });

  /* ---------------------------------------------------------------
     Notificaciones
     --------------------------------------------------------------- */

  var notifBtn = $("#notif-btn");
  var notifPanel = $("#notif-panel");
  var notifDot = $("#notif-dot");
  var markAllBtn = $("#mark-all");
  var notifEmpty = $("#notif-empty");

  function syncNotifs() {
    var unread = $$(".notif-item.is-unread", notifPanel || document).length;
    if (notifDot) {
      notifDot.textContent = String(unread);
      notifDot.hidden = unread === 0;
    }
    if (notifBtn) {
      notifBtn.setAttribute("aria-label",
        unread === 0 ? "Notificaciones, sin pendientes" : "Notificaciones, " + unread + " sin leer");
    }
    if (markAllBtn) markAllBtn.disabled = unread === 0;
    if (notifEmpty) notifEmpty.hidden = unread !== 0;
    return unread;
  }

  function setNotifPanel(open) {
    if (!notifPanel || !notifBtn) return;
    notifPanel.hidden = !open;
    notifBtn.setAttribute("aria-expanded", String(open));
  }

  if (notifBtn) {
    notifBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      setNotifPanel(notifPanel.hidden);
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", function () {
      $$(".notif-item.is-unread", notifPanel).forEach(function (item) {
        item.classList.remove("is-unread");
      });
      syncNotifs();
      toast("success", "Notificaciones al día", "No te quedan avisos sin leer.");
    });
  }

  $$("[data-notif]", notifPanel || document).forEach(function (item) {
    item.addEventListener("click", function () {
      var title = $(".notif-item__title", item);
      var desc = $(".notif-item__desc", item);
      item.classList.remove("is-unread");
      syncNotifs();
      setNotifPanel(false);
      toast("info", title ? title.textContent : "Notificación", desc ? desc.textContent : "");
    });
  });

  document.addEventListener("click", function (event) {
    if (notifPanel && !notifPanel.hidden && !event.target.closest(".notif-wrap")) {
      setNotifPanel(false);
    }
    var snip = $("#snippet-pop");
    if (snip && !snip.hidden && !event.target.closest(".editor") && !event.target.closest("#snippet-btn")) {
      closeSnippets();
    }
  });

  syncNotifs();

  /* ---------------------------------------------------------------
     Enunciado (modal)
     --------------------------------------------------------------- */

  var statementModal = $("#statement-modal");
  var lastStatementFocus = null;

  function openStatement(trigger) {
    if (!statementModal) return;
    lastStatementFocus = trigger || document.activeElement;
    statementModal.hidden = false;
    body.classList.add("has-modal");
    var closeBtn = $(".modal .icon-btn", statementModal);
    if (closeBtn) window.setTimeout(function () { closeBtn.focus(); }, 40);
  }

  function closeStatement() {
    if (!statementModal || statementModal.hidden) return;
    statementModal.hidden = true;
    body.classList.remove("has-modal");
    if (lastStatementFocus && lastStatementFocus.focus) lastStatementFocus.focus();
    lastStatementFocus = null;
  }

  $$("[data-open-statement]").forEach(function (btn) {
    btn.addEventListener("click", function () { openStatement(btn); });
  });
  $$("[data-close-statement]").forEach(function (btn) {
    btn.addEventListener("click", closeStatement);
  });

  /* ---------------------------------------------------------------
     Temporizador de sesión
     --------------------------------------------------------------- */

  var timerBtn = $("#timer");
  var timerValue = $("#timer-value");
  var timerSeconds = 12 * 60 + 34;
  var timerPaused = false;
  var timerDone = false;

  function renderTimer() {
    var m = Math.floor(timerSeconds / 60);
    var s = timerSeconds % 60;
    if (timerValue) timerValue.textContent = m + ":" + (s < 10 ? "0" : "") + s;
    if (!timerBtn) return;
    timerBtn.classList.toggle("is-paused", timerPaused && !timerDone);
    timerBtn.classList.toggle("is-done", timerDone);
    var state = timerDone
      ? "Temporizador finalizado."
      : "Temporizador: " + m + " minutos " + s + " segundos. " + (timerPaused ? "Reanudar." : "Pausar.");
    timerBtn.setAttribute("aria-label", state);
  }

  if (timerBtn) {
    timerBtn.addEventListener("click", function () {
      if (timerDone) return;
      timerPaused = !timerPaused;
      renderTimer();
      toast("info", timerPaused ? "Sesión en pausa" : "Sesión reanudada",
        timerPaused ? "El tiempo de práctica se detiene." : "El cronómetro vuelve a contar.");
    });
  }

  window.setInterval(function () {
    if (timerPaused || timerDone) return;
    timerSeconds = Math.max(0, timerSeconds - 1);
    if (timerSeconds === 0) {
      timerDone = true;
      toast("info", "Tiempo agotado", "18 min completados en esta sesión de práctica.");
    }
    renderTimer();
  }, 1000);

  renderTimer();

  /* ---------------------------------------------------------------
     Guardar y ejecutar
     --------------------------------------------------------------- */

  var saveBtn = $("#save-btn");
  var fileDot = $("#file-dot");
  var runBtn = $("#run-btn");
  var runLabel = $("#run-label");
  var termOut = $("#terminal-output");
  var termLoading = $("#terminal-loading");
  var running = false;
  var fixApplied = false;
  var allGreen = false;

  function setDirty(dirty) {
    if (fileDot) fileDot.hidden = !dirty;
  }

  function saveCode() {
    setDirty(false);
    toast("success", "Código guardado", "dijkstra.cpp se sincronizó con tu progreso.");
  }

  if (saveBtn) saveBtn.addEventListener("click", saveCode);

  /* --- utilidades de terminal --- */

  function termCmd(text) {
    var div = document.createElement("div");
    div.className = "term-line";
    div.innerHTML = '<span class="term-prompt">$</span> ';
    div.appendChild(document.createTextNode(text));
    return div;
  }

  function termResult(ok, text, time, tag) {
    var div = document.createElement("div");
    div.className = "term-line " + (ok ? "term-ok" : "term-fail");
    div.innerHTML = '<svg class="od-icon icon i-14" aria-hidden="true"><use href="' +
      (ok ? "#i-check" : "#i-x") + '"></use></svg> ';
    div.appendChild(document.createTextNode(text + " "));
    if (time) {
      var dim = document.createElement("span");
      dim.className = "term-dim";
      dim.textContent = time;
      div.appendChild(dim);
    }
    if (tag) {
      var tagEl = document.createElement("span");
      tagEl.className = "term-tag";
      tagEl.textContent = tag;
      div.appendChild(tagEl);
    }
    return div;
  }

  function termSummary(ok, count) {
    var div = document.createElement("div");
    div.className = "term-summary";
    div.textContent = count + " pruebas superadas ";
    var span = document.createElement("span");
    span.textContent = ok ? "· sin fallos" : "· 1 fallo";
    div.appendChild(span);
    return div;
  }

  function scrollTerminal() {
    var panelBody = termOut ? termOut.parentNode : null;
    if (panelBody && "scrollTop" in panelBody) panelBody.scrollTop = panelBody.scrollHeight;
  }

  /* --- panel de pruebas --- */

  var testsCount = $("#tests-count");
  var testDense = $("#test-dense");
  var testNote = $("#test-note");
  var criteriaTests = $("#criteria-tests");
  var gutterTodo = $("#gutter-todo");
  var challengeStatus = $("#challenge-status");

  /* Estados de prueba del brief: ✅ PASÓ · ⏳ EN ESPERA · ❌ FALLÓ · 🔒 BLOQUEADO */
  var testRows = $$(".test[data-test]");
  var TEST_LABELS = { passed: "✅ PASÓ", pending: "⏳ EN ESPERA", failed: "❌ FALLÓ", locked: "🔒 BLOQUEADO" };
  var TEST_ICONS = { passed: "#i-check", pending: "#i-clock", failed: "#i-x", locked: "#i-lock" };

  function testRow(n) { return $('.test[data-test="' + n + '"]'); }

  function setTestStatus(row, status) {
    if (!row || !TEST_LABELS[status]) return;
    row.dataset.status = status;
    row.classList.toggle("is-pass", status === "passed");
    row.classList.toggle("is-fail", status === "failed");
    var use = $("use", row);
    if (use) use.setAttribute("href", TEST_ICONS[status]);
    var chip = $(".test__status", row);
    if (chip) chip.textContent = TEST_LABELS[status];
  }

  function setAllTestsPending() {
    testRows.forEach(function (row) {
      if (row.dataset.test === "5") return;
      setTestStatus(row, "pending");
    });
    var dense = testRow(4);
    var time = dense ? $(".test__time", dense) : null;
    if (time) time.textContent = "…";
  }

  function syncDenseTag(isFail) {
    var dense = testRow(4);
    if (!dense) return;
    var chip = $(".test__status", dense);
    var tag = $(".test__tag", dense);
    if (isFail) {
      if (!tag && chip) {
        tag = document.createElement("span");
        tag.className = "test__tag";
        tag.textContent = "TLE";
        chip.appendChild(tag);
      }
    } else if (tag && tag.parentNode) {
      tag.parentNode.removeChild(tag);
    }
  }

  function setRunnableTests(pass) {
    if (pass) {
      [1, 2, 3, 4].forEach(function (n) { setTestStatus(testRow(n), "passed"); });
      var time = $(".test__time", testRow(4));
      if (time) time.textContent = "0.41 s";
      syncDenseTag(false);
    } else {
      [1, 2, 3].forEach(function (n) { setTestStatus(testRow(n), "passed"); });
      setTestStatus(testRow(4), "failed");
      var timeFail = $(".test__time", testRow(4));
      if (timeFail) timeFail.textContent = "2.01 s";
      syncDenseTag(true);
    }
  }

  function markCriteriaDone(key) {
    var li = document.querySelector('[data-criteria="' + key + '"]');
    if (!li || li.classList.contains("is-done")) return false;
    li.classList.add("is-done");
    var icon = $(".criteria__icon", li);
    if (icon) icon.innerHTML = '<svg class="od-icon icon i-12" aria-hidden="true"><use href="#i-check"></use></svg>';
    syncCriteriaCount();
    return true;
  }

  function syncCriteriaCount() {
    var done = $$(".criteria-list li.is-done").length;
    var el = $("#criteria-count");
    if (el) el.textContent = done + " de 3";
  }

  function applyPassState() {
    allGreen = true;
    if (testsCount) {
      testsCount.textContent = "4/4";
      testsCount.classList.add("is-success");
    }
    setRunnableTests(true);
    if (testNote) {
      testNote.classList.add("is-success");
      testNote.textContent = "Las 4 pruebas pasan dentro del límite: el test 04 baja a 0.41 s al descartar entradas obsoletas.";
    }
    if (criteriaTests) criteriaTests.textContent = "4 de 4 superadas";
    markCriteriaDone("tests");
    if (challengeStatus) {
      challengeStatus.classList.add("is-done");
      challengeStatus.innerHTML = '<span class="status-dot"></span>Completada';
    }
    if (gutterTodo) {
      gutterTodo.classList.remove("is-todo");
      gutterTodo.classList.add("is-fixed");
    }
    setNextEnabled(true);
  }

  /* --- secuencia de ejecución --- */

  function finishRun(pass) {
    running = false;
    if (runBtn) runBtn.disabled = false;
    if (runBtn) runBtn.classList.remove("is-loading");
    if (runLabel) runLabel.textContent = "Ejecutar Tests";
    if (termLoading) termLoading.hidden = true;
    if (termOut) termOut.classList.remove("is-dim");

    if (!pass) failedAttempts += 1;
    var unlocked = pass ? [] : syncHintLocks();
    renderHintsTab();

    if (termOut) {
      termOut.textContent = "";
      termOut.appendChild(termCmd("g++ -std=c++17 -O2 dijkstra.cpp -o dijkstra"));
      termOut.appendChild(termResult(true, "Compilación exitosa", "· 0.12 s"));
      termOut.appendChild(termCmd("./dijkstra --test all"));
      termOut.appendChild(termResult(true, "01 · Camino simple", "0.01 s"));
      termOut.appendChild(termResult(true, "02 · Grafo con ciclos", "0.02 s"));
      termOut.appendChild(termResult(true, "03 · Nodo inalcanzable", "0.01 s"));
      if (pass) {
        termOut.appendChild(termResult(true, "04 · Grafo denso (10⁵ nodos)", "0.41 s"));
        termOut.appendChild(termSummary(true, "4/4"));
      } else {
        termOut.appendChild(termResult(false, "04 · Grafo denso (10⁵ nodos)", "2.01 s", "TLE"));
        termOut.appendChild(termSummary(false, "3/4"));
      }
      appendTermCaret();
    }
    scrollTerminal();
    activatePanelTab("tests", false);

    setRunnableTests(pass);
    if (testsCount) testsCount.textContent = pass ? "4/4" : "3/4";

    if (pass && !allGreen) {
      applyPassState();
      setMaki("cheer",
        "<b>¡4 de 4!</b> El descarte de obsoletos mantiene la cola limpia: cada arista se relaja una vez. Explícale con tus palabras por qué baja de 2 s.");
      bumpXP(80, "4/4 pruebas superadas · el test denso ya entra en el límite de 2.00 s.");
      celebrate();
      setComprehension(82, "Sube al resolver el caso denso sin ayuda.");
    } else if (pass) {
      toast("success", "4/4 pruebas", "Tu solución sigue pasando todas las pruebas.");
    } else {
      setMaki("think",
        "<b>No pasa nada, equivocarse es parte de aprender.</b> Falla «04 · Grafo denso» por trabajo repetido en la cola. " +
        "Antes de gastar XP, te dejo un <b>empujón gratis</b>: antes de relajar una arista, compara <code>d</code> con <code>dist[u]</code> y descarta la entrada si ya no coinciden. " +
        "Cuando quieras vuelve a ejecutar; aquí no hay prisa.");
      toast("info", "Empujón gratis de Maki", "Sin coste de XP: revisa el descarte de entradas obsoletas antes de relajar.");
      toast("error", "1 prueba sin pasar todavía", "04 · Grafo denso — 2.01 s de 2.00 s (TLE). Es un detalle fino: la lógica ya es correcta.");
      setComprehension(comprehensionPct - 2, "Un intento que no salió: así se aprende a comparar d con dist[u] antes de relajar.");
      unlocked.forEach(function (n) {
        toast("xp", "Pista " + n + " disponible",
          "Tras " + failedAttempts + " intento fallido" + (failedAttempts > 1 ? "s" : "") +
          " ya puedes abrir «Pista " + n + "» si la necesitas. Solo entonces se descuentan XP.");
      });
      if (testNote && !allGreen && failedAttempts >= 1) {
        testNote.textContent = failedAttempts === 1
          ? "El test 04 supera el límite de 2.00 s. Empujón gratis: revisa el descarte de obsoletos (Pista 2 disponible si la necesitas)."
          : "El test 04 sigue fuera del límite. Recuerda: la cola conserva trabajo que ya no aporta (Pista 3 disponible si la necesitas).";
      }
    }
  }

  function runTests() {
    if (running || !runBtn) return;
    running = true;
    setAllTestsPending();
    if (testNote) {
      testNote.classList.remove("is-success");
      testNote.textContent = "Ejecutando las 4 pruebas… los estados pasan de ⏳ EN ESPERA a su resultado.";
    }
    activatePanelTab("tests", true);
    var panel = runBtn.closest(".workbench") ? $(".panel", runBtn.closest(".workbench")) : null;
    if (panel) panel.classList.remove("is-collapsed");
    var toggle = $("#panel-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    runBtn.disabled = true;
    runBtn.classList.add("is-loading");
    if (runLabel) runLabel.textContent = "Ejecutando…";
    if (termLoading) termLoading.hidden = false;
    if (termOut) termOut.classList.add("is-dim");

    window.setTimeout(function () { finishRun(fixApplied); }, reduceMotion ? 60 : 1500);
  }

  if (runBtn) runBtn.addEventListener("click", runTests);

  /* ---------------------------------------------------------------
     Snippets
     --------------------------------------------------------------- */

  var snippetBtn = $("#snippet-btn");
  var snippetPop = $("#snippet-pop");

  function closeSnippets() {
    if (!snippetPop || snippetPop.hidden) return;
    snippetPop.hidden = true;
    if (snippetBtn) snippetBtn.setAttribute("aria-expanded", "false");
  }

  function toggleSnippets(force) {
    if (!snippetPop || !snippetBtn) return;
    var open = typeof force === "boolean" ? force : snippetPop.hidden;
    snippetPop.hidden = !open;
    snippetBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      var first = $(".snippet-opt", snippetPop);
      if (first) first.focus();
    }
  }

  if (snippetBtn) snippetBtn.addEventListener("click", function () { toggleSnippets(); });

  var snippetLabels = {
    stale: ["Snippet aplicado", "if (d != dist[u]) continue; se insertó en la línea 16."],
    relax: ["Snippet insertado", "pq.push({dist[v], v}); se agregó en la línea 16."],
    greater: ["Snippet insertado", "greater<pair<int,int>> ya está en la declaración de la cola."]
  };

  $$("[data-snippet]").forEach(function (opt) {
    opt.addEventListener("click", function () {
      var kind = opt.dataset.snippet;
      opt.classList.add("is-applied");
      setDirty(true);
      closeSnippets();

      if (kind === "stale" && !fixApplied) {
        fixApplied = true;
        if (gutterTodo) {
          gutterTodo.classList.remove("is-todo");
          gutterTodo.classList.add("is-current");
        }
        if (markCriteriaDone("stale")) {
          toast("xp", "+0 XP · Criterio cumplido", "«Descarta entradas obsoletas» está en verde. Ejecuta las pruebas.");
        } else {
          toast("success", snippetLabels.stale[0], snippetLabels.stale[1]);
        }
      } else {
        var label = snippetLabels[kind] || ["Snippet insertado", "Código agregado en la línea 16."];
        toast("success", label[0], label[1]);
      }
    });
  });

  /* ---------------------------------------------------------------
     Panel inferior: pestañas y colapso
     --------------------------------------------------------------- */

  var panelTabs = [$("#tab-tests"), $("#tab-terminal"), $("#tab-hints")].filter(Boolean);
  var panelBodies = { tests: $("#tests-panel"), terminal: $("#term-panel"), hints: $("#hints-panel") };
  var panelToggle = $("#panel-toggle");
  var activeTab = "terminal";

  function panelName(tab) { return tab.id.replace("tab-", ""); }

  function activatePanelTab(name, expand) {
    activeTab = name;
    panelTabs.forEach(function (tab) {
      var selected = (tab.id === "tab-" + name);
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    Object.keys(panelBodies).forEach(function (key) {
      if (panelBodies[key]) panelBodies[key].hidden = key !== name;
    });
    if (expand) {
      var panel = $(".panel");
      if (panel) panel.classList.remove("is-collapsed");
      if (panelToggle) {
        panelToggle.setAttribute("aria-expanded", "true");
        panelToggle.setAttribute("aria-label", "Contraer panel");
      }
    }
  }

  panelTabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activatePanelTab(panelName(tab), true);
    });
    tab.addEventListener("keydown", function (event) {
      var nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % panelTabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + panelTabs.length) % panelTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = panelTabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      panelTabs[nextIndex].focus();
      activatePanelTab(panelName(panelTabs[nextIndex]), true);
    });
  });

  if (panelToggle) {
    panelToggle.addEventListener("click", function () {
      var panel = $(".panel");
      if (!panel) return;
      var collapsed = panel.classList.toggle("is-collapsed");
      panelToggle.setAttribute("aria-expanded", String(!collapsed));
      panelToggle.setAttribute("aria-label", collapsed ? "Expandir panel" : "Contraer panel");
    });
  }

  /* ---------------------------------------------------------------
     Maki (tutor socrático)
     --------------------------------------------------------------- */

  var maki = $("[data-maki]");
  var makiSpeech = $("#maki-speech");

  function setMaki(state, html) {
    if (maki) maki.setAttribute("data-state", state);
    if (makiSpeech) makiSpeech.innerHTML = html;
  }

  var makiPrompts = {
    test: [
      "think",
      "<b>El fallo es el 04:</b> grafo denso · 2.01 s de 2.00 s. La lógica está bien; la cola acumula entradas que ya salieron. ¿Qué comparación te dice que una entrada quedó vieja?"
    ],
    hint: [
      "think",
      "<b>Pista, no solución:</b> cada par guarda (distancia tentativa, vértice) y la cola siempre entrega el menor. Si un vértice ya salió con su distancia final, ¿qué ocurre cuando vuelve a aparecer?"
    ]
  };

  $$("[data-maki-prompt]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var prompt = makiPrompts[chip.dataset.makiPrompt];
      if (!prompt) return;
      setMaki(prompt[0], prompt[1]);
      if (chip.dataset.makiPrompt === "test") activatePanelTab("tests", true);
    });
  });

  /* ---------------------------------------------------------------
     Pistas (desbloqueo por intentos fallidos · brief)
     --------------------------------------------------------------- */

  var hintNodes = $$("[data-hint]");

  function syncHintsCount() {
    var opened = hintNodes.filter(function (hint) {
      return hint.classList.contains("is-open");
    }).length;
    var el = $("#hints-count");
    if (el) el.textContent = opened + " de " + hintNodes.length;
  }

  hintNodes.forEach(function (hint) {
    var toggle = $(".hint__toggle", hint);
    var panel = $(".hint__panel", hint);
    if (!toggle || !panel) return;

    toggle.addEventListener("click", function () {
      if (hint.hasAttribute("data-locked")) {
        if (!reduceMotion) {
          hint.classList.remove("is-shake");
          void hint.offsetWidth;
          hint.classList.add("is-shake");
          window.setTimeout(function () { hint.classList.remove("is-shake"); }, 420);
        }
        toast("info", "Pista " + hint.dataset.hint + " bloqueada",
          "Se desbloquea tras " + (hint.dataset.hint === "2" ? "1" : "2") +
          " intento fallido" + (hint.dataset.hint === "2" ? "" : "s") + " de tests.");
        return;
      }
      var willOpen = !hint.classList.contains("is-open");
      hint.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
      panel.hidden = !willOpen;

      if (willOpen && hint.dataset.revealed !== "true") {
        hint.dataset.revealed = "true";
        var cost = parseInt(hint.dataset.cost || "0", 10);
        if (cost) bumpXP(-cost, "Pista " + hint.dataset.hint + " revelada · apunta a la pista mínima.");
      }
      syncHintsCount();
      renderHintsTab();
    });
  });

  syncHintsCount();

  /* ---------------------------------------------------------------
     Barra inferior: Anterior · Ejecutar Tests · Siguiente Reto
     --------------------------------------------------------------- */

  var prevBtn = $("#prev-btn");
  var nextBtn = $("#next-btn");
  var failedAttempts = 0;
  var celebrateDone = false;

  function setNextEnabled(enabled) {
    if (!nextBtn) return;
    nextBtn.disabled = !enabled;
    if (enabled) {
      nextBtn.removeAttribute("data-tip");
      nextBtn.setAttribute("aria-disabled", "false");
    } else {
      nextBtn.setAttribute("data-tip", "Pasa las 4 pruebas para avanzar");
      nextBtn.setAttribute("aria-disabled", "true");
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      toast("info", "Reto 1 · Fundamentos", "Ya completado. Puedes repasarlo desde el itinerario de la izquierda.");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (nextBtn.disabled) return;
      toast("success", "Reto 3 de 4 desbloqueado", "Siguiente: «Grafo disperso». Tu racha y tu XP ya quedaron registrados.");
    });
  }

  /* ---------------------------------------------------------------
     Terminal: cursor parpadeante al final de cada ejecución
     --------------------------------------------------------------- */

  function appendTermCaret() {
    if (!termOut) return;
    var line = document.createElement("div");
    line.className = "term-line";
    var prompt = document.createElement("span");
    prompt.className = "term-prompt";
    prompt.textContent = "$";
    var caret = document.createElement("span");
    caret.className = "term-caret";
    caret.setAttribute("aria-hidden", "true");
    line.appendChild(prompt);
    line.appendChild(caret);
    termOut.appendChild(line);
  }

  /* ---------------------------------------------------------------
     Tu comprensión (anillo del brief, arranca en 68 %)
     --------------------------------------------------------------- */

  var COMPREHENSION_C = 113.1; /* 2πr con r = 18 */
  var comprehensionPct = 68;
  var comprehensionPctEl = $("#comprehension-pct");
  var comprehensionRing = $("#comprehension-ring");
  var comprehensionNote = $("#comprehension-note");

  function setComprehension(pct, note) {
    if (typeof pct !== "number" || isNaN(pct)) return;
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    comprehensionPct = pct;
    if (comprehensionPctEl) comprehensionPctEl.textContent = pct + "%";
    if (comprehensionRing) comprehensionRing.setAttribute("stroke-dashoffset", String(COMPREHENSION_C * (1 - pct / 100)));
    if (note && comprehensionNote) comprehensionNote.textContent = note;
  }

  /* ---------------------------------------------------------------
     Recompensa: confeti + «+80 XP» flotante + racha
     --------------------------------------------------------------- */

  function floatXP(text) {
    if (reduceMotion) return;
    var anchor = xpButton || $(".topbar");
    if (!anchor) return;
    var rect = anchor.getBoundingClientRect();
    var el = document.createElement("span");
    el.className = "xp-float";
    el.textContent = text;
    el.style.left = Math.max(8, rect.left - 4) + "px";
    el.style.top = (rect.top + 8) + "px";
    body.appendChild(el);
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1400);
  }

  function bumpStreak() {
    var streak = $(".stat-streak");
    if (!streak) return;
    var value = $(".stat-streak__value", streak);
    var current = value ? (parseInt(value.textContent.replace(/\D+/g, ""), 10) || 0) : 0;
    if (value) value.textContent = String(current + 1);
    streak.setAttribute("aria-label", "Racha de " + (current + 1) + " días");
    if (!reduceMotion) {
      streak.classList.add("is-bumped");
      window.setTimeout(function () { streak.classList.remove("is-bumped"); }, 640);
    }
  }

  function confetti() {
    if (reduceMotion) return;
    var layer = document.createElement("div");
    layer.className = "confetti-layer";
    layer.setAttribute("aria-hidden", "true");
    var colors = ["#7FE7C4", "#B3A1FF", "#FFC86B", "#FF8095", "#61AFEF"];
    for (var i = 0; i < 44; i++) {
      var bit = document.createElement("span");
      bit.className = "confetti-bit";
      bit.style.left = (Math.random() * 100).toFixed(2) + "%";
      bit.style.top = "-4vh";
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty("--bit-dx", Math.round(Math.random() * 160 - 80) + "px");
      bit.style.setProperty("--bit-rot", Math.round(360 + Math.random() * 540) + "deg");
      bit.style.setProperty("--bit-dur", (1.1 + Math.random() * 0.9).toFixed(2) + "s");
      bit.style.animationDelay = (Math.random() * 0.25).toFixed(2) + "s";
      layer.appendChild(bit);
    }
    body.appendChild(layer);
    window.setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 2800);
  }

  function celebrate() {
    if (celebrateDone) return;
    celebrateDone = true;
    floatXP("+80 XP");
    bumpStreak();
    confetti();
  }

  /* ---------------------------------------------------------------
     Pistas: helpers de desbloqueo y pestaña «Pistas»
     --------------------------------------------------------------- */

  function hintNode(n) { return $('.hint[data-hint="' + n + '"]'); }

  function unlockHint(n, silent) {
    var hint = hintNode(n);
    if (!hint || !hint.hasAttribute("data-locked")) return false;
    hint.removeAttribute("data-locked");
    var toggle = $(".hint__toggle", hint);
    if (toggle) {
      toggle.removeAttribute("aria-disabled");
      toggle.removeAttribute("data-tip");
    }
    if (!silent) toast("xp", "Pista " + n + " desbloqueada", "Ya puedes abrirla; al abrirla se descuentan XP.");
    return true;
  }

  function syncHintLocks() {
    var unlocked = [];
    if (failedAttempts >= 1 && unlockHint(2, true)) unlocked.push(2);
    if (failedAttempts >= 2 && unlockHint(3, true)) unlocked.push(3);
    return unlocked;
  }

  var hintTabItems = $$("[data-hint-tab]");

  function renderHintsTab() {
    hintTabItems.forEach(function (item) {
      var n = parseInt(item.dataset.hintTab, 10);
      var hint = hintNodes[n - 1];
      var open = !!hint && hint.classList.contains("is-open");
      var locked = !!hint && hint.hasAttribute("data-locked");
      item.dataset.state = open ? "open" : (locked ? "locked" : "ready");
      var use = $(".od-icon use", item);
      if (use) use.setAttribute("href", open ? "#i-check" : (locked ? "#i-lock" : "#i-sparkles"));
      var state = $(".hints-tab__state", item);
      if (state) {
        state.textContent = open
          ? "Abierta"
          : locked
            ? (n === 2 ? "Tras 1 intento fallido" : "Tras 2 intentos fallidos")
            : "Lista · −" + (hint ? (hint.dataset.cost || "0") : "0") + " XP";
      }
    });
  }

  /* ---------------------------------------------------------------
     Maki: análisis socrático e input «Pregúntame algo…»
     --------------------------------------------------------------- */

  var makiThread = $("#maki-thread");
  var makiChat = $("#maki-chat");
  var makiInput = $("#maki-input");
  var makiAnalyzeBtn = $("#maki-analyze");

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pushMakiMessage(who, html) {
    if (!makiThread) return;
    var msg = document.createElement("div");
    msg.className = "maki-msg maki-msg--" + who;
    var whoEl = document.createElement("span");
    whoEl.className = "maki-msg__who";
    whoEl.textContent = who === "user" ? "Tú" : "Maki";
    var bodyEl = document.createElement("div");
    bodyEl.innerHTML = html;
    msg.appendChild(whoEl);
    msg.appendChild(bodyEl);
    makiThread.appendChild(msg);
    makiThread.hidden = false;
    while (makiThread.children.length > 6) {
      makiThread.removeChild(makiThread.firstElementChild);
    }
  }

  function makiCalmDown() {
    window.setTimeout(function () {
      if (maki && maki.getAttribute("data-state") === "think") maki.setAttribute("data-state", "idle");
    }, 2600);
  }

  function socraticReply(text) {
    var t = String(text).toLowerCase();
    if (/complejidad|o\(|tle|tiempo|lento|2\.0/.test(t)) {
      return "<b>Sobre el coste:</b> ¿cuántas veces puede entrar el mismo vértice en la cola si no descartas nada? Dime el orden de magnitud de esas inserciones y lo comparamos con el número de aristas.";
    }
    if (/cola|priority_queue|montículo|monticulo|heap|menor|par/.test(t)) {
      return "<b>Justo ahí:</b> el montículo te da el mínimo en O(log n). ¿Qué parte del par (distancia, vértice) tienes que comprobar para saber que esa entrada ya no sirve?";
    }
    if (/test|prueba|falla|error|04/.test(t)) {
      return "<b>Mira la pestaña Tests:</b> el 04 (grafo denso) es el único que se sale del límite. Si 01–03 pasan, la lógica es correcta; el problema es trabajo repetido. ¿Dónde lo estás repitiendo?";
    }
    if (/pista|ayuda|no sé|nose|duda|perdido|bloquead|no entiendo|no lo entiendo/.test(t)) {
      return "<b>Tranquilo, es normal atascarse aquí.</b> Empujón gratis, sin XP: cada par guarda (distancia tentativa, vértice). Si un vértice ya salió con su distancia final, ¿qué debería hacer tu código cuando vuelve a aparecer en la cola? Piénsalo y me lo cuentas.";
    }
    if (/gracias|entend|claro|listo|ya está|resuelto/.test(t)) {
      return "<b>Bien, ¡vas por buen camino!</b> Ahora al revés: si quitaras ese descarte, ¿por qué el caso denso se vuelve cuadrático?";
    }
    return "<b>Buena pregunta.</b> Antes de responderla, dime qué crees que ocurre cuando un vértice se inserta más de una vez con distancias distintas. Si prefieres, escribe «no sé» y te doy una pista sin coste.";
  }

  if (makiChat) {
    makiChat.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = makiInput && makiInput.value ? makiInput.value.trim() : "";
      if (!text) {
        toast("info", "Escribe tu pregunta", "Maki responde con preguntas, no con la solución.");
        return;
      }
      pushMakiMessage("user", escapeHtml(text));
      if (makiInput) makiInput.value = "";
      var reply = socraticReply(text);
      setMaki("think", reply);
      pushMakiMessage("maki", reply);
      setComprehension(comprehensionPct + 3, "Sube cuando preguntas y avanzas sin pedir la solución.");
      window.setTimeout(function () {
        if (maki && maki.getAttribute("data-state") === "think") maki.setAttribute("data-state", "idle");
      }, 2600);
    });
  }

  if (makiAnalyzeBtn) {
    makiAnalyzeBtn.addEventListener("click", function () {
      var failing = $('.test[data-status="failed"] .test__name');
      var pending = $$('.test[data-status="pending"]').length;
      var analysis;
      if (allGreen) {
        analysis = "<b>Análisis:</b> tu solución ya pasa las 4 pruebas con el descarte activo. La pregunta que toca ahora: ¿por qué sin ese <code>continue</code> el caso denso se vuelve cuadrático?";
      } else if (failing) {
        analysis = "<b>Análisis de Maki:</b> falla «" + failing.textContent + "». Buenas noticias: la lógica base es correcta; el problema es trabajo repetido en la cola, no un error tuyo de concepto. ¿Qué comparación descarta una entrada obsoleta antes de relajar? Si te bloqueas, dime «no sé» y te doy un empujón sin coste.";
      } else {
        analysis = "<b>Análisis de Maki:</b> hay " + pending + " prueba(s) sin resultado. Ejecuta los tests y te digo exactamente dónde mirar.";
      }
      setMaki("think", analysis);
      pushMakiMessage("maki", analysis);
      activatePanelTab("tests", true);
      window.setTimeout(function () {
        if (maki && maki.getAttribute("data-state") === "think") maki.setAttribute("data-state", "idle");
      }, 2600);
    });
  }

  /* ---------------------------------------------------------------
     Variante «Test fallido» (?state=fallido)
     --------------------------------------------------------------- */

  var variant = (window.location.search.match(/[?&]state=([a-z]+)/) || [])[1] || "";

  function applyFailedVariant() {
    setTestStatus(testRow(1), "passed");
    setTestStatus(testRow(2), "failed");
    setTestStatus(testRow(3), "pending");
    setTestStatus(testRow(4), "locked");
    setTestStatus(testRow(5), "locked");

    var row2 = testRow(2);
    if (row2) {
      var time2 = $(".test__time", row2);
      if (time2) time2.textContent = "0.03 s";
      var chip2 = $(".test__status", row2);
      if (chip2) {
        var tag2 = document.createElement("span");
        tag2.className = "test__tag";
        tag2.textContent = "RE";
        chip2.appendChild(tag2);
      }
    }

    if (testsCount) testsCount.textContent = "1/4";
    if (testNote) {
      testNote.classList.remove("is-success");
      testNote.textContent = "Variante «test fallido»: 02 · Grafo con ciclos termina con error de ejecución (índice fuera de rango). El resto queda en espera.";
    }

    failedAttempts = 1;
    unlockHint(2, true);
    renderHintsTab();

    if (termOut) {
      termOut.textContent = "";
      termOut.appendChild(termCmd("g++ -std=c++17 -O2 dijkstra.cpp -o dijkstra"));
      termOut.appendChild(termResult(true, "Compilación exitosa", "· 0.12 s"));
      termOut.appendChild(termCmd("./dijkstra --test all"));
      termOut.appendChild(termResult(true, "01 · Camino simple", "0.01 s"));
      termOut.appendChild(termResult(false, "02 · Grafo con ciclos", "0.03 s", "RE"));
      var err = document.createElement("div");
      err.className = "term-line term-fail";
      err.textContent = "  terminate called after throwing: vector::_M_range_check: __n (2) >= this->size() (2)";
      termOut.appendChild(err);
      termOut.appendChild(termResult(false, "03 · Nodo inalcanzable", "—", "SKIP"));
      termOut.appendChild(termSummary(false, "1/4"));
      appendTermCaret();
    }

    if (gutterTodo) {
      gutterTodo.classList.remove("is-todo");
      gutterTodo.classList.add("is-error");
    }

    setMaki("think",
      "<b>Fíjate en el 02:</b> el grafo trae un ciclo y estás leyendo un vértice que no comprobaste. ¿Qué validación pondrías antes de tocar <code>g[v]</code>?");
    setComprehension(54, "La variante de fallo baja la estimación: vuelve a intentarlo.");
  }

  /* ---------------------------------------------------------------
     Arranque de las ampliaciones del brief
     --------------------------------------------------------------- */

  setComprehension(68, null);
  setNextEnabled(false);
  renderHintsTab();
  if (variant === "fallido") applyFailedVariant();

  /* ---------------------------------------------------------------
     Fase bloqueada y enlaces de demostración
     --------------------------------------------------------------- */

  $$("[data-locked-phase]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toast("info", "Fase 3 bloqueada", "Completa la Fase 2 para desbloquear la Mini-App.");
    });
  });

  $$("[data-demo-nav]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      toast("info", link.dataset.demoNav, "Sección de demostración: no está incluida en esta vista previa.");
    });
  });

  var profileBtn = $("[data-profile]");
  if (profileBtn) {
    profileBtn.addEventListener("click", function () {
      toast("info", "Ana Ríos · Nivel " + xpLevel,
        "Estudiante de ingeniería · racha de 5 días · " + fmtNum(xpInLevel) + " XP en el nivel actual.");
    });
  }

  /* ---------------------------------------------------------------
     Atajos de teclado
     --------------------------------------------------------------- */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (statementModal && !statementModal.hidden) { closeStatement(); return; }
      if (snippetPop && !snippetPop.hidden) { closeSnippets(); snippetBtn && snippetBtn.focus(); return; }
      if (notifPanel && !notifPanel.hidden) { setNotifPanel(false); notifBtn && notifBtn.focus(); return; }
      if (openDrawerName) { closeDrawer(true); return; }
      return;
    }

    var key = event.key && event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (event.ctrlKey && !event.altKey && key === " ") {
      event.preventDefault();
      toggleSnippets();
      return;
    }
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      runTests();
      return;
    }
    if (event.ctrlKey && key === "s") {
      event.preventDefault();
      saveCode();
    }
  });

  /* Marca de hidratación: confirma que la pantalla se inicializó por completo. */
  root.dataset.enhanced = "true";
})();
