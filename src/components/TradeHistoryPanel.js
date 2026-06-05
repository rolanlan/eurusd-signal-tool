/**
 * ONETO EUR/USD AI Tool — TradeHistoryPanel
 * ============================================
 * V5.2 — Trade History page.
 * Shows all closed paper trades with full signal context.
 *
 * Each row displays:
 *   Time, Direction, Entry, Exit, PnL(USD), PnL(R), Duration, Result,
 *   Market Regime, Signal Strength, Confidence, Data Sources
 *
 * Each row can be expanded to show agent votes.
 *
 * Data sources:
 *   PaperExecution.getClosed()   — all closed trades
 *   PaperExecution.getOpen()     — open trade count
 *
 * Events listened:
 *   window 'paperTradeOpened'    — re-render
 *   window 'paperTradeClosed'    — re-render
 *   window 'languagechange'      — re-render with new locale
 *
 * Architecture Freeze V4.0-R1 | V5.2 Phase 3
 */

'use strict';

import * as PaperExecution from '../core/PaperExecution.js';
import { t, getLang, formatPrice, formatUSD, formatDate, formatDuration } from '../i18n/i18n.js';

// ─────────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────────

let _container  = null;
let _mounted    = false;
let _expanded   = new Set();   // set of trade IDs currently expanded

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export function mount(container) {
  if (!container || _mounted) return;
  _mounted   = true;
  _container = container;

  render();
  window.addEventListener('paperTradeOpened', () => render());
  window.addEventListener('paperTradeClosed', () => render());
  window.addEventListener('languagechange',   () => render());
}

export function render() {
  if (!_container) return;
  try {
    _container.innerHTML = _buildHTML();
    _attachEvents();
  } catch (err) {
    console.error('[TradeHistoryPanel] Render error:', err.message);
  }
}

// ─────────────────────────────────────────────
// HTML BUILDER
// ─────────────────────────────────────────────

function _buildHTML() {
  const closed = PaperExecution.getClosed();
  const open   = PaperExecution.getOpen();
  const lang   = getLang();

  const styles = `
    <style>
      .thp-wrap        { max-width:920px; margin:0 auto; padding:var(--gap-xl); }
      .thp-title       { font-size:1.1rem; font-weight:700; color:var(--text1); margin-bottom:4px; letter-spacing:0.02em; }
      .thp-subtitle    { font-size:0.78rem; color:var(--text4); margin-bottom:var(--gap-lg); }
      .thp-empty       { text-align:center; padding:var(--gap-2xl); color:var(--text4); font-size:0.9rem; }
      .thp-trade       { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);
                         margin-bottom:var(--gap-sm); overflow:hidden; }
      .thp-main        { display:grid; grid-template-columns:90px 52px 90px 90px 80px 60px 48px 70px;
                         gap:0 var(--gap-md); align-items:center; padding:10px var(--gap-md);
                         cursor:pointer; user-select:none; }
      .thp-main:hover  { background:var(--bg3); }
      .thp-col-label   { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text4);
                         padding:4px var(--gap-md); background:var(--bg3); border-bottom:1px solid var(--border);
                         display:grid; grid-template-columns:90px 52px 90px 90px 80px 60px 48px 70px;
                         gap:0 var(--gap-md); }
      .thp-val         { font-size:0.78rem; font-family:var(--font-num,monospace); color:var(--text2); font-weight:500; }
      .thp-val.small   { font-size:0.7rem; color:var(--text3); }
      .thp-win         { color:var(--green); font-weight:700; }
      .thp-loss        { color:var(--red);   font-weight:700; }
      .thp-open        { color:var(--amber-dim); font-weight:700; }
      .thp-dir-buy     { color:var(--green); font-weight:700; font-size:0.78rem; }
      .thp-dir-sell    { color:var(--red);   font-weight:700; font-size:0.78rem; }
      .thp-expand-btn  { font-size:0.68rem; color:var(--brand); cursor:pointer; text-align:right; }
      .thp-detail      { padding:var(--gap-md); background:var(--bg3); border-top:1px solid var(--border);
                         display:grid; grid-template-columns:1fr 1fr; gap:var(--gap-sm) var(--gap-xl); }
      .thp-detail-row  { display:flex; justify-content:space-between; font-size:0.74rem; }
      .thp-detail-label{ color:var(--text4); }
      .thp-detail-val  { color:var(--text2); font-weight:600; font-family:var(--font-num,monospace); }
      .thp-agents      { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
      .thp-agent-chip  { font-size:0.66rem; padding:2px 7px; border-radius:999px; font-weight:700; border:1px solid; }
      .thp-agent-sell  { color:var(--red);   background:var(--red-bg);   border-color:var(--red); }
      .thp-agent-buy   { color:var(--green); background:var(--green-bg); border-color:var(--green); }
      .thp-agent-neut  { color:var(--text3); background:var(--bg3);      border-color:var(--border2); }
      .thp-src-badge   { display:inline-block; padding:1px 6px; border-radius:999px; font-size:0.62rem; font-weight:700;
                         border:1px solid; margin-right:3px; }
      .thp-src-live    { color:var(--green);    background:var(--green-bg);  border-color:var(--green); }
      .thp-src-cached  { color:var(--amber-dim);background:var(--amber-bg);  border-color:var(--amber); }
      .thp-src-derived { color:var(--blue-dim); background:#eff6ff;          border-color:var(--blue); }
      .thp-src-stub    { color:var(--text4);    background:var(--bg3);       border-color:var(--border2); }
      .thp-open-badge  { display:inline-block; padding:3px 10px; border-radius:var(--radius-sm);
                         background:var(--amber-bg); color:var(--amber-dim); font-size:0.72rem;
                         font-weight:700; border:1px solid var(--amber); margin-left:var(--gap-sm); }
    </style>
  `;

  const header = `
    <div class="thp-title">
      ${t('history.title')}
      ${open.length ? `<span class="thp-open-badge">${open.length} ${lang==='zh'?'持仓中':'Open'}</span>` : ''}
    </div>
    <div class="thp-subtitle">${closed.length} ${lang==='zh'?'笔已关闭交易':'closed trades'}</div>
  `;

  if (!closed.length) {
    return styles + `
      <div class="thp-wrap">
        ${header}
        <div class="thp-empty">${t('history.empty')}</div>
      </div>`;
  }

  const colLabels = `
    <div class="thp-col-label">
      <span>${t('history.time')}</span>
      <span>${t('history.result')}</span>
      <span>${t('history.entry')}</span>
      <span>${t('history.exit')}</span>
      <span>${t('history.pnl')}</span>
      <span>R</span>
      <span>${t('history.conf')}</span>
      <span>${t('history.duration')}</span>
    </div>
  `;

  const rows = closed.map(trade => _buildTradeRow(trade, lang)).join('');

  return styles + `
    <div class="thp-wrap">
      ${header}
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
        ${colLabels}
        ${rows}
      </div>
    </div>`;
}

function _buildTradeRow(trade, lang) {
  const isWin  = trade.outcome === 'win';
  const isLoss = trade.outcome === 'loss';
  const pnlCls = isWin ? 'thp-win' : isLoss ? 'thp-loss' : 'thp-open';
  const dirCls = trade.direction === 'SELL' ? 'thp-dir-sell' : 'thp-dir-buy';

  const pnlUsd = trade.pnl_usd != null
    ? `<span class="${pnlCls}">${trade.pnl_usd >= 0 ? '+' : ''}${formatUSD(trade.pnl_usd)}</span>` : '—';
  const pnlR = trade.pnl_r != null
    ? `<span class="${pnlCls}">${trade.pnl_r >= 0 ? '+' : ''}${(trade.pnl_r).toFixed(2)}R</span>` : '—';

  const isExpanded = _expanded.has(trade.id);
  const detail     = isExpanded ? _buildTradeDetail(trade, lang) : '';

  return `
    <div class="thp-trade" data-id="${trade.id}">
      <div class="thp-main trade-row-click" data-id="${trade.id}">
        <span class="thp-val small">${formatDate(new Date(trade.opened_at).getTime())}</span>
        <span class="${dirCls}">${trade.direction}</span>
        <span class="thp-val">${formatPrice(trade.entry_price)}</span>
        <span class="thp-val">${trade.exit_price ? formatPrice(trade.exit_price) : '—'}</span>
        <span class="thp-val">${pnlUsd}</span>
        <span class="thp-val">${pnlR}</span>
        <span class="thp-val small">${trade.final_confidence ?? '—'}%</span>
        <span class="thp-val small">${trade.duration_minutes != null ? formatDuration(trade.duration_minutes) : '—'}</span>
      </div>
      ${detail}
    </div>
  `;
}

function _buildTradeDetail(trade, lang) {
  const agentVotes = trade.agent_votes ?? {};
  const agentOrder = ['technical', 'macro', 'positioning', 'news', 'risk'];
  const agentNames = {
    technical: lang==='zh'?'技术':'Tech',
    macro:     lang==='zh'?'宏观':'Macro',
    positioning: lang==='zh'?'持仓':'Pos',
    news:      lang==='zh'?'新闻':'News',
    risk:      lang==='zh'?'风险':'Risk',
  };

  const chips = agentOrder.map(a => {
    const v = agentVotes[a];
    if (!v) return '';
    const vt = v.vote?.toUpperCase() ?? 'NEUTRAL';
    const cls = vt === 'SELL' ? 'thp-agent-sell' : vt === 'BUY' ? 'thp-agent-buy' : 'thp-agent-neut';
    return `<span class="thp-agent-chip ${cls}">${agentNames[a]}: ${vt} ${v.score ?? 50}</span>`;
  }).join('');

  const ds = trade.data_sources ?? {};
  const srcBadges = ['fred','finnhub','dxy','cot'].map(k => {
    const st = ds[k] ?? 'stub';
    const cls = st==='live'?'thp-src-live':st==='cached'?'thp-src-cached':st==='derived'?'thp-src-derived':'thp-src-stub';
    return `<span class="thp-src-badge ${cls}">${k.toUpperCase()}: ${st.toUpperCase()}</span>`;
  }).join('');

  const exitReason = trade.exit_reason
    ? t('paper.exitReason.' + trade.exit_reason)
    : '—';

  return `
    <div class="thp-detail">
      <div>
        <div class="thp-detail-row">
          <span class="thp-detail-label">${t('history.strength')}</span>
          <span class="thp-detail-val">${trade.signal_strength ?? '—'}</span>
        </div>
        <div class="thp-detail-row">
          <span class="thp-detail-label">${t('history.regime')}</span>
          <span class="thp-detail-val">${t('regime.' + (trade.market_regime ?? 'unknown'))}</span>
        </div>
        <div class="thp-detail-row">
          <span class="thp-detail-label">${lang==='zh'?'平仓原因':'Exit Reason'}</span>
          <span class="thp-detail-val">${exitReason}</span>
        </div>
        <div class="thp-detail-row">
          <span class="thp-detail-label">${lang==='zh'?'开仓时间':'Opened'}</span>
          <span class="thp-detail-val">${formatDate(new Date(trade.opened_at).getTime())}</span>
        </div>
      </div>
      <div>
        <div class="thp-detail-row" style="margin-bottom:6px">
          <span class="thp-detail-label">${lang==='zh'?'代理投票':'Agent Votes'}</span>
        </div>
        <div class="thp-agents">${chips || (lang==='zh'?'—（提交前无信号上下文）':'— No signal context')}</div>
        <div style="margin-top:var(--gap-sm)">${srcBadges}</div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// EVENT WIRING
// ─────────────────────────────────────────────

function _attachEvents() {
  if (!_container) return;
  _container.querySelectorAll('.trade-row-click').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (_expanded.has(id)) {
        _expanded.delete(id);
      } else {
        _expanded.add(id);
      }
      render();
    });
  });
}
