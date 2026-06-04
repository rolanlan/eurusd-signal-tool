/**
 * ONETO EUR/USD AI Tool — i18n Module
 * =====================================
 * Runtime internationalization layer.
 * EN = source of truth. ZH = display layer.
 * Dispatches 'languagechange' event on window — no page reload needed.
 *
 * HOTFIX (Phase 5B): Removed JSON import assertions (`assert { type: 'json' }`)
 * which were deprecated in Chrome 123 and removed in Chrome 126+.
 * Locale data is now inlined as JS objects. The canonical .json files
 * (en.json, zh.json) are unchanged and remain the source of truth for editing —
 * any edits must be mirrored here manually until a build step is added.
 *
 * Interface Contract 9 compliant.
 * Architecture Freeze V4.0-R1 | Phase 5B-Hotfix
 */

'use strict';

// ─────────────────────────────────────────────
// LOCALE DATA (inlined — source of truth: en.json / zh.json)
// ─────────────────────────────────────────────

const EN = {
  "nav": {
    "dashboard":  "Dashboard",
    "committee":  "AI Committee",
    "decision":   "Decision Engine",
    "risk":       "Risk Manager",
    "kline":      "K-Line Chart",
    "news":       "News Impact",
    "calendar":   "Economic Calendar",
    "backtest":   "Backtest",
    "paper":      "Paper Trading",
    "learning":   "Learning Engine",
    "api":        "API Report",
    "settings":   "Settings",
    "signal":     "Signal",
    "analysis":   "Analysis",
    "trading":    "Trading",
    "config":     "Config"
  },
  "signal": {
    "sell":        "SELL",
    "buy":         "BUY",
    "neutral":     "NEUTRAL",
    "noTrade":     "NO TRADE",
    "direction":   "Direction",
    "confidence":  "Confidence",
    "entry":       "Entry Price",
    "sl":          "Stop Loss",
    "tp1":         "Take Profit 1",
    "tp2":         "Take Profit 2",
    "rr":          "Risk / Reward",
    "pips":        "pips",
    "generated":   "Signal Generated",
    "strength": {
      "STRONG_BUY":  "Strong Buy",
      "BUY":         "Buy",
      "WEAK_BUY":    "Weak Buy",
      "NEUTRAL":     "Neutral",
      "WEAK_SELL":   "Weak Sell",
      "SELL":        "Sell",
      "STRONG_SELL": "Strong Sell",
      "NO_TRADE":    "No Trade"
    }
  },
  "risk": {
    "title":          "Risk Manager",
    "balance":        "Account Balance",
    "profile":        "Risk Profile",
    "conservative":   "Conservative",
    "standard":       "Standard",
    "aggressive":     "Aggressive",
    "lot":            "Position Size",
    "lotUnit":        "lot",
    "maxLoss":        "Max Loss",
    "expectedProfit": "Expected Profit",
    "rrRatio":        "R/R Ratio",
    "effectiveRisk":  "Effective Risk",
    "slPips":         "SL Distance",
    "dailyUsed":      "Daily Risk Used",
    "weeklyUsed":     "Weekly Risk Used",
    "drawdown":       "Current Drawdown",
    "consecLoss":     "Consecutive Losses",
    "level": {
      "LOW":      "LOW RISK · Proceed",
      "STANDARD": "STANDARD RISK · Proceed",
      "ELEVATED": "ELEVATED RISK · Caution",
      "HIGH":     "HIGH RISK · Warning"
    },
    "halt":          "SYSTEM HALTED",
    "haltReason":    "Drawdown limit reached. Trading suspended.",
    "warning":       "Drawdown Warning",
    "warningDetail": "consecutive losses — position size reduced"
  },
  "agents": {
    "title":    "AI Committee",
    "verdict":  "Committee Verdict",
    "votes":    "votes",
    "agreeing": "agents agreeing",
    "technical":   { "name": "Technical Analyst",   "role": "MA · RSI · MACD · BB · ADX" },
    "macro":       { "name": "Macro Analyst",        "role": "FED · ECB · GDP · CPI · Rate Diff" },
    "positioning": { "name": "Positioning Analyst",  "role": "COT · DXY · US10Y · Spread" },
    "news":        { "name": "News Analyst",         "role": "Reuters · Bloomberg · ForexFactory" },
    "risk":        { "name": "Risk Analyst",         "role": "ATR · Volatility · Events · VIX" },
    "score":      "Score",
    "weight":     "Weight",
    "confidence": "Confidence",
    "reason":     "Reason"
  },
  "regime": {
    "title":         "Market Regime",
    "trending_bull": "Trending Bull",
    "trending_bear": "Trending Bear",
    "ranging":       "Ranging",
    "volatile":      "Volatile",
    "breakout_up":   "Breakout Up",
    "breakout_down": "Breakout Down",
    "unknown":       "Unknown"
  },
  "decision": {
    "title":       "Decision Engine",
    "pipeline":    "Decision Pipeline",
    "finalScore":  "Final Score",
    "gateResults": "Gate Results",
    "passed":      "PASSED",
    "failed":      "FAILED",
    "gates": {
      "mtf":            "MTF Alignment",
      "confidence":     "Min Confidence",
      "rr":             "Min R/R Ratio",
      "agentAgreement": "Agent Agreement",
      "drawdown":       "Drawdown Check",
      "regime":         "Regime Filter"
    },
    "explanation":   "Why This Signal",
    "noTradeReason": "No Trade Reason"
  },
  "mtf": {
    "title":             "Multi-Timeframe Alignment",
    "score":             "MTF Score",
    "bias1d":            "1D Bias",
    "bias4h":            "4H Bias",
    "bias1h":            "1H Bias",
    "fully_aligned":     "3TF CONFIRMED",
    "partially_aligned": "2TF CONFIRMED",
    "primary_only":      "COUNTER-TREND",
    "not_aligned":       "NOT ALIGNED — Signal Suppressed",
    "confAdj":           "Confidence Adj"
  },
  "paper": {
    "title":         "Paper Trading",
    "submit":        "Submit Trade",
    "close":         "Close",
    "closeAll":      "Close All",
    "openTrades":    "Open Trades",
    "tradeHistory":  "Trade History",
    "stats":         "Performance Stats",
    "winRate":       "Win Rate",
    "profitFactor":  "Profit Factor",
    "totalPnl":      "Total P&L",
    "totalPnlR":     "Total P&L (R)",
    "avgWin":        "Avg Win",
    "avgLoss":       "Avg Loss",
    "maxConsecLoss": "Max Consec. Loss",
    "validation":    "Validation Progress",
    "phase":         "Phase",
    "trades":        "trades",
    "goLive":        "Go-Live Eligible",
    "notEligible":   "Not Yet Eligible",
    "outcome": {
      "win": "WIN", "loss": "LOSS", "breakeven": "BREAKEVEN", "open": "OPEN"
    },
    "exitReason": {
      "tp1": "TP1 Hit", "tp2": "TP2 Hit", "sl": "SL Hit",
      "manual": "Manual Close", "timeout": "Timeout"
    }
  },
  "settings": {
    "title":         "Settings",
    "apiKey":        "Twelve Data API Key",
    "apiKeyHint":    "Get your free key at twelvedata.com",
    "connect":       "Connect",
    "disconnect":    "Disconnect",
    "connected":     "Connected",
    "notConnected":  "Not Connected",
    "account":       "Account Settings",
    "balance":       "Starting Balance (USD)",
    "riskProfile":   "Risk Profile",
    "maxDrawdown":   "Max Drawdown Limit",
    "maxConsecLoss": "Max Consecutive Losses",
    "minConf":       "Min Signal Confidence",
    "minRR":         "Min R/R Ratio",
    "language":      "Language",
    "timezone":      "Timezone",
    "decisionParams": "Decision Engine Parameters",
    "save":          "Save Settings",
    "saved":         "Saved",
    "reset":         "Reset to Defaults"
  },
  "calendar": {
    "title":    "Economic Calendar",
    "upcoming": "Upcoming Events",
    "previous": "Previous Value",
    "forecast": "Forecast",
    "actual":   "Actual",
    "impact":   { "high": "HIGH", "medium": "MEDIUM", "low": "LOW" },
    "surprise": { "better": "Better", "worse": "Worse", "inline": "In Line" }
  },
  "news": {
    "title":      "News Impact",
    "sentiment":  "Sentiment",
    "usdBullish": "USD Bullish",
    "eurBullish": "EUR Bullish",
    "neutral":    "Neutral",
    "impact":     "Impact",
    "window24h":  "24H",
    "window7d":   "7D",
    "window30d":  "30D",
    "noData":     "No recent news data"
  },
  "errors": {
    "noApiKey":         "Configure your API Key in Settings to get live data",
    "apiFailed":        "API connection failed — using fallback data",
    "apiDegraded":      "API degraded — some data may be stale",
    "invalidSl":        "Invalid stop loss distance",
    "drawdownHalt":     "System halted — drawdown limit reached",
    "insufficientData": "Insufficient data for analysis",
    "agentError":       "Agent error — neutral fallback applied",
    "signalError":      "Signal generation failed",
    "tradeNotFound":    "Trade not found",
    "alreadyClosed":    "Trade already closed"
  },
  "common": {
    "loading":    "Loading...",
    "save":       "Save",
    "cancel":     "Cancel",
    "apply":      "Apply",
    "approve":    "Approve",
    "reject":     "Reject",
    "refresh":    "Refresh",
    "connect":    "Connect",
    "disconnect": "Disconnect",
    "live":       "LIVE",
    "simulated":  "SIMULATED",
    "cached":     "CACHED",
    "stale":      "STALE DATA",
    "yes":        "Yes",
    "no":         "No",
    "confirm":    "Confirm",
    "close":      "Close",
    "open":       "Open",
    "details":    "Details",
    "history":    "History",
    "updated":    "Updated",
    "source":     "Source",
    "version":    "Version",
    "phase":      "Phase"
  }
};

const ZH = {
  "nav": {
    "dashboard":  "仪表盘",
    "committee":  "AI委员会",
    "decision":   "决策引擎",
    "risk":       "风险管理",
    "kline":      "K线图表",
    "news":       "新闻影响",
    "calendar":   "经济日历",
    "backtest":   "历史回测",
    "paper":      "模拟交易",
    "learning":   "学习引擎",
    "api":        "API报告",
    "settings":   "系统设置",
    "signal":     "信号",
    "analysis":   "分析",
    "trading":    "交易",
    "config":     "配置"
  },
  "signal": {
    "sell":        "做空",
    "buy":         "做多",
    "neutral":     "中性",
    "noTrade":     "不操作",
    "direction":   "方向",
    "confidence":  "置信度",
    "entry":       "入场价",
    "sl":          "止损",
    "tp1":         "止盈1",
    "tp2":         "止盈2",
    "rr":          "盈亏比",
    "pips":        "点",
    "generated":   "信号已生成",
    "strength": {
      "STRONG_BUY":  "强烈做多",
      "BUY":         "做多",
      "WEAK_BUY":    "轻仓做多",
      "NEUTRAL":     "中性观望",
      "WEAK_SELL":   "轻仓做空",
      "SELL":        "做空",
      "STRONG_SELL": "强烈做空",
      "NO_TRADE":    "不操作"
    }
  },
  "risk": {
    "title":          "风险管理器",
    "balance":        "账户余额",
    "profile":        "风险档位",
    "conservative":   "保守型",
    "standard":       "标准型",
    "aggressive":     "激进型",
    "lot":            "建议仓位",
    "lotUnit":        "手",
    "maxLoss":        "最大亏损",
    "expectedProfit": "预期盈利",
    "rrRatio":        "盈亏比",
    "effectiveRisk":  "实际风险",
    "slPips":         "止损距离",
    "dailyUsed":      "今日已用风险",
    "weeklyUsed":     "本周已用风险",
    "drawdown":       "当前回撤",
    "consecLoss":     "连续亏损",
    "level": {
      "LOW":      "低风险 · 建议执行",
      "STANDARD": "标准风险 · 可执行",
      "ELEVATED": "偏高风险 · 谨慎操作",
      "HIGH":     "高风险 · 警告"
    },
    "halt":          "系统已暂停",
    "haltReason":    "已达到最大回撤限制，交易暂停。",
    "warning":       "回撤预警",
    "warningDetail": "次连续亏损 — 仓位已自动降低"
  },
  "agents": {
    "title":    "AI委员会",
    "verdict":  "委员会裁定",
    "votes":    "票",
    "agreeing": "位代理赞同",
    "technical":   { "name": "技术分析师",  "role": "均线 · RSI · MACD · 布林带 · ADX" },
    "macro":       { "name": "宏观分析师",  "role": "美联储 · 欧央行 · GDP · CPI · 利差" },
    "positioning": { "name": "持仓分析师",  "role": "COT持仓 · 美元指数 · 美债收益率" },
    "news":        { "name": "新闻分析师",  "role": "路透社 · 彭博 · 外汇工厂" },
    "risk":        { "name": "风险分析师",  "role": "ATR波动率 · 事件风险 · VIX" },
    "score":      "评分",
    "weight":     "权重",
    "confidence": "置信度",
    "reason":     "理由"
  },
  "regime": {
    "title":         "市场状态",
    "trending_bull": "上升趋势",
    "trending_bear": "下降趋势",
    "ranging":       "震荡区间",
    "volatile":      "高度波动",
    "breakout_up":   "向上突破",
    "breakout_down": "向下突破",
    "unknown":       "未知状态"
  },
  "decision": {
    "title":       "决策引擎",
    "pipeline":    "决策流程",
    "finalScore":  "综合评分",
    "gateResults": "门控结果",
    "passed":      "通过",
    "failed":      "未通过",
    "gates": {
      "mtf":            "多周期对齐",
      "confidence":     "最低置信度",
      "rr":             "最低盈亏比",
      "agentAgreement": "代理一致性",
      "drawdown":       "回撤检查",
      "regime":         "状态过滤"
    },
    "explanation":   "为何产生此信号",
    "noTradeReason": "不操作原因"
  },
  "mtf": {
    "title":             "多周期对齐",
    "score":             "MTF综合分",
    "bias1d":            "日线偏向",
    "bias4h":            "4小时偏向",
    "bias1h":            "1小时偏向",
    "fully_aligned":     "三周期完全对齐",
    "partially_aligned": "双周期对齐",
    "primary_only":      "逆势信号 ⚠️",
    "not_aligned":       "周期冲突 — 信号已屏蔽",
    "confAdj":           "置信度调整"
  },
  "paper": {
    "title":         "模拟交易",
    "submit":        "提交交易",
    "close":         "平仓",
    "closeAll":      "全部平仓",
    "openTrades":    "持仓中",
    "tradeHistory":  "交易记录",
    "stats":         "绩效统计",
    "winRate":       "胜率",
    "profitFactor":  "盈利因子",
    "totalPnl":      "总盈亏",
    "totalPnlR":     "总盈亏(R)",
    "avgWin":        "平均盈利",
    "avgLoss":       "平均亏损",
    "maxConsecLoss": "最大连续亏损",
    "validation":    "验证进度",
    "phase":         "阶段",
    "trades":        "笔",
    "goLive":        "可进入实盘",
    "notEligible":   "尚未达标",
    "outcome": {
      "win": "盈利", "loss": "亏损", "breakeven": "保本", "open": "持仓中"
    },
    "exitReason": {
      "tp1": "止盈1触发", "tp2": "止盈2触发", "sl": "止损触发",
      "manual": "手动平仓", "timeout": "超时平仓"
    }
  },
  "settings": {
    "title":         "系统设置",
    "apiKey":        "Twelve Data API Key",
    "apiKeyHint":    "在 twelvedata.com 免费获取",
    "connect":       "连接",
    "disconnect":    "断开",
    "connected":     "已连接",
    "notConnected":  "未连接",
    "account":       "账户设置",
    "balance":       "初始资金（美元）",
    "riskProfile":   "风险档位",
    "maxDrawdown":   "最大回撤限制",
    "maxConsecLoss": "最大连续亏损次数",
    "minConf":       "最低信号置信度",
    "minRR":         "最低盈亏比",
    "language":      "语言",
    "timezone":      "时区",
    "decisionParams": "决策引擎参数",
    "save":          "保存设置",
    "saved":         "已保存",
    "reset":         "恢复默认"
  },
  "calendar": {
    "title":    "经济日历",
    "upcoming": "即将公布",
    "previous": "前值",
    "forecast": "预期",
    "actual":   "实际",
    "impact":   { "high": "高影响", "medium": "中影响", "low": "低影响" },
    "surprise": { "better": "好于预期", "worse": "差于预期", "inline": "符合预期" }
  },
  "news": {
    "title":      "新闻情绪",
    "sentiment":  "情绪",
    "usdBullish": "美元看涨",
    "eurBullish": "欧元看涨",
    "neutral":    "中性",
    "impact":     "影响",
    "window24h":  "24小时",
    "window7d":   "7天",
    "window30d":  "30天",
    "noData":     "暂无最新新闻数据"
  },
  "errors": {
    "noApiKey":         "请在设置中配置 API Key 以获取实时数据",
    "apiFailed":        "API连接失败 — 使用备用数据",
    "apiDegraded":      "API降级 — 部分数据可能已过期",
    "invalidSl":        "止损距离无效",
    "drawdownHalt":     "系统已暂停 — 已达回撤限制",
    "insufficientData": "数据不足，无法分析",
    "agentError":       "代理异常 — 已使用中性兜底",
    "signalError":      "信号生成失败",
    "tradeNotFound":    "未找到该交易",
    "alreadyClosed":    "该交易已平仓"
  },
  "common": {
    "loading":    "加载中...",
    "save":       "保存",
    "cancel":     "取消",
    "apply":      "应用",
    "approve":    "批准",
    "reject":     "拒绝",
    "refresh":    "刷新",
    "connect":    "连接",
    "disconnect": "断开",
    "live":       "实时",
    "simulated":  "模拟",
    "cached":     "缓存",
    "stale":      "数据过期",
    "yes":        "是",
    "no":         "否",
    "confirm":    "确认",
    "close":      "关闭",
    "open":       "打开",
    "details":    "详情",
    "history":    "历史",
    "updated":    "已更新",
    "source":     "数据源",
    "version":    "版本",
    "phase":      "阶段"
  }
};

// ─────────────────────────────────────────────
// RUNTIME CONFIG
// ─────────────────────────────────────────────

const SUPPORTED    = ['en', 'zh'];
const STORAGE_KEY  = 'language';
const DEFAULT_LANG = 'zh';

const LOCALES = { en: EN, zh: ZH };

// Current language (read from localStorage on init)
let _lang = _readLang();

// ─────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Returns the localized string for a dot-notation key.
 * Falls back: ZH key → EN key → key itself.
 * Supports {{param}} interpolation.
 *
 * @param {string} key       - e.g. 'signal.sell', 'risk.level.LOW'
 * @param {object} [params]  - e.g. { n: 0.04, pct: '2%' }
 * @returns {string}
 */
export function t(key, params) {
  const str = _resolve(_lang, key) ?? _resolve('en', key) ?? key;
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{{${k}}}`
  );
}

/**
 * Sets the active language and dispatches 'languagechange' event.
 * @param {'en'|'zh'} lang
 */
export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  _lang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  } catch (_) {}
}

/**
 * Returns the current language code.
 * @returns {'en'|'zh'}
 */
export function getLang() {
  return _lang;
}

/**
 * Returns true if current language is Chinese.
 * @returns {boolean}
 */
export function isZH() {
  return _lang === 'zh';
}

// ─────────────────────────────────────────────
// NUMBER / DATE FORMATTERS
// ─────────────────────────────────────────────

/**
 * Formats a EUR/USD price to 5 decimal places.
 * @param {number} n
 * @returns {string}
 */
export function formatPrice(n) {
  if (isNaN(n) || n === 0) return '—';
  return parseFloat(n).toFixed(5);
}

/**
 * Formats pips with locale-aware unit suffix.
 * @param {number} n
 * @returns {string}  e.g. "50点" (ZH) or "50 pips" (EN)
 */
export function formatPips(n) {
  if (isNaN(n)) return '—';
  const unit = _lang === 'zh' ? '点' : ' pips';
  return `${Math.round(n)}${unit}`;
}

/**
 * Formats a 0–1 ratio as a percentage string.
 * @param {number} n  - 0–1 scale
 * @returns {string}  e.g. "2.0%"
 */
export function formatPct(n) {
  if (isNaN(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Formats a lot size.
 * @param {number} n
 * @returns {string}  e.g. "0.04手" (ZH) or "0.04 lot" (EN)
 */
export function formatLot(n) {
  if (isNaN(n) || n === 0) return '—';
  const unit = _lang === 'zh' ? '手' : ' lot';
  return `${parseFloat(n).toFixed(2)}${unit}`;
}

/**
 * Formats a USD amount.
 * @param {number} n
 * @returns {string}  e.g. "$20.00"
 */
export function formatUSD(n) {
  if (isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

/**
 * Formats a UNIX ms timestamp as a short datetime string.
 * @param {number} ts  - UNIX ms
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (_lang === 'zh') {
    return `${d.getMonth() + 1}月${d.getDate()}日 ${_pad(d.getHours())}:${_pad(d.getMinutes())}`;
  }
  return d.toLocaleString('en-GB', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Formats a duration in minutes.
 * @param {number} minutes
 * @returns {string}  e.g. "2h 30m" or "2小时30分"
 */
export function formatDuration(minutes) {
  if (isNaN(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (_lang === 'zh') {
    return h > 0 ? `${h}小时${m}分` : `${m}分钟`;
  }
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Formats a confidence value (0–100) as a string.
 * @param {number} n
 * @returns {string}  e.g. "72%"
 */
export function formatConf(n) {
  if (isNaN(n)) return '—';
  return `${Math.round(n)}%`;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Resolves a dot-notation key against a locale object.
 * Returns undefined if key not found.
 *
 * @param {'en'|'zh'} lang
 * @param {string} key
 * @returns {string|undefined}
 */
function _resolve(lang, key) {
  const locale = LOCALES[lang];
  if (!locale) return undefined;
  const parts = key.split('.');
  let node = locale;
  for (const part of parts) {
    if (node === null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function _readLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(stored)) return stored;
  } catch (_) {}
  return DEFAULT_LANG;
}

function _pad(n) {
  return String(n).padStart(2, '0');
}
