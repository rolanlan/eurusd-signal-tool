/**
 * ONETO EUR/USD AI Tool — TradeSetupPanel
 * ==========================================
 * V5.2 — Dedicated Trade Setup page.
 * Displays the full trade specification of the most recent signal.
 *
 * Shows all fields required by FREEZE-RULE-015:
 *   Direction, Entry, SL, TP1, TP2, Lot, Risk%, MaxLoss, ExpectedProfit,
 *   R/R, Confidence, Signal Strength, Market Regime, Agents Agreeing,
 *   all 6 Gate statuses, Data Sources (FRED/Finnhub/DXY/COT).
 *
 * For actionable signals: shows trade plan + Submit Paper Trade button.
 * For NO_TRADE signals:   shows reason + gate failures + data source quality.
 *
 * The Submit button calls PaperExecution.submitTrade() directly.
 * On success shows Trade ID + Entry + SL + TP2 confirmation.
 * Does NOT navigate away from this page.
 *
 * Data sources:
 *   AppState.getLastSignal()   — all 36 signal fields
 *   AppState.getLastVotes()    — agent votes
 *   AccountState.get()         — account profile for submission
 *   PaperExecution.submitTrade()
 *
 * Events listened:
 *   AppState 'signalGenerated'  — re-render on new signal
 *   window  'languagechange'    — re-render with new locale
 *
 * Architecture Freeze V4.0-R1 | V5.2 Phase 3
 */

'use strict';

import * as AppState       from '../state/AppState.js';
import * as AccountState   from '../state/AccountState.js';
import * as PaperExecution from '../core/PaperExecution.js';
import { t, getLang, formatPrice, formatPips, formatPct, formatLot, formatUSD } from '../i18n/i18n.js';
import { isActionable, SIGNAL_DIRECTION, SIGNAL_STRENGTH } from '../types/Signal.js';
import { AGENT } from '../types/Vote.js';

// ─────────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────────

let _container    = null;
let _mounted      = false;
let _lastSubmitted = null;   // stores last submitted trade record for confirmation

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export function mount(container) {
  if (!container || _mounted) return;
  _mounted   = true;
  _container = container;

  render();
  AppState.subscribe('signalGenerated', () => { _lastSubmitted = null; render(); });
  window.addEventListener('languagechange', () => render());
}

export function render() {
  if (!_container) return;
  try {
    _container.innerHTML = _buildHTML();
    _attachEvents();
  } catch (err) {
    console.error('[TradeSetupPanel] Render error:', err.message);
  }
}

// ─────────────────────────────────────────────
// HTML BUILDER
// ─────────────────────────────────────────────

function _buildHTML() {
  const signal = AppState.getLastSignal();
  const votes  = AppState.getLastVotes();
  const lang   = getLang();

  const styles = `
    <style>
      .tsp-wrap       { max-width:780px; margin:0 auto; padding:var(--gap-xl); }
      .tsp-title      { font-size:1.1rem; font-weight:700; color:var(--text1); margin-bottom:var(--gap-lg); letter-spacing:0.02em; }
      .tsp-card       { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:var(--gap-lg); margin-bottom:var(--gap-md); }
      .tsp-section-label { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.10em; color:var(--text4); margin-bottom:var(--gap-sm); }
      .tsp-row        { display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid var(--border); }
      .tsp-row:last-child { border-bottom:none; }
      .tsp-label      { font-size:0.78rem; color:var(--text3); }
      .tsp-value      { font-size:0.84rem; font-weight:600; font-family:var(--font-num,monospace); color:var(--text1); }
      .tsp-grid       { display:grid; grid-template-columns:1fr 1fr; gap:var(--gap-sm) var(--gap-xl); }
      .tsp-gate-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:var(--gap-sm); }
      .tsp-gate       { display:flex; align-items:center; gap:4px; font-size:0.74rem; }
      .tsp-gate.pass  { color:var(--green); }
      .tsp-gate.fail  { color:var(--red); }
      .tsp-dir-badge  { display:inline-block; padding:4px 14px; border-radius:var(--radius-md); font-weight:700; font-size:0.85rem; letter-spacing:0.05em; }
      .tsp-dir-sell   { background:var(--red-bg); color:var(--red); border:1px solid var(--red); }
      .tsp-dir-buy    { background:var(--green-bg); color:var(--green); border:1px solid var(--green); }
      .tsp-dir-neutral{ background:var(--bg3); color:var(--text3); border:1px solid var(--border2); }
      .tsp-strength   { font-size:0.72rem; font-weight:600; color:var(--brand); text-transform:uppercase; }
      .tsp-btn        { width:100%; padding:11px; background:var(--brand); color:#fff; border:none; border-radius:var(--radius-md);
                        font-size:0.9rem; font-weight:700; cursor:pointer; margin-top:var(--gap-md); letter-spacing:0.03em; }
      .tsp-btn:hover  { background:var(--brand-dim); }
      .tsp-btn:disabled { opacity:0.5; cursor:not-allowed; }
      .tsp-confirm    { background:var(--green-bg); border:1px solid var(--green); border-radius:var(--radius-md);
                        padding:var(--gap-md); margin-top:var(--gap-md); }
      .tsp-confirm-title { font-size:0.78rem; font-weight:700; color:var(--green); margin-bottom:var(--gap-sm); }
      .tsp-src-badge  { display:inline-block; padding:2px 8px; border-radius:999px; font-size:0.68rem; font-weight:700;
                        border:1px solid; margin-right:4px; }
      .tsp-src-live   { color:var(--green); background:var(--green-bg); border-color:var(--green); }
      .tsp-src-cached { color:var(--amber-dim); background:var(--amber-bg); border-color:var(--amber); }
      .tsp-src-derived{ color:var(--blue-dim); background:#eff6ff; border-color:var(--blue); }
      .tsp-src-stub   { color:var(--text4); background:var(--bg3); border-color:var(--border2); }
      .tsp-no-trade   { text-align:center; padding:var(--gap-xl); }
      .tsp-no-trade-title  { font-size:1.4rem; font-weight:700; color:var(--amber-dim); margin-bottom:var(--gap-sm); }
      .tsp-no-trade-reason { font-size:0.84rem; color:var(--text3); margin-bottom:var(--gap-lg); }
      .tsp-conf-bar   { height:4px; background:var(--border); border-radius:2px; overflow:hidden; margin-top:3px; }
      .tsp-conf-fill  { height:100%; border-radius:2px; }
    </style>
  `;

  if (!signal) {
    return styles + `
      <div class="tsp-wrap">
        <div class="tsp-title">${t('trade.title')}</div>
        <div class="tsp-card tsp-no-trade">
          <div class="tsp-no-trade-title">—</div>
          <div class="tsp-no-trade-reason">${t('trade.noSignal')}</div>
        </div>
      </div>`;
  }

  return styles + `
    <div class="tsp-wrap">
      <div class="tsp-title">${t('trade.title')}</div>
      ${isActionable(signal) ? _buildActionable(signal, votes, lang) : _buildNoTrade(signal, lang)}
    </div>`;
}

// ── Actionable signal ────────────────────────

function _buildActionable(signal, votes, lang) {
  const isSell = signal.direction === SIGNAL_DIRECTION.SELL;
  const dirCls = isSell ? 'tsp-dir-sell' : 'tsp-dir-buy';
  const dirLbl = isSell ? t('signal.sell') : t('signal.buy');

  const conf = signal.final_confidence ?? 0;
  const confColor = conf >= 75 ? 'var(--green)' : conf >= 55 ? 'var(--amber)' : 'var(--red)';

  const confirm = _lastSubmitted ? _buildConfirmation(_lastSubmitted, lang) : '';

  return `
    <!-- Header -->
    <div class="tsp-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--gap-lg)">
        <div>
          <div style="margin-bottom:6px">
            <span class="tsp-dir-badge ${dirCls}">${dirLbl}</span>
            <span class="tsp-strength" style="margin-left:10px">${signal.signal_strength ?? ''}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text3)">
            ${lang==='zh'?'市场状态':'Regime'}: <b style="color:var(--text2)">${t('regime.' + (signal.market_regime ?? 'unknown'))}</b>
            &nbsp;·&nbsp;
            ${lang==='zh'?'代理一致':'Agents'}: <b style="color:var(--text2)">${signal.agents_agreeing ?? 0}/5</b>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.7rem;color:var(--text4);margin-bottom:2px">${t('signal.confidence')}</div>
          <div style="font-size:1.4rem;font-weight:700;color:${confColor};font-family:var(--font-num,monospace)">${conf}%</div>
          <div class="tsp-conf-bar" style="width:80px;margin-left:auto">
            <div class="tsp-conf-fill" style="width:${conf}%;background:${confColor}"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Levels -->
    <div class="tsp-card">
      <div class="tsp-section-label">${lang==='zh'?'价格设置':'Price Levels'}</div>
      <div class="tsp-grid">
        ${_row(t('signal.entry'),  formatPrice(signal.entry_price), '')}
        ${_row(t('signal.rr'),     `1 : ${(signal.rr_ratio ?? 0).toFixed(2)}`, '')}
        ${_row(t('signal.sl'),     `${formatPrice(signal.stop_loss)} (${formatPips(signal.sl_pips)})`, 'color:var(--red)')}
        ${_row(t('signal.tp1'),    `${formatPrice(signal.take_profit_1)} (${formatPips(signal.tp1_pips)})`, 'color:var(--green)')}
        ${_row('&nbsp;', '&nbsp;', '')}
        ${_row(t('signal.tp2'),    `${formatPrice(signal.take_profit_2)} (${formatPips(signal.tp2_pips)})`, 'color:var(--green)')}
      </div>
    </div>

    <!-- Position Sizing -->
    <div class="tsp-card">
      <div class="tsp-section-label">${lang==='zh'?'仓位风控':'Position & Risk'}</div>
      <div class="tsp-grid">
        ${_row(t('risk.lot'),            formatLot(signal.lot_size), '')}
        ${_row(t('risk.effectiveRisk'),  formatPct(signal.effective_risk_pct), '')}
        ${_row(t('risk.maxLoss'),        formatUSD(signal.max_loss_usd), 'color:var(--red)')}
        ${_row(t('risk.expectedProfit'), formatUSD(signal.expected_profit), 'color:var(--green)')}
      </div>
    </div>

    <!-- Gate Status (FREEZE-RULE-015) -->
    <div class="tsp-card">
      <div class="tsp-section-label">${t('trade.gates')}</div>
      <div class="tsp-gate-grid">
        ${_gate(signal.gates?.mtf_pass,             t('decision.gates.mtf'))}
        ${_gate(signal.gates?.confidence_pass,      t('decision.gates.confidence'))}
        ${_gate(signal.gates?.rr_pass,              t('decision.gates.rr'))}
        ${_gate(signal.gates?.agent_agreement_pass, t('decision.gates.agentAgreement'))}
        ${_gate(signal.gates?.drawdown_pass,        t('decision.gates.drawdown'))}
        ${_gate(signal.gates?.regime_pass,          t('decision.gates.regime'))}
      </div>
    </div>

    <!-- Data Sources -->
    <div class="tsp-card">
      <div class="tsp-section-label">${t('trade.dataSrc')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">
        ${_srcBadge('FRED',    signal.data_sources?.fred    ?? 'stub')}
        ${_srcBadge('Finnhub', signal.data_sources?.finnhub ?? 'stub')}
        ${_srcBadge('DXY',     signal.data_sources?.dxy     ?? 'stub')}
        ${_srcBadge('COT',     signal.data_sources?.cot     ?? 'stub')}
      </div>
    </div>

    <!-- Submit button -->
    <button class="tsp-btn" id="tsp-submit" ${_lastSubmitted ? 'disabled' : ''}>
      📝 ${t('trade.submitBtn')}
    </button>

    ${confirm}
  `;
}

// ── NO_TRADE ────────────────────────────────

function _buildNoTrade(signal, lang) {
  const reasonMap = {
    LOW_CONFIDENCE:          lang==='zh' ? '置信度不足'    : 'Low Confidence',
    MTF_NOT_ALIGNED:         lang==='zh' ? '多周期未对齐'  : 'MTF Not Aligned',
    RR_TOO_LOW:              lang==='zh' ? 'R/R过低'       : 'R/R Too Low',
    AGENT_DISAGREEMENT:      lang==='zh' ? '代理意见分歧'  : 'Agent Disagreement',
    DRAWDOWN_HALT:           lang==='zh' ? '触达回撤限制'  : 'Drawdown Limit',
    VOLATILE_REGIME_BLOCKED: lang==='zh' ? '高波动阻断'    : 'Volatile Market',
    NO_TRADE:                lang==='zh' ? '无交易信号'    : 'No Signal',
  };

  const reason = reasonMap[signal.no_trade_reason ?? 'NO_TRADE'] ?? (signal.no_trade_reason ?? '—');

  return `
    <!-- NO TRADE Header -->
    <div class="tsp-card">
      <div class="tsp-no-trade">
        <div class="tsp-no-trade-title">${lang==='zh' ? '暂缓交易' : 'NO TRADE'}</div>
        <div class="tsp-no-trade-reason">${t('trade.reason')}: ${reason}</div>
        <div style="font-size:0.75rem;color:var(--text4)">
          ${lang==='zh'?'方向分':'Dir Score'}: ${signal.final_score ?? 50}
          &nbsp;·&nbsp;
          ${lang==='zh'?'置信度':'Confidence'}: ${signal.final_confidence ?? 0}%
        </div>
      </div>
    </div>

    <!-- Gate Status -->
    <div class="tsp-card">
      <div class="tsp-section-label">${t('trade.gates')}</div>
      <div class="tsp-gate-grid">
        ${_gate(signal.gates?.mtf_pass,             t('decision.gates.mtf'))}
        ${_gate(signal.gates?.confidence_pass,      t('decision.gates.confidence'))}
        ${_gate(signal.gates?.rr_pass,              t('decision.gates.rr'))}
        ${_gate(signal.gates?.agent_agreement_pass, t('decision.gates.agentAgreement'))}
        ${_gate(signal.gates?.drawdown_pass,        t('decision.gates.drawdown'))}
        ${_gate(signal.gates?.regime_pass,          t('decision.gates.regime'))}
      </div>
    </div>

    <!-- Data Sources -->
    <div class="tsp-card">
      <div class="tsp-section-label">${t('trade.dataSrc')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px">
        ${_srcBadge('FRED',    signal.data_sources?.fred    ?? 'stub')}
        ${_srcBadge('Finnhub', signal.data_sources?.finnhub ?? 'stub')}
        ${_srcBadge('DXY',     signal.data_sources?.dxy     ?? 'stub')}
        ${_srcBadge('COT',     signal.data_sources?.cot     ?? 'stub')}
      </div>
    </div>
  `;
}

// ── Trade submission confirmation ────────────

function _buildConfirmation(trade, lang) {
  return `
    <div class="tsp-confirm">
      <div class="tsp-confirm-title">✅ ${t('trade.submitted')}</div>
      <div style="font-size:0.78rem;color:var(--text2);display:flex;flex-wrap:wrap;gap:var(--gap-md)">
        <span>${t('trade.tradeId')}: <b>${trade.id}</b></span>
        <span>${t('signal.entry')}: <b>${formatPrice(trade.entry_price)}</b></span>
        <span>${t('signal.sl')}: <b>${formatPrice(trade.stop_loss)}</b></span>
        <span>${t('signal.tp2')}: <b>${formatPrice(trade.take_profit_2)}</b></span>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// EVENT WIRING
// ─────────────────────────────────────────────

function _attachEvents() {
  const btn = _container?.querySelector('#tsp-submit');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const signal  = AppState.getLastSignal();
    const profile = AccountState.get();
    const votes   = AppState.getLastVotes();

    if (!signal || !isActionable(signal)) return;

    // Build compact agent_votes and agent_scores
    const agent_votes  = {};
    const agent_scores = {};
    if (Array.isArray(votes)) {
      for (const v of votes) {
        if (v?.agent) {
          agent_votes[v.agent]  = { vote: v.vote ?? 'NEUTRAL', score: v.score ?? 50 };
          agent_scores[v.agent] = v.score ?? 50;
        }
      }
    }

    const result = PaperExecution.submitTrade({
      direction:       signal.direction === SIGNAL_DIRECTION.SELL ? 'SELL' : 'BUY',
      entry_price:     signal.entry_price,
      stop_loss:       signal.stop_loss,
      take_profit_1:   signal.take_profit_1,
      take_profit_2:   signal.take_profit_2,
      lot_size:        signal.lot_size,
      account_balance: profile.account_balance ?? 1000,
      risk_pct:        signal.effective_risk_pct ?? 0.02,
      signal_id:       signal.id,
      market_regime:   signal.market_regime   ?? 'unknown',
      signal_strength: signal.signal_strength ?? 'UNKNOWN',
      final_score:     signal.final_score     ?? 50,
      final_confidence: signal.final_confidence ?? 0,
      agents_agreeing: signal.agents_agreeing ?? 0,
      agent_votes,
      agent_scores,
      data_sources:    signal.data_sources    ?? {},
    });

    if (result?.error) {
      console.error('[TradeSetupPanel] Submit error:', result.message);
    } else {
      _lastSubmitted = result;
      render();
    }
  });
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function _row(label, value, valueStyle) {
  return `
    <div class="tsp-row">
      <span class="tsp-label">${label}</span>
      <span class="tsp-value" ${valueStyle ? `style="${valueStyle}"` : ''}>${value}</span>
    </div>
  `;
}

function _gate(pass, label) {
  const cls = pass ? 'pass' : 'fail';
  const ico = pass ? '✅' : '❌';
  return `<div class="tsp-gate ${cls}">${ico} <span>${label}</span></div>`;
}

function _srcBadge(name, status) {
  const cls = status === 'live' ? 'tsp-src-live'
    : status === 'cached'  ? 'tsp-src-cached'
    : status === 'derived' ? 'tsp-src-derived'
    : 'tsp-src-stub';
  return `<span class="tsp-src-badge ${cls}">${name}: ${status.toUpperCase()}</span>`;
}
