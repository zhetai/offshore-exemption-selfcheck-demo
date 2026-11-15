/*
 * Offshore Exemption Material Self-Check — scoring core
 * -----------------------------------------------------
 * Pure, DOM-free logic so it can be unit tested in Node and reused
 * unchanged by the browser UI.
 *
 * Model
 *   - every applicable item is worth a weight by criticality
 *   - status maps to a completion value (present=1, partial=0.5, missing=0)
 *   - items marked "na" are excluded from the denominator
 *   - the readiness score is the weighted completion percentage
 *
 * Gates
 *   blocked   — at least one error finding (e.g. a critical item is missing)
 *   attention — warnings only, or score below READY_SCORE
 *   ready     — no findings and score at/above READY_SCORE
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SelfCheckScoring = factory();
  }
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  var STATUS = { PRESENT: "present", PARTIAL: "partial", MISSING: "missing", NA: "na" };

  var STATUS_LABEL = {
    present: "已齐备",
    partial: "部分具备",
    missing: "缺失",
    na: "不适用"
  };

  var STATUS_VALUE = { present: 1, partial: 0.5, missing: 0 };

  var WEIGHTS = { critical: 5, important: 3, supporting: 1 };

  var READY_SCORE = 90;

  var GATE_LABEL = {
    ready: "材料齐备，可安排复核",
    attention: "需要补充或复核",
    blocked: "存在阻断项，暂不可提交"
  };

  var SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

  /* ---------------------------------------------------------------- */

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function appliesToScenario(item, scenario) {
    if (!scenario || item.scenarios === "all") return true;
    return Array.isArray(item.scenarios) && item.scenarios.indexOf(scenario) !== -1;
  }

  function normalizeEntry(entry) {
    var status = isPlainObject(entry) ? entry.status : entry;
    var note = isPlainObject(entry) && typeof entry.note === "string" ? entry.note : "";
    if (Object.prototype.hasOwnProperty.call(STATUS_VALUE, status) === false && status !== STATUS.NA) {
      status = STATUS.MISSING;
    }
    return { status: status, note: note.trim() };
  }

  function entryFor(state, itemId) {
    var statuses = isPlainObject(state) && isPlainObject(state.statuses) ? state.statuses : {};
    return normalizeEntry(statuses[itemId]);
  }

  function itemWeight(item) {
    return WEIGHTS[item.criticality] || WEIGHTS.supporting;
  }

  function emptyCounts() {
    return { present: 0, partial: 0, missing: 0, na: 0, total: 0 };
  }

  function addToCounts(counts, status) {
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
    counts.total += 1;
  }

  function percent(earned, possible) {
    if (!possible) return 0;
    return Math.round((earned / possible) * 100);
  }

  /* ---------------------------------------------------------------- *
   * Public: compute the full evaluation for a state
   * ---------------------------------------------------------------- */
  function evaluate(data, state) {
    if (!data || !Array.isArray(data.ITEMS) || !Array.isArray(data.CATEGORIES)) {
      throw new TypeError("evaluate(data, state): data must expose ITEMS and CATEGORIES");
    }
    var source = isPlainObject(state) ? state : {};
    var scenario = source.scenario || "all";

    var categories = data.CATEGORIES.map(function (category) {
      return {
        id: category.id,
        label: category.label,
        labelEn: category.labelEn || "",
        earned: 0,
        possible: 0,
        score: null,
        counts: emptyCounts()
      };
    });
    var byId = {};
    categories.forEach(function (category) {
      byId[category.id] = category;
    });

    var totals = { earned: 0, possible: 0, counts: emptyCounts() };
    var rows = [];

    data.ITEMS.forEach(function (item) {
      if (!appliesToScenario(item, scenario)) return;

      var entry = entryFor(source, item.id);
      var weight = itemWeight(item);
      var category = byId[item.category];
      if (!category) return;

      addToCounts(category.counts, entry.status);
      addToCounts(totals.counts, entry.status);

      if (entry.status !== STATUS.NA) {
        category.possible += weight;
        totals.possible += weight;
        var value = STATUS_VALUE[entry.status] || 0;
        category.earned += weight * value;
        totals.earned += weight * value;
      }

      rows.push({
        id: item.id,
        title: item.title,
        titleEn: item.titleEn || "",
        category: item.category,
        criticality: item.criticality,
        weight: weight,
        status: entry.status,
        statusLabel: STATUS_LABEL[entry.status],
        note: entry.note
      });
    });

    categories.forEach(function (category) {
      category.score = category.possible ? percent(category.earned, category.possible) : null;
    });

    var findings = buildFindings(data, source, scenario, rows);
    var score = percent(totals.earned, totals.possible);
    var hasError = findings.some(function (finding) {
      return finding.severity === "error";
    });
    var hasWarning = findings.some(function (finding) {
      return finding.severity === "warning";
    });

    var gate = "ready";
    if (hasError) gate = "blocked";
    else if (hasWarning || score < READY_SCORE) gate = "attention";

    return {
      scenario: scenario,
      score: score,
      gate: gate,
      gateLabel: GATE_LABEL[gate],
      readyScore: READY_SCORE,
      counts: totals.counts,
      totals: { earned: Math.round(totals.earned * 10) / 10, possible: totals.possible },
      categories: categories,
      rows: rows,
      findings: findings
    };
  }

  /* ---------------------------------------------------------------- *
   * Consistency rules. Each finding is { id, severity, message, items }
   * ---------------------------------------------------------------- */
  function buildFindings(data, state, scenario, rows) {
    var findings = [];
    var rowById = {};
    rows.forEach(function (row) {
      rowById[row.id] = row;
    });

    function statusOf(id) {
      return rowById[id] ? rowById[id].status : null;
    }
    function titleOf(id) {
      return rowById[id] ? rowById[id].title : id;
    }
    function noteOf(id) {
      return rowById[id] ? rowById[id].note : "";
    }
    function push(id, severity, message, items) {
      findings.push({ id: id, severity: severity, message: message, items: items || [] });
    }

    var criticalRows = rows.filter(function (row) {
      return row.criticality === "critical";
    });

    /* R1/R2/R3 — critical evidence gates */
    criticalRows.forEach(function (row) {
      if (row.status === STATUS.MISSING) {
        push("critical-missing:" + row.id, "error",
          "关键材料缺失「" + row.title + "」：该项为阻断项，补齐后才能形成完整申请包。", [row.id]);
      } else if (row.status === STATUS.PARTIAL) {
        push("critical-partial:" + row.id, "warning",
          "关键材料不完整「" + row.title + "」：仅有部分证据，需补齐后再复核。", [row.id]);
      } else if (row.status === STATUS.NA) {
        push("critical-na:" + row.id, "error",
          "关键材料「" + row.title + "」被标记为不适用：关键项通常不可豁免，请说明理由或恢复适用。", [row.id]);
      }
    });

    /* R4 — trading claim without complete shipping documents */
    if (scenario === "trading" && statusOf("goods-shipping-docs") === STATUS.PARTIAL) {
      push("trading-shipping-incomplete", "warning",
        "买卖型个案以运输单据为核心证据，提单/空运单不齐容易在来源地判定上产生争议。",
        ["goods-shipping-docs"]);
    }

    /* R5 — funds flow support for recognised revenue */
    if (statusOf("funds-bank-statements") === STATUS.PARTIAL) {
      push("funds-bank-incomplete", "warning",
        "银行月结单不完整：需覆盖整个申报期，并能与销售合同及发票逐笔对应。",
        ["funds-bank-statements"]);
    }

    /* R6 — related-party list present but no pricing support */
    if (statusOf("risk-related-party") === STATUS.PRESENT &&
        statusOf("risk-transfer-pricing") === STATUS.MISSING) {
      push("related-party-no-pricing", "warning",
        "已列示关联交易但缺少定价依据或转让定价文档，建议补充可比数据或集团定价政策。",
        ["risk-related-party", "risk-transfer-pricing"]);
    }

    /* R7 — no evidence that processing happens outside HK */
    if (statusOf("funds-no-hk-processing") === STATUS.MISSING) {
      push("no-hk-processing-gap", "warning",
        "缺少「香港无实质处理」的说明与账目支持：这是离岸主张中最常被质疑的一环。",
        ["funds-no-hk-processing"]);
    }

    /* R8 — consistency memo missing while revenue is claimed */
    if (statusOf("risk-consistency-memo") === STATUS.MISSING) {
      push("consistency-memo-gap", "warning",
        "缺少口径一致性说明：需解释本期主张与往年申报口径是否一致及差异原因。",
        ["risk-consistency-memo"]);
    }

    /* R9 — partial/missing rows without a gap note */
    var undocumented = rows.filter(function (row) {
      return (row.status === STATUS.MISSING || row.status === STATUS.PARTIAL) && !noteOf(row.id);
    });
    if (undocumented.length) {
      push("undocumented-gaps", "info",
        "有 " + undocumented.length + " 项未齐备材料缺少缺口说明，建议记录待补内容与负责人。",
        undocumented.map(function (row) {
          return row.id;
        }));
    }

    /* R10 — positive signal for a clean package */
    var allPresent = rows.length > 0 && rows.every(function (row) {
      return row.status === STATUS.PRESENT || row.status === STATUS.NA;
    });
    if (allPresent) {
      push("package-complete", "info",
        "所有适用材料均已标记为齐备，建议交由执业税务顾问做最终复核。", []);
    }

    return findings.sort(function (a, b) {
      return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    });
  }

  /* ---------------------------------------------------------------- *
   * Export payload for download / audit
   * ---------------------------------------------------------------- */
  function buildExport(data, state) {
    var evaluation = evaluate(data, state);
    var source = isPlainObject(state) ? state : {};
    return {
      tool: "offshore-exemption-self-check",
      version: data.META ? data.META.version : "unknown",
      generated_at: new Date().toISOString(),
      case_name: typeof source.caseName === "string" && source.caseName ? source.caseName : "未命名个案",
      scenario: evaluation.scenario,
      gate: evaluation.gate,
      gate_label: evaluation.gateLabel,
      score: evaluation.score,
      counts: evaluation.counts,
      categories: evaluation.categories.map(function (category) {
        return {
          id: category.id,
          label: category.label,
          score: category.score,
          counts: category.counts
        };
      }),
      findings: evaluation.findings.map(function (finding) {
        return { id: finding.id, severity: finding.severity, message: finding.message };
      }),
      items: evaluation.rows.map(function (row) {
        return {
          id: row.id,
          category: row.category,
          title: row.title,
          criticality: row.criticality,
          status: row.status,
          note: row.note
        };
      }),
      disclaimer: data.META ? data.META.disclaimer : ""
    };
  }

  return {
    STATUS: STATUS,
    STATUS_LABEL: STATUS_LABEL,
    STATUS_VALUE: STATUS_VALUE,
    WEIGHTS: WEIGHTS,
    READY_SCORE: READY_SCORE,
    GATE_LABEL: GATE_LABEL,
    appliesToScenario: appliesToScenario,
    normalizeEntry: normalizeEntry,
    itemWeight: itemWeight,
    evaluate: evaluate,
    buildFindings: buildFindings,
    buildExport: buildExport
  };
});
