/**
 * ONETO EUR/USD AI Tool — DecisionPanel
 * ========================================
 * Decision Engine page component.
 * Renders:
 *   1. Decision pipeline flow diagram (5 steps → final signal)
 *   2. Multi-Timeframe alignment panel (3 bias bars + state)
 *   3. Signal explanation (why this signal — per category)
 *   4. Gate results table (6 pass/fail checks)
 *   5. Final score + confidence display
 *
 * Data sources:
 *   AppState.getLastSignal()  — DecisionResult fields
 *   AppState.getLastVotes()   — per-agent scores for pipeline nodes
 *
 * Events listened:
 *   window 'stateUpdated'    — re-render
 *   window 'signalGenerated' — re-render
 *   window 'languagechange'  — re-render
 *
 * CSS classes required (from styles/decision.css):
 *   .decision-panel, .decision-header,
 *   .pipeline-flow, .pipeline-node, .pipeline-node.active/.inactive,
 *   .pipeline-arrow, .pipeline-final,
 *   .mtf-panel, .mtf-bias-row, .mtf-bias-bar, .mtf-bias-fill,
 *   .mtf-state-badge,
 *   .explanation-list, .explanation-item, .explanation-category,
 *   .gates-table, .gate-row, .gate-pass, .gate-fail,
 *   .score-display, .final-score-ring, .conf-meter
 *
 * Architecture Freeze V4.0-R1 | Phase 4B
 */

'use strict';

import * as AppState from '../state/AppState.js';
import { t, getLang } from '../i18n/i18n.js';
import { AGENT } from '../types/Vote.js';
import { SIGNAL_STRENGTH, SIGNAL_DIRECTION } from '../types/Signal.js';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'data',      icon: '📡', en: 'Market Data',        zh: '市场数据'   },
  { key: 'regime',    icon: '🌐', en: 'Market Regime',      zh: '市场状态'   },
  { key: 'mtf',       icon: '🔭', en: 'MTF Alignment',      zh: '多周期对齐' },
  { key: 'committee', icon: '🧠', en: 'AI Committee',       zh: 'AI委员会'   },
  { key: 'decision',  icon: '⚡', en: 'Decision Engine',    zh: '决策引擎'   },
];

const GATE_KEYS = [
  { field: 'mtf_pass',             i18nKey: 'decision.gates.mtf'          },
  { field: 'confidence_pass',      i18nKey: 'decision.gates.confidence'   },
  { field: 'rr_pass',              i18nKey: 'decision.gates.rr'           },
  { field: 'agent_agreement_pass', i18nKey: 'decision.gates.agentAgreement'},
  { field: 'drawdown_pass',        i18nKey: 'decision.gates.drawdown'     },
  { field: 'regime_pass',          i18nKey: 'decision.gates.regime'       },
];

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

let _container = null;

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  if (!container) return;
  _container = container;
  render();
  AppState.subscribe('stateUpdated',    () => render());
  AppState.subscribe('signalGenerated', () => render());
  window.addEventListener('languagechange', () => render());
}

export function render() {
  if (!_container) return;
  try {
    _container.innerHTML = _buildHTML();
  } catch (err) {
    console.error('[DecisionPanel] Render error:', err.message);
  }
}

// ─────────────────────────────────────────────
// HTML BUILDERS
// ─────────────────────────────────────────────

function _buildHTML() {
  const signal = AppState.getLastSignal();
  const votes  = AppState.getLastVotes();
  const lang   = getLang();

  return `
    <div class="decision-panel">
      <div class="decision-header">
        <h2 class="panel-title">${t('decision.title')}</h2>
      </div>
      ${_buildPipelineFlow(signal, votes, lang)}
      ${_buildMTFPanel(signal, lang)}
      ${_buildGatesTable(signal, lang)}
      ${_buildScoreDisplay(signal, lang)}
      ${_buildExplanation(signal, lang)}
    </div>
  `;
}

// ── Pipeline flow ────────────────────────────

function _buildPipelineFlow(signal, votes, lang) {
  const strength = signal?.signal_strength ?? SIGNAL_STRENGTH.NO_TRADE;
  const noTrade  = strength === SIGNAL_STRENGTH.NO_TRADE;
  const gates    = signal?.gates ?? {};

  // Map each step to active/inactive based on whether it passed
  const stepActive = {
    data:      true,
    regime:    true,
    mtf:       gates.mtf_pass !== false,
    committee: gates.mtf_pass !== false,
    decision:  !noTrade,
  };

  const nodes = PIPELINE_STEPS.map((step, i) => {
    const active = stepActive[step.key];
    const label  = lang === 'zh' ? step.zh : step.en;
    const score  = _stepScore(step.key, signal, votes);

    return `
      <div class="pipeline-node ${active ? 'active' : 'inactive'}">
        <div class="pipeline-node-icon">${step.icon}</div>
        <div class="pipeline-node-label">${label}</div>
        ${score !== null ? `<div class="pipeline-node-score">${score}</div>` : ''}
      </div>
      ${i < PIPELINE_STEPS.length - 1
        ? `<div class="pipeline-arrow ${active ? 'active' : 'inactive'}">→</div>`
        : ''}
    `;
  }).join('');

  const finalCls = _signalClass(strength);
  const finalLabel = t(`signal.strength.${strength}`);

  return `
    <div class="pipeline-section">
      <div class="pipeline-flow">${nodes}</div>
      <div class="pipeline-final pipeline-final-${finalCls}">
        ${finalLabel}
      </div>
    </div>
  `;
}

function _stepScore(stepKey, signal, votes) {
  if (!signal) return null;
  switch (stepKey) {
    case 'committee': {
      const s = signal.final_score ?? 50;
      return `${s}`;
    }
    case 'decision': return `${signal.final_confidence ?? 0}%`;
    default: return null;
  }
}

// ── MTF alignment panel ──────────────────────

function _buildMTFPanel(signal, lang) {
  // MTF data stored on signal — extract what we have
  const mtfState = signal?.mtf_state ?? 'not_aligned';
  const confAdj  = signal?.mtf_confidence_adj ?? 0;

  // Bias values are stored on snapshot; we display what we can from signal
  // Full bias values require snapshot lookup — show state + conf_adj here
  const stateLabel   = t(`mtf.${mtfState}`);
  const stateCls     = mtfState.replace('_', '-');
  const adjSign      = confAdj >= 0 ? '+' : '';
  const adjLabel     = `${adjSign}${confAdj}`;

  const biasBars = [
    { label: t('mtf.bias1d'), key: '1D' },
    { label: t('mtf.bias4h'), key: '4H' },
    { label: t('mtf.bias1h'), key: '1H' },
  ].map(({ label }) => `
    <div class="mtf-bias-row">
      <span class="mtf-bias-label">${label}</span>
      <div class="mtf-bias-track">
        <div class="mtf-bias-midline"></div>
      </div>
    </div>
  `).join('');

  return `
    <div class="mtf-panel">
      <div class="mtf-header">
        <span class="mtf-title">${t('mtf.title')}</span>
        <span class="mtf-state-badge mtf-state-${stateCls}">${stateLabel}</span>
        <span class="mtf-conf-adj" title="${t('mtf.confAdj')}">${adjLabel}</span>
      </div>
      <div class="mtf-bias-list">${biasBars}</div>
    </div>
  `;
}

// ── Gate results table ───────────────────────

function _buildGatesTable(signal, lang) {
  if (!signal) {
    return `<div class="gates-table gates-empty">—</div>`;
  }

  const gates = signal.gates ?? {};

  const rows = GATE_KEYS.map(({ field, i18nKey }) => {
    const passed = gates[field] !== false;
    const cls    = passed ? 'gate-pass' : 'gate-fail';
    const icon   = passed ? '✓' : '✗';
    const label  = passed ? t('decision.passed') : t('decision.failed');

    return `
      <div class="gate-row ${cls}">
        <span class="gate-icon">${icon}</span>
        <span class="gate-name">${t(i18nKey)}</span>
        <span class="gate-result">${label}</span>
      </div>
    `;
  }).join('');

  const allPassed = GATE_KEYS.every(({ field }) => gates[field] !== false);
  const summaryLabel = allPassed
    ? (lang === 'zh' ? '全部通过 ✓' : 'All gates passed ✓')
    : (lang === 'zh' ? '有门控未通过 ✗' : 'Gate(s) failed ✗');
  const summaryCls = allPassed ? 'gates-summary-pass' : 'gates-summary-fail';

  return `
    <div class="gates-section">
      <div class="gates-title">${t('decision.gateResults')}</div>
      <div class="gates-table">${rows}</div>
      <div class="gates-summary ${summaryCls}">${summaryLabel}</div>
    </div>
  `;
}

// ── Final score display ──────────────────────

function _buildScoreDisplay(signal, lang) {
  if (!signal) return '';

  const score = signal.final_score      ?? 50;
  const conf  = signal.final_confidence ?? 0;
  const agree = signal.agents_agreeing  ?? 0;

  // Determine score direction label
  const direction = score > 55 ? t('signal.sell') : score < 45 ? t('signal.buy') : t('signal.neutral');
  const scoreCls  = score > 55 ? 'bear' : score < 45 ? 'bull' : 'neutral';

  return `
    <div class="score-display">
      <div class="score-block">
        <div class="score-number score-number-${scoreCls}">${score}</div>
        <div class="score-direction">${direction}</div>
        <div class="score-sublabel">${t('decision.finalScore')}</div>
      </div>
      <div class="score-block">
        <div class="conf-number">${conf}%</div>
        <div class="conf-sublabel">${t('signal.confidence')}</div>
        <div class="conf-meter-track">
          <div class="conf-meter-fill conf-${_confLevel(conf)}"
               style="width:${conf}%"></div>
        </div>
      </div>
      <div class="score-block">
        <div class="agree-number">${agree}</div>
        <div class="agree-sublabel">${t('agents.agreeing')}</div>
      </div>
    </div>
  `;
}

function _confLevel(conf) {
  if (conf >= 75) return 'high';
  if (conf >= 55) return 'medium';
  return 'low';
}

// ── Signal explanation ───────────────────────

function _buildExplanation(signal, lang) {
  if (!signal || !Array.isArray(signal.explanation) || signal.explanation.length === 0) {
    return '';
  }

  const items = signal.explanation.map(item => {
    const text = lang === 'zh' && item.text_zh ? item.text_zh : item.text_en;
    return `
      <div class="explanation-item" style="border-left-color:${item.color ?? 'var(--text3)'}">
        <span class="explanation-category">${item.category}</span>
        <span class="explanation-text">${text}</span>
      </div>
    `;
  }).join('');

  // No-trade reason override
  if (signal.signal_strength === 'NO_TRADE' && signal.no_trade_reason) {
    return `
      <div class="explanation-section">
        <div class="explanation-title">${t('decision.noTradeReason')}</div>
        <div class="explanation-list">
          <div class="explanation-item explanation-item-notrade">
            <span class="explanation-text">${signal.no_trade_reason}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="explanation-section">
      <div class="explanation-title">${t('decision.explanation')}</div>
      <div class="explanation-list">${items}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function _signalClass(strength) {
  const s = strength ?? '';
  if (s.includes('BUY'))  return 'buy';
  if (s.includes('SELL')) return 'sell';
  if (s === 'NO_TRADE')   return 'notrade';
  return 'neutral';
}
