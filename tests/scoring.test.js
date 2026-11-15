#!/usr/bin/env node
/*
 * Unit tests for the scoring core.
 * Run with:  node tests/scoring.test.js
 */
"use strict";

var assert = require("node:assert/strict");
var data = require("../assets/js/data/checklist.js");
var scoring = require("../assets/js/core/scoring.js");

var passed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write("  ok   " + name + "\n");
  } catch (error) {
    failures.push({ name: name, error: error });
    process.stdout.write("  FAIL " + name + "\n       " + error.message + "\n");
  }
}

function statusMap(status) {
  var map = {};
  data.ITEMS.forEach(function (item) {
    map[item.id] = { status: status, note: "" };
  });
  return map;
}

function stateFor(status, scenario) {
  return { scenario: scenario || "trading", caseName: "test", statuses: statusMap(status) };
}

/* ---------------------------------------------------------------- */
process.stdout.write("\nOffshore self-check — scoring tests\n\n");

test("dataset is well formed", function () {
  assert.ok(Array.isArray(data.ITEMS) && data.ITEMS.length >= 20, "expected at least 20 items");
  var ids = data.ITEMS.map(function (item) {
    return item.id;
  });
  assert.equal(new Set(ids).size, ids.length, "item ids must be unique");
  var categoryIds = data.CATEGORIES.map(function (category) {
    return category.id;
  });
  data.ITEMS.forEach(function (item) {
    assert.ok(categoryIds.indexOf(item.category) !== -1, "unknown category on " + item.id);
    assert.ok(
      ["critical", "important", "supporting"].indexOf(item.criticality) !== -1,
      "bad criticality on " + item.id
    );
  });
});

test("sample case only references known items", function () {
  var known = data.ITEMS.map(function (item) {
    return item.id;
  });
  Object.keys(data.SAMPLE_CASE.statuses).forEach(function (id) {
    assert.ok(known.indexOf(id) !== -1, "sample references unknown item " + id);
  });
});

test("every item is reachable by at least one scenario", function () {
  data.SCENARIOS.forEach(function (scenario) {
    data.ITEMS.forEach(function (item) {
      if (scoring.appliesToScenario(item, scenario.id)) {
        assert.ok(true);
      }
    });
  });
  var scenarios = data.SCENARIOS.map(function (scenario) {
    return scenario.id;
  });
  data.ITEMS.forEach(function (item) {
    var reachable = item.scenarios === "all" || item.scenarios.some(function (id) {
      return scenarios.indexOf(id) !== -1;
    });
    assert.ok(reachable, item.id + " is unreachable by any scenario");
  });
});

test("all-present trading package scores 100 and is ready", function () {
  var result = scoring.evaluate(data, stateFor("present", "trading"));
  assert.equal(result.score, 100);
  assert.equal(result.gate, "ready");
  assert.equal(result.counts.missing, 0);
  assert.equal(result.counts.partial, 0);
});

test("all-missing package scores 0 and is blocked", function () {
  var result = scoring.evaluate(data, stateFor("missing", "trading"));
  assert.equal(result.score, 0);
  assert.equal(result.gate, "blocked");
  assert.ok(result.findings.some(function (finding) {
    return finding.severity === "error";
  }));
});

test("na items leave the denominator instead of scoring zero", function () {
  var state = stateFor("present", "trading");
  state.statuses["operations-meetings"] = { status: "na", note: "线上会议" };
  var withNa = scoring.evaluate(data, state);
  assert.equal(withNa.score, 100);

  state.statuses["operations-meetings"] = { status: "missing", note: "缺" };
  var withMissing = scoring.evaluate(data, state);
  assert.ok(withMissing.score < 100, "missing supporting item must reduce the score");
});

test("criticality weights change the score", function () {
  var state = stateFor("present", "trading");
  state.statuses["risk-transfer-pricing"] = { status: "missing", note: "" };
  var supportingLost = scoring.evaluate(data, state).score;

  var state2 = stateFor("present", "trading");
  state2.statuses["contract-sales"] = { status: "missing", note: "" };
  var criticalLost = scoring.evaluate(data, state2).score;

  assert.ok(criticalLost < supportingLost, "losing a critical item must cost more");
});

test("partial package is capped at 100 but below full marks", function () {
  var result = scoring.evaluate(data, stateFor("partial", "trading"));
  assert.equal(result.score, 50);
  assert.equal(result.gate, "attention");
});

test("partial critical evidence produces a warning, not silence", function () {
  var result = scoring.evaluate(data, stateFor("partial", "trading"));
  assert.ok(result.findings.some(function (finding) {
    return finding.id === "critical-partial:contract-sales" && finding.severity === "warning";
  }));
});

test("marking a critical item na is an error", function () {
  var state = stateFor("present", "trading");
  state.statuses["funds-bank-statements"] = { status: "na", note: "不适用" };
  var result = scoring.evaluate(data, state);
  assert.equal(result.gate, "blocked");
  assert.ok(result.findings.some(function (finding) {
    return finding.id === "critical-na:funds-bank-statements";
  }));
});

test("scenario switching changes the applicable item set", function () {
  var trading = scoring.evaluate(data, stateFor("present", "trading"));
  var service = scoring.evaluate(data, stateFor("present", "service"));
  assert.ok(trading.rows.length !== service.rows.length, "scenarios should not share an identical item set");
  var tradingIds = trading.rows.map(function (row) {
    return row.id;
  });
  assert.ok(tradingIds.indexOf("goods-shipping-docs") !== -1);
  assert.equal(service.rows.map(function (row) {
    return row.id;
  }).indexOf("goods-shipping-docs"), -1);
  assert.ok(service.rows.some(function (row) {
    return row.id === "goods-service-delivery";
  }));
});

test("trading row without shipping documents is flagged", function () {
  var state = stateFor("present", "trading");
  state.statuses["goods-shipping-docs"] = { status: "partial", note: "缺 2 票" };
  var result = scoring.evaluate(data, state);
  assert.ok(result.findings.some(function (finding) {
    return finding.id === "trading-shipping-incomplete";
  }));
});

test("related-party without pricing support is flagged", function () {
  var state = stateFor("present", "trading");
  state.statuses["risk-transfer-pricing"] = { status: "missing", note: "" };
  var result = scoring.evaluate(data, state);
  assert.ok(result.findings.some(function (finding) {
    return finding.id === "related-party-no-pricing";
  }));
});

test("undocumented gaps are reported as info only", function () {
  var state = stateFor("missing", "trading");
  var result = scoring.evaluate(data, state);
  var info = result.findings.filter(function (finding) {
    return finding.id === "undocumented-gaps";
  });
  assert.equal(info.length, 1);
  assert.equal(info[0].severity, "info");
});

test("findings are ordered error -> warning -> info", function () {
  var result = scoring.evaluate(data, data.SAMPLE_CASE);
  var order = { error: 0, warning: 1, info: 2 };
  result.findings.forEach(function (finding, index) {
    if (index === 0) return;
    assert.ok(
      order[result.findings[index - 1].severity] <= order[finding.severity],
      "findings out of order at " + finding.id
    );
  });
});

test("unknown statuses fall back to missing", function () {
  var state = stateFor("present", "trading");
  state.statuses["contract-sales"] = { status: "definitely-not-a-status", note: "" };
  var entry = scoring.normalizeEntry(state.statuses["contract-sales"]);
  assert.equal(entry.status, "missing");
});

test("evaluate tolerates missing state fields", function () {
  var result = scoring.evaluate(data, {});
  assert.equal(result.score, 0);
  assert.equal(result.gate, "blocked");
});

test("non-empty case yields a stable export payload", function () {
  var payload = scoring.buildExport(data, data.SAMPLE_CASE);
  assert.equal(payload.tool, "offshore-exemption-self-check");
  assert.equal(payload.case_name, data.SAMPLE_CASE.caseName);
  assert.ok(payload.items.length > 0);
  assert.ok(payload.findings.length > 0);
  assert.ok(payload.disclaimer.length > 0);
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(payload.generated_at));
});

test("sample case is blocked, and nobody expects a perfect demo", function () {
  var result = scoring.evaluate(data, data.SAMPLE_CASE);
  assert.ok(result.score > 0 && result.score < 100, "sample score should be partial, got " + result.score);
  assert.equal(result.gate, "blocked", "sample intentionally has blocking gaps");
});

/* ---------------------------------------------------------------- */
process.stdout.write("\n" + passed + " passed, " + failures.length + " failed\n\n");
if (failures.length) {
  failures.forEach(function (failure) {
    process.stdout.write("--- " + failure.name + "\n" + (failure.error.stack || "") + "\n");
  });
  process.exit(1);
}
