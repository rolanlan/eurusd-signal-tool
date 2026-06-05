/**
 * ONETO EUR/USD AI Tool — PerformanceDashboard
 * ===============================================
 * V5.2 — Performance analytics page.
 *
 * Displays:
 *   Total Trades, Win Rate, Profit Factor, Total PnL (USD + R),
 *   Average Win (R), Average Loss (R), Expectancy (R),
 *   Max Drawdown (R), Max Consecutive Loss, Go-Live Eligibility,
 *   Validation Phase Progress.
 *
 * Expectancy and Max Drawdown are computed inline from trade records
 * without modifying PaperExecution.getStats().
 *
 * Data sources:
 *   PaperExecution.getStats()    — aggregate stats
 *   PaperExecution.getClosed()   — trade list for derived metrics
 *
 * Events listened:
 *   window 'paperTradeClosed'    — re-render
 *   window 'languagechange'      — re-render with new locale
 *
 * Architecture Freeze V4.0-R1 | V5.2 Phase 3
 */

'use strict';

import * as PaperExecution from '../core/PaperExecution.js';
import { t, getLang, formatUSD } from '../i18n/i18n.js';

// ─────────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────────

let _container = null;
let _mounted   = false;

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export function mount(container) {
  if (!container || _mounted) return;
  _mounted   = true;
  _container = container;

  render();
  window.addEventListener('paperTradeClosed', () => render());
  window.addEventListener('languagechange',   () => render());
}

export function render() {
  if (!_container) return;
  try {
    _container.innerHTML = _buildHTML();
  } catch (err) {
    console.error('[PerformanceDashboard] Render error:', err.message);
  }
}

// ─────────────────────────────────────────────
// COMPUTED METRICS
// ─────────────────────────────────────────────

function _computeExpectancy(stats) {
  if (stats.closed < 5) return null;
  const e = (stats.win_rate * (stats.avg_win_r ?? 0))
          + ((1 - stats.win_rate) * (stats.avg_loss_r ?? 0));
  return parseFloat(e.toFixed(3));
}

function _computeMaxDrawdownR(closedTrades) {
  if (!closedTrades.length) return 0;
  let peak = 0, cumR = 0, maxDD = 0;
  // trades are newest-first; reverse for chronological
  for (const t of [...closedTrades].reverse()) {
    cumR += t.pnl_r ?? 0;
    if (cumR > peak) peak = cumR;
    const dd = peak - cumR;
    if (dd > maxDD) maxDD = dd;
  }
  return parseFloat(maxDD.toFixed(2));
}

// ─────────────────────────────────────────────
// HTML BUILDER
// ─────────────────────────────────────────────

function _buildHTML() {
  const stats   = PaperExecution.getStats();
  const closed  = PaperExecution.getClosed();
  const lang    = getLang();

  const expectancy = _computeExpectancy(stats);
  const maxDD      = _computeMaxDrawdownR(closed);

  const styles = `
    <style>
      .pdash-wrap       { max-width:860px; margin:0 auto; padding:var(--gap-xl); }
      .pdash-title      { font-size:1.1rem; font-weight:700; color:var(--text1); margin-bottom:var(--gap-lg); letter-spacing:0.02em; }
      .pdash-grid       { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:var(--gap-md); margin-bottom:var(--gap-lg); }
      .pdash-card       { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);
                          padding:var(--gap-md); }
      .pdash-metric     { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
                          color:var(--text4); margin-bottom:4px; }
      .pdash-value      { font-size:1.5rem; font-weight:700; font-family:var(--font-num,monospace); line-height:1; }
      .pdash-sub        { font-size:0.7rem; color:var(--text4); margin-top:3px; }
      .pdash-pos        { color:var(--green); }
      .pdash-neg        { color:var(--red); }
      .pdash-amber      { color:var(--amber-dim); }
      .pdash-brand      { color:var(--brand); }
      .pdash-neutral    { color:var(--text2); }
      .pdash-empty      { text-align:center; padding:var(--gap-2xl); color:var(--text4); font-size:0.9rem; }
      .pdash-section    { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
                          color:var(--text4); margin-bottom:var(--gap-sm); margin-top:var(--gap-lg); }
      .pdash-validation { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg);
                          padding:var(--gap-lg); }
      .pdash-phase      { display:flex; align-items:center; gap:var(--gap-md); margin-bottom:10px; }
      .pdash-phase:last-child { margin-bottom:0; }
      .pdash-phase-label{ font-size:0.75rem; color:var(--text3); min-width:80px; }
      .pdash-bar-track  { flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
      .pdash-bar-fill   { height:100%; border-radius:3px; }
      .pdash-bar-done   { background:var(--green); }
      .pdash-bar-active { background:var(--brand); }
      .pdash-bar-pend   { background:var(--border2); width:0!important; }
      .pdash-phase-count{ font-size:0.72rem; font-family:var(--font-num,monospace); color:var(--text3); min-width:64px; text-align:right; }
      .pdash-go-live    { background:var(--green-bg); border:1px solid var(--green); border-radius:var(--radius-md);
                          padding:var(--gap-md); text-align:center; margin-top:var(--gap-md); }
      .pdash-go-live-text { font-size:0.84rem; font-weight:700; color:var(--green); }
      .pdash-not-yet    { background:var(--bg3); border:1px solid var(--border2); border-radius:var(--radius-md);
                          padding:var(--gap-md); text-align:center; margin-top:var(--gap-md); }
      .pdash-not-yet-text { font-size:0.78rem; color:var(--text3); }
    </style>
  `;

  if (stats.closed < 1) {
    return styles + `
      <div class="pdash-wrap">
        <div class="pdash-title">${t('perf.title')}</div>
        <div class="pdash-empty">${t('perf.noTrades')}</div>
        ${_buildValidation(stats, lang)}
      </div>`;
  }

  const wr       = stats.win_rate ?? 0;
  const wrColor  = wr >= 0.60 ? 'pdash-pos' : wr >= 0.50 ? 'pdash-amber' : 'pdash-neg';
  const pfColor  = (stats.profit_factor ?? 0) >= 1.5 ? 'pdash-pos' : (stats.profit_factor ?? 0) >= 1.0 ? 'pdash-amber' : 'pdash-neg';
  const pnlColor = (stats.total_pnl_usd ?? 0) >= 0 ? 'pdash-pos' : 'pdash-neg';
  const expColor = expectancy === null ? 'pdash-neutral' : expectancy >= 0 ? 'pdash-pos' : 'pdash-neg';
  const ddColor  = maxDD > 5 ? 'pdash-neg' : maxDD > 2 ? 'pdash-amber' : 'pdash-pos';

  const metrics = [
    { label: t('perf.totalTrades'),  value: stats.closed.toString(),            cls: 'pdash-brand', sub: `${t('paper.outcome.open')}: ${stats.open}` },
    { label: t('perf.winRate'),      value: `${(wr * 100).toFixed(1)}%`,         cls: wrColor,  sub: `${stats.wins}W / ${stats.losses}L` },
    { label: t('perf.profitFactor'), value: (stats.profit_factor ?? 0).toFixed(2), cls: pfColor, sub: '' },
    { label: t('perf.totalPnl'),     value: formatUSD(stats.total_pnl_usd ?? 0), cls: pnlColor, sub: `${stats.total_pnl_r >= 0 ? '+' : ''}${(stats.total_pnl_r ?? 0).toFixed(2)}R` },
    { label: t('perf.avgWin'),       value: `+${(stats.avg_win_r ?? 0).toFixed(2)}R`,  cls: 'pdash-pos', sub: '' },
    { label: t('perf.avgLoss'),      value: `${(stats.avg_loss_r ?? 0).toFixed(2)}R`,  cls: 'pdash-neg', sub: '' },
    { label: t('perf.expectancy'),   value: expectancy === null ? '—' : `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(3)}R`, cls: expColor, sub: lang==='zh'?'≥5笔后可用':'Requires ≥5 trades' },
    { label: t('perf.maxDrawdown'),  value: `-${maxDD.toFixed(2)}R`,             cls: ddColor, sub: '' },
    { label: t('perf.maxConsec'),    value: (stats.max_consec_loss ?? 0).toString(), cls: (stats.max_consec_loss ?? 0) >= 4 ? 'pdash-neg' : 'pdash-neutral', sub: '' },
  ];

  const cards = metrics.map(m => `
    <div class="pdash-card">
      <div class="pdash-metric">${m.label}</div>
      <div class="pdash-value ${m.cls}">${m.value}</div>
      ${m.sub ? `<div class="pdash-sub">${m.sub}</div>` : ''}
    </div>
  `).join('');

  return styles + `
    <div class="pdash-wrap">
      <div class="pdash-title">${t('perf.title')}</div>
      <div class="pdash-grid">${cards}</div>
      ${_buildValidation(stats, lang)}
    </div>`;
}

function _buildValidation(stats, lang) {
  const gates  = [100, 300, 500, 1000];
  const labels = [lang==='zh'?'阶段1':'Phase 1', lang==='zh'?'阶段2':'Phase 2',
                  lang==='zh'?'阶段3':'Phase 3', lang==='zh'?'阶段4':'Phase 4'];

  const bars = gates.map((gate, idx) => {
    const prev  = gates[idx - 1] ?? 0;
    const total = stats.closed ?? 0;
    const done  = total >= gate;
    const curr  = !done && total >= prev;
    const pct   = done ? 100 : curr ? Math.round(((total - prev) / (gate - prev)) * 100) : 0;
    const fillCls = done ? 'pdash-bar-done' : curr ? 'pdash-bar-active' : 'pdash-bar-pend';
    const countStr = done ? `${gate} ✅` : curr ? `${total}/${gate}` : `0/${gate}`;

    return `
      <div class="pdash-phase">
        <span class="pdash-phase-label">${labels[idx]}</span>
        <div class="pdash-bar-track">
          <div class="pdash-bar-fill ${fillCls}" style="width:${pct}%"></div>
        </div>
        <span class="pdash-phase-count">${countStr}</span>
      </div>`;
  }).join('');

  const eligibility = stats.go_live_eligible
    ? `<div class="pdash-go-live"><div class="pdash-go-live-text">🚀 ${t('perf.goLive')}</div></div>`
    : `<div class="pdash-not-yet"><div class="pdash-not-yet-text">${t('perf.notYet')}</div></div>`;

  return `
    <div class="pdash-section">${t('perf.validation')}</div>
    <div class="pdash-validation">
      ${bars}
      ${eligibility}
    </div>`;
}
