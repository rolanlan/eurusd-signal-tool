/**
 * ONETO EUR/USD AI Tool — RiskManagerPanel
 * ==========================================
 * Risk Manager page component.
 * Provides a live position sizing calculator and account
 * risk dashboard, wired to RiskManager.calc() and AccountState.
 *
 * Sections:
 *   1. Live calculator — account balance · SL pips · risk profile
 *      inputs recalculate in real time via RiskManager.calc()
 *   2. Result display  — lot size · max loss · expected profit ·
 *      R/R ratio · effective risk % · risk level badge
 *   3. Multiplier breakdown — 4 multipliers shown with values
 *   4. Account risk dashboard — daily used · weekly used ·
 *      current drawdown · consecutive losses · system halt warning
 *
 * Data sources:
 *   AccountState.get()          — account profile
 *   AppState.getLastSignal()    — pre-fill SL/TP from last signal
 *   RiskManager.calc(params)    — live calculation
 *   RiskManager.checkSystemHalt(profile)
 *
 * Events listened:
 *   window 'stateUpdated'    — re-render (refreshes signal pre-fill)
 *   window 'signalGenerated' — re-render + pre-fill from new signal
 *   window 'profileUpdated'  — re-render (balance/profile change)
 *   window 'languagechange'  — re-render
 *   input #rm-balance, #rm-sl-pips, .rm-profile-btn — live recalc
 *
 * CSS classes required (from styles/risk-manager.css):
 *   .rm-panel, .rm-calculator, .rm-result-card, .rm-result-dark,
 *   .rm-lot-size, .rm-risk-level-badge, .rm-multipliers,
 *   .rm-multiplier-row, .rm-account-dashboard, .rm-halt-banner,
 *   .rm-warning-banner, .rm-metric-row, .rm-profile-btn,
 *   .rm-profile-btn.active
 *
 * Architecture Freeze V4.0-R1 | Phase 4B
 */

'use strict';

import * as AppState     from '../state/AppState.js';
import * as AccountState from '../state/AccountState.js';
import * as RiskManager  from '../core/RiskManager.js';
import { t, getLang, formatUSD, formatLot, formatPct, formatPips } from '../i18n/i18n.js';
import { isActionable } from '../types/Signal.js';

// ─────────────────────────────────────────────
// PANEL STATE (survives re-renders)
// ─────────────────────────────────────────────

let _container   = null;
let _slPips      = 50;      // current SL pips input
let _balance     = 1000;    // current balance input
let _riskProfile = 'standard';

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  if (!container) return;
  _container = container;

  // Pre-fill from profile
  const profile = AccountState.get();
  _balance     = profile.account_balance ?? 1000;
  _riskProfile = profile.risk_profile    ?? 'standard';

  render();

  AppState.subscribe('stateUpdated',    () => _syncFromSignal());
  AppState.subscribe('signalGenerated', () => { _syncFromSignal(); render(); });
  window.addEventListener('profileUpdated',  () => { _syncFromProfile(); render(); });
  window.addEventListener('languagechange',  () => render());
}

export function render() {
  if (!_container) return;
  try {
    const html = _buildHTML();
    _container.innerHTML = html;
    _attachInputListeners();
  } catch (err) {
    console.error('[RiskManagerPanel] Render error:', err.message);
  }
}

// ─────────────────────────────────────────────
// HTML
// ─────────────────────────────────────────────

function _buildHTML() {
  const profile  = AccountState.get();
  const signal   = AppState.getLastSignal();
  const lang     = getLang();

  // Compute risk result from current inputs
  const riskResult = RiskManager.calc({
    account_balance:    _balance,
    risk_profile:       _riskProfile,
    sl_pips:            _slPips,
    tp_pips:            signal?.tp2_pips ?? 130,
    regime:             signal?.market_regime ?? 'ranging',
    risk_score:         signal?.risk_score    ?? 50,
    consecutive_losses: profile.consecutive_losses ?? 0,
    win_rate_20:        profile.win_rate_20        ?? 0.5,
  });

  const haltCheck = RiskManager.checkSystemHalt(profile);

  return `
    <div class="rm-panel">
      <div class="rm-header">
        <h2 class="panel-title">${t('risk.title')}</h2>
        ${haltCheck.halt ? _buildHaltBanner(lang) : ''}
        ${!haltCheck.halt && riskResult.drawdown_warning ? _buildWarningBanner(profile, lang) : ''}
      </div>

      <div class="rm-body">
        ${_buildCalculator(profile, signal, lang)}
        ${_buildResultCard(riskResult, lang)}
        ${_buildMultipliers(riskResult, lang)}
        ${_buildAccountDashboard(profile, lang)}
      </div>
    </div>
  `;
}

// ── Calculator inputs ────────────────────────

function _buildCalculator(profile, signal, lang) {
  const profiles = ['conservative', 'standard', 'aggressive'];

  const profileBtns = profiles.map(p => `
    <button class="rm-profile-btn ${_riskProfile === p ? 'active' : ''}"
            data-profile="${p}">
      ${t(`risk.${p}`)}
    </button>
  `).join('');

  return `
    <div class="rm-calculator">
      <div class="rm-input-group">
        <label class="rm-label" for="rm-balance">${t('risk.balance')}</label>
        <input id="rm-balance" class="rm-input" type="number"
               min="100" max="1000000" step="100"
               value="${_balance}">
      </div>
      <div class="rm-input-group">
        <label class="rm-label" for="rm-sl-pips">${t('risk.slPips')}</label>
        <input id="rm-sl-pips" class="rm-input" type="number"
               min="5" max="500" step="5"
               value="${_slPips}">
      </div>
      <div class="rm-input-group">
        <label class="rm-label">${t('risk.profile')}</label>
        <div class="rm-profile-btns">${profileBtns}</div>
      </div>
      ${signal && isActionable(signal) ? `
        <div class="rm-signal-link">
          <span class="rm-signal-icon">⚡</span>
          <span>${lang === 'zh' ? '来自最新信号' : 'From last signal'}:
            SL ${signal.sl_pips} ${t('signal.pips')} · TP2 ${signal.tp2_pips} ${t('signal.pips')}
          </span>
          <button class="rm-use-signal-btn" id="rm-use-signal">
            ${lang === 'zh' ? '使用' : 'Use'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// ── Result card ──────────────────────────────

function _buildResultCard(result, lang) {
  const lotStr    = formatLot(result.lot_size);
  const lossStr   = formatUSD(result.max_loss_usd);
  const profitStr = formatUSD(result.expected_profit_usd);
  const rrStr     = `1:${result.rr_ratio?.toFixed(2) ?? '—'}`;
  const riskStr   = formatPct(result.effective_risk_pct);
  const levelCls  = `rm-level-${(result.risk_level ?? 'STANDARD').toLowerCase()}`;
  const levelText = lang === 'zh' ? result.level_text_zh : result.level_text_en;

  return `
    <div class="rm-result-card rm-result-dark">
      <div class="rm-lot-size">
        <span class="rm-lot-number">${lotStr}</span>
        <span class="rm-lot-label">${t('risk.lot')}</span>
      </div>

      <div class="rm-risk-level-badge ${levelCls}">
        ${levelText ?? result.risk_level}
      </div>

      <div class="rm-result-grid">
        ${_resultRow(t('risk.maxLoss'),        lossStr,   'loss')}
        ${_resultRow(t('risk.expectedProfit'), profitStr, 'profit')}
        ${_resultRow(t('risk.rrRatio'),        rrStr,     '')}
        ${_resultRow(t('risk.effectiveRisk'),  riskStr,   '')}
      </div>
    </div>
  `;
}

function _resultRow(label, value, cls) {
  return `
    <div class="rm-result-row">
      <span class="rm-result-label">${label}</span>
      <span class="rm-result-value ${cls ? `rm-result-${cls}` : ''}">${value}</span>
    </div>
  `;
}

// ── Multiplier breakdown ─────────────────────

function _buildMultipliers(result, lang) {
  const rows = [
    { label: lang === 'zh' ? '市场状态' : 'Regime',     value: result.regime_multiplier },
    { label: lang === 'zh' ? '连续亏损' : 'Drawdown',   value: result.drawdown_multiplier },
    { label: lang === 'zh' ? '历史绩效' : 'Performance',value: result.performance_multiplier },
    { label: lang === 'zh' ? '风险评分' : 'Risk Score', value: result.risk_score_multiplier },
  ].map(({ label, value }) => {
    const v   = value ?? 1.0;
    const cls = v < 1.0 ? 'rm-mult-reduced' : v > 1.0 ? 'rm-mult-boosted' : 'rm-mult-neutral';
    return `
      <div class="rm-multiplier-row">
        <span class="rm-mult-label">${label}</span>
        <span class="rm-mult-value ${cls}">${v.toFixed(2)}×</span>
      </div>
    `;
  }).join('');

  return `
    <div class="rm-multipliers">
      <div class="rm-mult-title">${lang === 'zh' ? '仓位乘数' : 'Size Multipliers'}</div>
      ${rows}
    </div>
  `;
}

// ── Account dashboard ────────────────────────

function _buildAccountDashboard(profile, lang) {
  const daily   = formatPct(profile.daily_risk_used   ?? 0);
  const weekly  = formatPct(profile.weekly_risk_used  ?? 0);
  const dd      = formatPct(profile.current_drawdown  ?? 0);
  const maxDD   = formatPct(profile.max_drawdown_limit ?? 0.10);
  const consec  = profile.consecutive_losses ?? 0;
  const maxCons = profile.max_consecutive_losses ?? 5;

  const ddPct    = Math.min(100, Math.round(
    ((profile.current_drawdown ?? 0) / (profile.max_drawdown_limit ?? 0.10)) * 100
  ));
  const consecPct = Math.min(100, Math.round((consec / maxCons) * 100));

  return `
    <div class="rm-account-dashboard">
      <div class="rm-dash-title">${lang === 'zh' ? '账户风险状况' : 'Account Risk Status'}</div>

      ${_dashRow(t('risk.dailyUsed'),  daily,  100,  lang)}
      ${_dashRow(t('risk.weeklyUsed'), weekly, 100,  lang)}

      <div class="rm-dash-row">
        <span class="rm-dash-label">${t('risk.drawdown')}</span>
        <div class="rm-dash-bar-wrap">
          <div class="rm-dash-bar">
            <div class="rm-dash-fill rm-dd-fill" style="width:${ddPct}%"></div>
          </div>
          <span class="rm-dash-value">${dd} / ${maxDD}</span>
        </div>
      </div>

      <div class="rm-dash-row">
        <span class="rm-dash-label">${t('risk.consecLoss')}</span>
        <div class="rm-dash-bar-wrap">
          <div class="rm-dash-bar">
            <div class="rm-dash-fill rm-cl-fill" style="width:${consecPct}%"></div>
          </div>
          <span class="rm-dash-value">${consec} / ${maxCons}</span>
        </div>
      </div>

      ${consec >= 3 ? `
        <div class="rm-consec-warning">
          ⚠️ ${consec} ${t('risk.warningDetail')}
        </div>
      ` : ''}
    </div>
  `;
}

function _dashRow(label, value, maxPct, lang) {
  return `
    <div class="rm-dash-row">
      <span class="rm-dash-label">${label}</span>
      <span class="rm-dash-value">${value}</span>
    </div>
  `;
}

// ── Banner helpers ───────────────────────────

function _buildHaltBanner(lang) {
  return `
    <div class="rm-halt-banner">
      <strong>${t('risk.halt')}</strong>
      <span>${t('risk.haltReason')}</span>
    </div>
  `;
}

function _buildWarningBanner(profile, lang) {
  const n = profile.consecutive_losses ?? 0;
  return `
    <div class="rm-warning-banner">
      ⚠️ ${t('risk.warning')}: ${n} ${t('risk.warningDetail')}
    </div>
  `;
}

// ─────────────────────────────────────────────
// INPUT EVENT LISTENERS
// ─────────────────────────────────────────────

function _attachInputListeners() {
  const balanceInput = _container.querySelector('#rm-balance');
  const slInput      = _container.querySelector('#rm-sl-pips');
  const profileBtns  = _container.querySelectorAll('.rm-profile-btn');
  const useSignalBtn = _container.querySelector('#rm-use-signal');

  if (balanceInput) {
    balanceInput.addEventListener('input', () => {
      const v = parseFloat(balanceInput.value);
      if (v > 0) { _balance = v; _rerender(); }
    });
  }

  if (slInput) {
    slInput.addEventListener('input', () => {
      const v = parseInt(slInput.value, 10);
      if (v > 0) { _slPips = v; _rerender(); }
    });
  }

  profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      _riskProfile = btn.dataset.profile;
      _rerender();
    });
  });

  if (useSignalBtn) {
    useSignalBtn.addEventListener('click', () => {
      const sig = AppState.getLastSignal();
      if (sig?.sl_pips > 0) { _slPips = sig.sl_pips; _rerender(); }
    });
  }
}

// ─────────────────────────────────────────────
// SYNC HELPERS
// ─────────────────────────────────────────────

function _syncFromSignal() {
  const sig = AppState.getLastSignal();
  if (sig?.sl_pips > 0) _slPips = sig.sl_pips;
}

function _syncFromProfile() {
  const p = AccountState.get();
  _balance     = p.account_balance ?? _balance;
  _riskProfile = p.risk_profile    ?? _riskProfile;
}

/** Lightweight re-render that preserves input focus */
function _rerender() {
  const focused = document.activeElement?.id;
  render();
  if (focused) {
    const el = _container.querySelector(`#${focused}`);
    if (el) { el.focus(); el.select?.(); }
  }
}
