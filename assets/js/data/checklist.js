/*
 * Offshore Exemption Material Self-Check — checklist data
 * ------------------------------------------------
 * Sanitized demo data only. No client names, no real entity details.
 * Everything here is a generic, illustrative template used by the demo UI.
 *
 * Loaded either as a classic browser script (window.SelfCheckData)
 * or as a CommonJS module in Node (used by tests/scoring.test.js).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SelfCheckData = factory();
  }
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  var META = {
    version: "1.0.0",
    updated: "2025-01-01",
    disclaimer:
      "本工具仅用于检查离岸豁免（offshore claim）支持材料的完整性与一致性，不构成税务、会计或法律意见，也不保证豁免申请获批。正式提交前请咨询执业税务顾问。"
  };

  /* ------------------------------------------------------------------ *
   * Claim scenarios — the profile decides which evidence items apply.
   * ------------------------------------------------------------------ */
  var SCENARIOS = [
    {
      id: "trading",
      label: "货物买卖 Trading",
      hint: "香港公司向境外客户买卖货物，货物不经过香港。",
      default: true
    },
    {
      id: "service",
      label: "服务 / 佣金 Service & commission",
      hint: "向境外客户提供服务或撮合交易并收取费用或佣金。",
      default: false
    },
    {
      id: "manufacturing",
      label: "制造与加工 Manufacturing",
      hint: "委外加工或自设境外工厂，加工工序在香港以外完成。",
      default: false
    },
    {
      id: "ip",
      label: "知识产权 / 特许权 IP & royalties",
      hint: "授权使用知识产权并收取特许权使用费。",
      default: false
    }
  ];

  /* ------------------------------------------------------------------ *
   * Evidence categories
   * ------------------------------------------------------------------ */
  var CATEGORIES = [
    { id: "entity", label: "主体与架构", labelEn: "Entity & group structure" },
    { id: "contract", label: "合同与订单", labelEn: "Contracts & orders" },
    { id: "goods", label: "货物流 / 交付", labelEn: "Goods flow & delivery" },
    { id: "funds", label: "资金流", labelEn: "Funds flow" },
    { id: "operations", label: "营运与人员", labelEn: "Operations & personnel" },
    { id: "tax", label: "申报与账目一致性", labelEn: "Filings & reconciliation" },
    { id: "risk", label: "风险与合规", labelEn: "Risk & compliance" }
  ];

  /* ------------------------------------------------------------------ *
   * Evidence items.
   *   criticality: critical | important | supporting
   *   scenarios:   "all" or a list of scenario ids the item applies to
   * ------------------------------------------------------------------ */
  var ITEMS = [
    /* --- Entity & group structure ----------------------------------- */
    {
      id: "entity-registration",
      category: "entity",
      title: "公司注册与商业登记文件",
      titleEn: "Incorporation & business registration",
      evidence: ["公司注册证书", "商业登记证", "最新周年申报表"],
      criticality: "critical",
      scenarios: "all"
    },
    {
      id: "entity-group-chart",
      category: "entity",
      title: "集团架构图（含境外关联公司）",
      titleEn: "Group chart incl. overseas affiliates",
      evidence: ["显示持股与控制关系的架构图", "境外关联公司的注册地及业务说明"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "entity-board-minutes",
      category: "entity",
      title: "董事会决议与会议记录",
      titleEn: "Board resolutions & minutes",
      evidence: ["说明离岸业务安排的董事会决议", "决策过程的地点与参与人记录"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "entity-overseas-presence",
      category: "entity",
      title: "境外经营场所或团队证明",
      titleEn: "Overseas premises / team evidence",
      evidence: ["境外办公室租约", "境外员工名册或代理协议"],
      criticality: "important",
      scenarios: ["trading", "service", "manufacturing", "ip"]
    },

    /* --- Contracts & orders ---------------------------------------- */
    {
      id: "contract-sales",
      category: "contract",
      title: "销售合同 / 订单（境外客户）",
      titleEn: "Sales contracts / POs",
      evidence: ["已签署的销售合同", "订单、报价单及客户确认记录"],
      criticality: "critical",
      scenarios: "all"
    },
    {
      id: "contract-purchase",
      category: "contract",
      title: "采购合同 / 供应商合同",
      titleEn: "Purchase / supplier contracts",
      evidence: ["已签署的采购合同", "供应商报价与确认记录"],
      criticality: "critical",
      scenarios: ["trading", "manufacturing"]
    },
    {
      id: "contract-negotiation",
      category: "contract",
      title: "合同洽谈过程证据",
      titleEn: "Negotiation evidence",
      evidence: ["洽谈邮件往来", "投标或询价文件", "出差与会议安排"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "contract-counterparty-profile",
      category: "contract",
      title: "客户与供应商背景资料",
      titleEn: "Counterparty profiles",
      evidence: ["对方注册地、地址与联系人", "公开登记信息打印件"],
      criticality: "supporting",
      scenarios: "all"
    },

    /* --- Goods flow & delivery ------------------------------------- */
    {
      id: "goods-shipping-docs",
      category: "goods",
      title: "提单 / 空运单等运输单据",
      titleEn: "Bills of lading / AWB",
      evidence: ["海运提单或空运单", "显示装运港与目的港均在香港以外"],
      criticality: "critical",
      scenarios: ["trading"]
    },
    {
      id: "goods-customs",
      category: "goods",
      title: "进出口报关与清关文件",
      titleEn: "Customs declarations",
      evidence: ["出口/进口报关单", "清关代理文件"],
      criticality: "important",
      scenarios: ["trading", "manufacturing"]
    },
    {
      id: "goods-warehouse",
      category: "goods",
      title: "仓储与库存记录",
      titleEn: "Warehouse & stock records",
      evidence: ["境外仓库出入库记录", "证明货物未在港存放的库存台账"],
      criticality: "important",
      scenarios: ["trading"]
    },
    {
      id: "goods-service-delivery",
      category: "goods",
      title: "服务交付证明",
      titleEn: "Service delivery evidence",
      evidence: ["工作底稿或交付物", "客户验收单", "服务工时与执行地记录"],
      criticality: "critical",
      scenarios: ["service", "ip"]
    },
    {
      id: "goods-manufacturing-flow",
      category: "goods",
      title: "生产工序与加工地证明",
      titleEn: "Production process & location",
      evidence: ["工序流程单", "加工厂照片与产能说明", "委托加工协议"],
      criticality: "critical",
      scenarios: ["manufacturing"]
    },

    /* --- Funds flow ------------------------------------------------- */
    {
      id: "funds-bank-statements",
      category: "funds",
      title: "银行月结单（境外收款）",
      titleEn: "Bank statements",
      evidence: ["覆盖申报期的银行月结单", "标注对应销售合同或发票的收款记录"],
      criticality: "critical",
      scenarios: "all"
    },
    {
      id: "funds-payment-records",
      category: "funds",
      title: "收付款凭证与外汇记录",
      titleEn: "Payment vouchers & FX records",
      evidence: ["付款水单与银行确认", "结汇或外汇申报记录"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "funds-no-hk-processing",
      category: "funds",
      title: "香港无实质处理的说明与证据",
      titleEn: "No HK processing evidence",
      evidence: ["香港无加工、无存货的说明", "账目与凭证支持该说明"],
      criticality: "important",
      scenarios: "all"
    },

    /* --- Operations & personnel ------------------------------------ */
    {
      id: "operations-hk-staff",
      category: "operations",
      title: "香港员工名单与职责说明",
      titleEn: "HK staff list & duties",
      evidence: ["员工名单、职位与工作内容", "强积金或薪酬记录"],
      criticality: "critical",
      scenarios: "all"
    },
    {
      id: "operations-overseas-staff",
      category: "operations",
      title: "境外员工或代理名单",
      titleEn: "Overseas staff / agents",
      evidence: ["境外人员名单与职责", "代理协议及佣金安排"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "operations-travel",
      category: "operations",
      title: "出入境与出差记录",
      titleEn: "Travel records",
      evidence: ["出入境记录", "机票与酒店凭证"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "operations-meetings",
      category: "operations",
      title: "境外会议纪要",
      titleEn: "Overseas meeting minutes",
      evidence: ["会议纪要（注明地点与参与人）", "签到表或会议材料"],
      criticality: "supporting",
      scenarios: "all"
    },

    /* --- Filings & reconciliation ---------------------------------- */
    {
      id: "tax-financial-statements",
      category: "tax",
      title: "审计报告与财务报表",
      titleEn: "Audited financial statements",
      evidence: ["申报期审计报告", "收入与成本明细附注"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "tax-prior-returns",
      category: "tax",
      title: "往年利得税报税表与评税通知",
      titleEn: "Prior profits tax returns",
      evidence: ["已提交的报税表", "评税通知书与税务局往来函件"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "tax-income-reconciliation",
      category: "tax",
      title: "收入明细与账目核对表",
      titleEn: "Income schedule & reconciliation",
      evidence: ["按客户与合同列示的收入明细", "与总账及审计报告核对一致的说明"],
      criticality: "critical",
      scenarios: "all"
    },

    /* --- Risk & compliance ----------------------------------------- */
    {
      id: "risk-related-party",
      category: "risk",
      title: "关联交易清单与定价依据",
      titleEn: "Related-party transactions",
      evidence: ["关联交易清单", "定价政策或可比数据说明"],
      criticality: "important",
      scenarios: "all"
    },
    {
      id: "risk-transfer-pricing",
      category: "risk",
      title: "转让定价文档",
      titleEn: "Transfer pricing documentation",
      evidence: ["本地文档摘要", "集团定价政策"],
      criticality: "supporting",
      scenarios: "all"
    },
    {
      id: "risk-consistency-memo",
      category: "risk",
      title: "口径一致性说明备忘",
      titleEn: "Consistency memo",
      evidence: ["与往年申报口径一致的说明", "差异解释"],
      criticality: "important",
      scenarios: "all"
    }
  ];

  /* ------------------------------------------------------------------ *
   * Sanitized sample case — a partially prepared package so the demo
   * shows a realistic score instead of an empty or perfect state.
   * ------------------------------------------------------------------ */
  var SAMPLE_CASE = {
    id: "sample-case-a",
    label: "示例个案 A（脱敏）",
    caseName: "Sample Case A（脱敏）",
    scenario: "trading",
    statuses: {
      "entity-registration": { status: "present", note: "" },
      "entity-group-chart": { status: "present", note: "" },
      "entity-board-minutes": { status: "partial", note: "仅有 2022 年一份决议，缺少最近一期。" },
      "entity-overseas-presence": { status: "na", note: "本个案无境外常设机构。" },
      "contract-sales": { status: "present", note: "" },
      "contract-purchase": { status: "present", note: "" },
      "contract-negotiation": { status: "partial", note: "邮件仅导出部分，待补齐关键洽谈阶段。" },
      "contract-counterparty-profile": { status: "missing", note: "" },
      "goods-shipping-docs": { status: "present", note: "" },
      "goods-customs": { status: "partial", note: "缺少两票货物的清关文件。" },
      "goods-warehouse": { status: "missing", note: "客户尚未提供境外仓库记录。" },
      "funds-bank-statements": { status: "present", note: "" },
      "funds-payment-records": { status: "present", note: "" },
      "funds-no-hk-processing": { status: "partial", note: "仅口头说明，未附账目支持。" },
      "operations-hk-staff": { status: "present", note: "" },
      "operations-overseas-staff": { status: "present", note: "" },
      "operations-travel": { status: "partial", note: "部分月份出入境记录缺失。" },
      "operations-meetings": { status: "na", note: "本个案以线上会议为主。" },
      "tax-financial-statements": { status: "present", note: "" },
      "tax-prior-returns": { status: "present", note: "" },
      "tax-income-reconciliation": { status: "missing", note: "" },
      "risk-related-party": { status: "missing", note: "" },
      "risk-transfer-pricing": { status: "na", note: "本个案无关联交易。" },
      "risk-consistency-memo": { status: "missing", note: "" }
    }
  };

  return {
    META: META,
    SCENARIOS: SCENARIOS,
    CATEGORIES: CATEGORIES,
    ITEMS: ITEMS,
    SAMPLE_CASE: SAMPLE_CASE
  };
});
