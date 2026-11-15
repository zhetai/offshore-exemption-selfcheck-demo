/*
 * Offshore Exemption Material Self-Check — UI layer
 * -------------------------------------------------
 * Plain DOM, no dependencies, no build step. State lives in memory and
 * is mirrored to localStorage so a demo session survives a refresh.
 */
(function () {
  "use strict";

  var DATA = window.SelfCheckData;
  var S = window.SelfCheckScoring;
  var STORAGE_KEY = "oesc.state.v1";
  var RING_CIRCUMFERENCE = 326.73; /* 2πr, r = 52 */
  var SEVERITY_LABEL = { error: "阻断", warning: "注意", info: "提示" };
  var CRIT_LABEL = { critical: "关键", important: "重要", supporting: "辅助" };
  var STATUS_BUTTONS = [
    { status: S.STATUS.PRESENT, label: "齐备" },
    { status: S.STATUS.PARTIAL, label: "部分" },
    { status: S.STATUS.MISSING, label: "缺失" },
    { status: S.STATUS.NA, label: "不适用" }
  ];

  var els = {};
  var saveTimer = null;
  var toastTimer = null;

  /* ------------------------------------------------------------ state */

  function blankStatuses() {
    var statuses = {};
    DATA.ITEMS.forEach(function (item) {
      statuses[item.id] = { status: S.STATUS.MISSING, note: "" };
    });
    return statuses;
  }

  function blankState() {
    return {
      version: 1,
      scenario: defaultScenario(),
      caseName: "",
      statuses: blankStatuses()
    };
  }

  function defaultScenario() {
    var found = DATA.SCENARIOS.filter(function (scenario) {
      return scenario.default;
    })[0];
    return found ? found.id : DATA.SCENARIOS[0].id;
  }

  function stateFromSample() {
    var sample = DATA.SAMPLE_CASE;
    var statuses = blankStatuses();
    Object.keys(sample.statuses).forEach(function (id) {
      if (statuses[id]) statuses[id] = S.normalizeEntry(sample.statuses[id]);
    });
    return {
      version: 1,
      scenario: sample.scenario,
      caseName: sample.caseName || "",
      statuses: statuses
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return stateFromSample();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.statuses) return stateFromSample();
      var statuses = blankStatuses();
      Object.keys(parsed.statuses).forEach(function (id) {
        if (statuses[id]) statuses[id] = S.normalizeEntry(parsed.statuses[id]);
      });
      var scenarioOk = DATA.SCENARIOS.some(function (scenario) {
        return scenario.id === parsed.scenario;
      });
      return {
        version: 1,
        scenario: scenarioOk ? parsed.scenario : defaultScenario(),
        caseName: typeof parsed.caseName === "string" ? parsed.caseName : "",
        statuses: statuses
      };
    } catch (error) {
      return stateFromSample();
    }
  }

  var state = loadState();

  function saveState(immediate) {
    window.clearTimeout(saveTimer);
    function write() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        /* private mode / file:// with storage disabled — demo still works in memory */
      }
    }
    if (immediate) write();
    else saveTimer = window.setTimeout(write, 250);
  }

  /* ------------------------------------------------------------ helpers */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function statusOf(itemId) {
    return S.normalizeEntry(state.statuses[itemId]).status;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.setAttribute("data-visible", "true");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.setAttribute("data-visible", "false");
    }, 2400);
  }

  function setPrintStatus(row, status) {
    var target = row.querySelector(".print-status");
    if (target) target.textContent = S.STATUS_LABEL[status] || "";
  }

  /* ------------------------------------------------------------ render */

  function scenarioById(id) {
    return DATA.SCENARIOS.filter(function (scenario) {
      return scenario.id === id;
    })[0];
  }

  function renderScenarioOptions() {
    els.scenario.innerHTML = DATA.SCENARIOS.map(function (scenario) {
      return '<option value="' + escapeHtml(scenario.id) + '">' + escapeHtml(scenario.label) + "</option>";
    }).join("");
    els.scenario.value = state.scenario;
    updateScenarioHint();
  }

  function updateScenarioHint() {
    var scenario = scenarioById(state.scenario);
    els.scenarioHint.textContent = scenario ? scenario.hint : "";
  }

  function renderGroups() {
    var html = DATA.CATEGORIES.map(function (category) {
      var items = DATA.ITEMS.filter(function (item) {
        return item.category === category.id && S.appliesToScenario(item, state.scenario);
      });
      if (!items.length) return "";

      var rows = items.map(function (item) {
        var status = statusOf(item.id);
        var note = S.normalizeEntry(state.statuses[item.id]).note;
        var placeholder = status === S.STATUS.PRESENT ? "" : "缺口说明（选填）";
        var evidence = (item.evidence || []).map(function (line) {
          return "<li>" + escapeHtml(line) + "</li>";
        }).join("");
        var buttons = STATUS_BUTTONS.map(function (button) {
          var pressed = button.status === status;
          return '<button type="button" data-set-status="' + button.status + '"' +
            ' aria-pressed="' + (pressed ? "true" : "false") + '">' + button.label + "</button>";
        }).join("");

        return '<li class="item" data-id="' + escapeHtml(item.id) + '" data-status="' + status + '">' +
          '<div class="item-main">' +
            '<div class="item-head">' +
              "<h4>" + escapeHtml(item.title) +
                (item.titleEn ? ' <span class="en">' + escapeHtml(item.titleEn) + "</span>" : "") +
              "</h4>" +
              '<span class="crit" data-level="' + escapeHtml(item.criticality) + '">' +
                CRIT_LABEL[item.criticality] + "</span>" +
            "</div>" +
            '<ul class="evidence">' + evidence + "</ul>" +
          "</div>" +
          '<div class="item-side">' +
            '<div class="segmented" role="group" aria-label="' + escapeHtml(item.title) + ' 齐备程度">' +
              buttons +
            "</div>" +
            '<span class="print-status" aria-hidden="true">' + S.STATUS_LABEL[status] + "</span>" +
            '<input class="note" type="text" maxlength="120" data-note="' + escapeHtml(item.id) + '"' +
              ' placeholder="' + placeholder + '" aria-label="' + escapeHtml(item.title) + ' 缺口说明"' +
              ' value="' + escapeHtml(note) + '">' +
          "</div>" +
        "</li>";
      }).join("");

      return '<section class="group" data-category="' + escapeHtml(category.id) + '" data-tone="good">' +
        '<div class="group-head">' +
          "<h3>" + escapeHtml(category.label) +
            ' <small>' + escapeHtml(category.labelEn) + "</small>" +
          "</h3>" +
          '<div class="group-score">' +
            '<span class="group-percent">—</span>' +
            '<span class="bar"><span></span></span>' +
          "</div>" +
        "</div>" +
        '<ul class="items">' + rows + "</ul>" +
      "</section>";
    }).join("");

    els.groups.innerHTML = html || '<p class="empty-note">当前主张类型没有适用项目。</p>';
  }

  function renderSummary() {
    var result = S.evaluate(DATA, state);

    els.score.textContent = result.score;
    els.gate.textContent = result.gateLabel;
    els.gate.setAttribute("data-gate", result.gate);
    els.ring.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - result.score / 100)).toFixed(2);
    els.ring.style.stroke =
      result.gate === "ready" ? "var(--present)" : result.gate === "attention" ? "var(--partial)" : "var(--missing)";

    els.countPresent.textContent = result.counts.present;
    els.countPartial.textContent = result.counts.partial;
    els.countMissing.textContent = result.counts.missing;
    els.countNa.textContent = result.counts.na;

    /* per-category bars */
    result.categories.forEach(function (category) {
      var group = els.groups.querySelector('[data-category="' + category.id + '"]');
      if (!group) return;
      var percent = group.querySelector(".group-percent");
      var bar = group.querySelector(".bar > span");
      percent.textContent = category.score === null ? "—" : category.score + "%";
      bar.style.width = (category.score === null ? 0 : category.score) + "%";
      if (category.score === null) group.setAttribute("data-tone", "good");
      else if (category.score < 60) group.setAttribute("data-tone", "bad");
      else if (category.score < 85) group.setAttribute("data-tone", "warn");
      else group.setAttribute("data-tone", "good");
    });

    /* rows: reflect the authoritative status after any state change */
    result.rows.forEach(function (row) {
      var element = els.groups.querySelector('.item[data-id="' + row.id + '"]');
      if (!element) return;
      if (element.getAttribute("data-status") !== row.status) {
        element.setAttribute("data-status", row.status);
        Array.prototype.forEach.call(element.querySelectorAll(".segmented button"), function (button) {
          button.setAttribute("aria-pressed", button.getAttribute("data-set-status") === row.status ? "true" : "false");
        });
        setPrintStatus(element, row.status);
      }
    });

    /* findings */
    els.findingCount.textContent = result.findings.length;
    if (!result.findings.length) {
      els.findings.innerHTML = '<li class="findings-empty">未发现需要注意的问题。</li>';
    } else {
      els.findings.innerHTML = result.findings.map(function (finding) {
        return '<li class="finding" data-severity="' + finding.severity + '">' +
          "<span>" + SEVERITY_LABEL[finding.severity] + "</span>" +
          "<p>" + escapeHtml(finding.message) + "</p>" +
        "</li>";
      }).join("");
    }

    return result;
  }

  function renderAll() {
    renderScenarioOptions();
    renderGroups();
    if (document.activeElement !== els.caseName) els.caseName.value = state.caseName;
    renderSummary();
  }

  /* ------------------------------------------------------------ actions */

  function setStatus(itemId, status) {
    var entry = S.normalizeEntry(state.statuses[itemId]);
    state.statuses[itemId] = { status: status, note: entry.note };
    var element = els.groups.querySelector('.item[data-id="' + itemId + '"]');
    if (element) {
      element.setAttribute("data-status", status);
      Array.prototype.forEach.call(element.querySelectorAll(".segmented button"), function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-set-status") === status ? "true" : "false");
      });
      var noteInput = element.querySelector("input[data-note]");
      if (noteInput) noteInput.placeholder = status === S.STATUS.PRESENT ? "" : "缺口说明（选填）";
      setPrintStatus(element, status);
    }
    saveState();
    renderSummary();
  }

  function setNote(itemId, note) {
    var entry = S.normalizeEntry(state.statuses[itemId]);
    state.statuses[itemId] = { status: entry.status, note: note };
    saveState();
    renderSummary();
  }

  function slug(value) {
    var cleaned = String(value || "case")
      .trim()
      .replace(/[^\w\u4e00-\u9fa5.-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return cleaned || "case";
  }

  function timestamp() {
    var now = new Date();
    function pad(number) {
      return String(number).padStart(2, "0");
    }
    return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes());
  }

  function exportJson() {
    var payload = S.buildExport(DATA, state);
    var text = JSON.stringify(payload, null, 2);
    var filename = "selfcheck-" + slug(state.caseName) + "-" + timestamp() + ".json";
    try {
      var blob = new Blob([text], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      toast("已导出 " + filename);
    } catch (error) {
      /* older browsers: fall back to a data URL */
      var link2 = document.createElement("a");
      link2.href = "data:application/json;charset=utf-8," + encodeURIComponent(text);
      link2.download = filename;
      link2.click();
      toast("已导出 " + filename);
    }
  }

  function loadSample() {
    state = stateFromSample();
    renderAll();
    saveState(true);
    toast("已载入脱敏示例个案");
  }

  function resetAll() {
    if (!window.confirm("清空当前个案的所有标记与备注？此操作不可撤销。")) return;
    state = blankState();
    renderAll();
    saveState(true);
    toast("已重置为空白清单");
  }

  /* ------------------------------------------------------------ wiring */

  function bind() {
    els.groups.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-set-status]");
      if (!button) return;
      var row = button.closest(".item");
      if (!row) return;
      setStatus(row.getAttribute("data-id"), button.getAttribute("data-set-status"));
    });

    els.groups.addEventListener("input", function (event) {
      var input = event.target.closest("input[data-note]");
      if (!input) return;
      setNote(input.getAttribute("data-note"), input.value);
    });

    els.scenario.addEventListener("change", function () {
      state.scenario = els.scenario.value;
      updateScenarioHint();
      renderGroups();
      renderSummary();
      saveState(true);
    });

    els.caseName.addEventListener("input", function () {
      state.caseName = els.caseName.value;
      saveState();
    });

    document.getElementById("btn-sample").addEventListener("click", loadSample);
    document.getElementById("btn-reset").addEventListener("click", resetAll);
    document.getElementById("btn-export").addEventListener("click", exportJson);
    document.getElementById("btn-print").addEventListener("click", function () {
      window.print();
    });
  }

  function cacheElements() {
    els.score = document.getElementById("score");
    els.gate = document.getElementById("gate");
    els.ring = document.getElementById("ring-value");
    els.countPresent = document.getElementById("count-present");
    els.countPartial = document.getElementById("count-partial");
    els.countMissing = document.getElementById("count-missing");
    els.countNa = document.getElementById("count-na");
    els.scenario = document.getElementById("scenario");
    els.scenarioHint = document.getElementById("scenario-hint");
    els.caseName = document.getElementById("case-name");
    els.groups = document.getElementById("groups");
    els.findings = document.getElementById("findings");
    els.findingCount = document.getElementById("finding-count");
    els.toast = document.getElementById("toast");
  }

  function init() {
    if (!DATA || !S) {
      document.getElementById("groups").innerHTML =
        '<p class="empty-note">数据或评分模块加载失败，请确认 assets/js 目录完整。</p>';
      return;
    }
    cacheElements();
    els.ring.classList.add("is-instant");
    document.getElementById("disclaimer").textContent = DATA.META.disclaimer;
    document.getElementById("version").textContent = DATA.META.version;
    renderAll();
    bind();

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        els.ring.classList.remove("is-instant");
      });
    });

    if (!window.localStorage.getItem(STORAGE_KEY)) {
      toast("已载入脱敏示例，可直接体验评分与导出");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
