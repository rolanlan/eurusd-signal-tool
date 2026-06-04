/**
 * ONETO EUR/USD AI Tool — RegimeEngine
 * =======================================
 * Market Regime Classification Engine.
 * Classifies the current market environment into one of 6 regimes,
 * then outputs regime-specific agent weights and position multipliers
 * consumed by CommitteeEngine and RiskManager.
 *
 * 6 Regimes (evaluated in priority order):
 *   1. volatile      — ATR ratio > 1.8 (safety-first; always checked first)
 *   2. breakout_up   — price closed above BB upper, ADX rising from below 25
 *   3. breakout_down — price closed below BB lower, ADX rising from below 25
 *   4. trending_bear — price < MA20 < MA50, ADX > 25, BB expanding
 *   5. trending_bull — price > MA20 > MA50, ADX > 25, BB expanding
 *   6. ranging       — default (ADX < 20, BB contracting)
 *
 * Regime → position_size_multiplier:
 *   volatile:    0.50   (half size — protect capital)
 *   ranging:     0.75   (reduced size — less conviction)
 *   trending:    1.00   (full size — ride the trend)
 *   breakout:    1.00   (full size — momentum)
 *
 * Regime → min_confidence_override:
 *   volatile:    75    (raise bar in choppy markets)
 *   ranging:     70    (slightly higher bar)
 *   others:      null  (use account_profile default)
 *
 * Weight adjustment output reads directly from Vote.js REGIME_WEIGHTS
 * to guarantee single source of truth across all modules.
 *
 * Phase 1–4: regime history stored in localStorage ring buffer.
 * Phase 5+:  written to market_regime_history Supabase table.
 *
 * Contract: run() NEVER throws. Always returns a valid RegimeResult.
 *
 * Interface Contract 2 compliant.
 * Architecture Freeze V4.0-R1 | Phase 3
 */

'use strict';

import {
  calcMA,
  calcATR,
  calcADX,
  calcBB,
  calcRSI,
  percentileRank,
} from '../utils/indicators.js';

import {
  DEFAULT_WEIGHTS,
  REGIME_WEIGHTS,
} from '../types/Vote.js';

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

const MIN_CANDLES         = 20;
const STORAGE_KEY         = 'regime_history_v4';
const MAX_HISTORY         = 100;   // ring buffer

/** ATR ratio thresholds */
const ATR_VOLATILE_THRESH = 1.8;   // current ATR / 30-bar ATR avg ≥ this → volatile

/** ADX thresholds */
const ADX_TRENDING_THRESH = 25;    // ADX above this = trending
const ADX_RANGING_THRESH  = 20;    // ADX below this = ranging
const ADX_BREAKOUT_MIN    = 20;    // ADX must be above this for breakout confirmation

/** BB width percentile thresholds */
const BB_EXPANDING_PCT    = 50;    // percentile > 50 = width expanding vs 30-bar range
const BB_CONTRACTING_PCT  = 30;    // percentile < 30 = width contracting

/** position size multiplier per regime */
const SIZE_MULT = Object.freeze({
  volatile:      0.50,
  ranging:       0.75,
  trending_bull: 1.00,
  trending_bear: 1.00,
  breakout_up:   1.00,
  breakout_down: 1.00,
});

/** min_confidence override per regime (null = use profile default) */
const CONF_OVERRIDE = Object.freeze({
  volatile:      75,
  ranging:       70,
  trending_bull: null,
  trending_bear: null,
  breakout_up:   null,
  breakout_down: null,
});

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Classifies the current market regime from 4H candles.
 *
 * @param {Candle[]} candles  - 4H OHLCV, ascending time, minimum 50
 * @returns {RegimeResult}
 */
export function run(candles) {
  try {
    return _run(candles);
  } catch (err) {
    console.error('[RegimeEngine] Unexpected error:', err.message);
    return _defaultResult('ranging', 'Error — defaulting to ranging');
  }
}

/**
 * Returns the last N regime records from the localStorage history.
 * @param {number} [n=10]
 * @returns {RegimeHistoryEntry[]}
 */
export function getHistory(n = 10) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.slice(0, n);
  } catch (_) {
    return [];
  }
}

/**
 * Returns the most recently detected regime label, or 'ranging' if none stored.
 * @returns {string}
 */
export function getLastRegime() {
  const h = getHistory(1);
  return h.length ? h[0].regime : 'ranging';
}

// ─────────────────────────────────────────────
// CORE CLASSIFICATION
// ─────────────────────────────────────────────

function _run(candles) {
  if (!Array.isArray(candles) || candles.length < MIN_CANDLES) {
    return _defaultResult('ranging', 'Insufficient candles — defaulting to ranging');
  }

  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const last   = closes[closes.length - 1];

  // ── Indicators ──────────────────────────────
  const ma20  = calcMA(closes, 20);
  const ma50  = calcMA(closes, Math.min(50, closes.length));
  const bb    = calcBB(closes, 20, 2);
  const adxResult = calcADX(highs, lows, closes, 14);
  const adx   = adxResult.adx;

  // ATR ratio: current 14-bar ATR vs 30-bar ATR (vol normalisation)
  const atr14  = calcATR(highs, lows, closes, 14);
  const atr30  = calcATR(highs, lows, closes, Math.min(30, candles.length - 1));
  const atr_ratio = atr30 > 0
    ? parseFloat((atr14 / atr30).toFixed(3))
    : 1.0;

  // BB width percentile vs last 30 bars
  const bbWidths = _computeBBWidths(closes, 30);
  const bb_width_percentile = percentileRank(bb.width, bbWidths);

  // ── Classification (priority order) ─────────
  let regime, trigger, confidence;

  // PRIORITY 1 — Volatile (always checked first — capital protection)
  if (atr_ratio >= ATR_VOLATILE_THRESH) {
    regime    = 'volatile';
    trigger   = `ATR ratio ${atr_ratio.toFixed(2)} ≥ ${ATR_VOLATILE_THRESH} (elevated volatility)`;
    confidence = Math.min(100, Math.round(40 + (atr_ratio - ATR_VOLATILE_THRESH) * 30));
  }

  // PRIORITY 2 — Breakout Up: price closed above BB upper, ADX recovering
  else if (last > bb.upper && adx >= ADX_BREAKOUT_MIN) {
    regime    = 'breakout_up';
    trigger   = `Price ${last.toFixed(5)} above BB upper ${bb.upper.toFixed(5)}, ADX ${adx.toFixed(1)}`;
    confidence = Math.min(100, Math.round(50 + (last - bb.upper) / bb.width * 100));
  }

  // PRIORITY 3 — Breakout Down: price closed below BB lower, ADX recovering
  else if (last < bb.lower && adx >= ADX_BREAKOUT_MIN) {
    regime    = 'breakout_down';
    trigger   = `Price ${last.toFixed(5)} below BB lower ${bb.lower.toFixed(5)}, ADX ${adx.toFixed(1)}`;
    confidence = Math.min(100, Math.round(50 + (bb.lower - last) / bb.width * 100));
  }

  // PRIORITY 4 — Trending Bear: price < MA20 < MA50, ADX trending, BB expanding
  else if (
    last < ma20 && ma20 < ma50 &&
    adx >= ADX_TRENDING_THRESH &&
    bb_width_percentile >= BB_EXPANDING_PCT
  ) {
    regime    = 'trending_bear';
    trigger   = `Bearish MA stack (${last.toFixed(5)} < MA20 ${ma20.toFixed(5)} < MA50 ${ma50.toFixed(5)}), ADX ${adx.toFixed(1)}, BB pct ${bb_width_percentile}`;
    confidence = _trendConfidence(adx, bb_width_percentile, atr_ratio);
  }

  // PRIORITY 5 — Trending Bull: price > MA20 > MA50, ADX trending, BB expanding
  else if (
    last > ma20 && ma20 > ma50 &&
    adx >= ADX_TRENDING_THRESH &&
    bb_width_percentile >= BB_EXPANDING_PCT
  ) {
    regime    = 'trending_bull';
    trigger   = `Bullish MA stack (${last.toFixed(5)} > MA20 ${ma20.toFixed(5)} > MA50 ${ma50.toFixed(5)}), ADX ${adx.toFixed(1)}, BB pct ${bb_width_percentile}`;
    confidence = _trendConfidence(adx, bb_width_percentile, atr_ratio);
  }

  // PRIORITY 6 — Ranging (default / weak trend)
  else {
    regime    = 'ranging';
    trigger   = _rangingTrigger(adx, bb_width_percentile, last, ma20, ma50);
    confidence = _rangingConfidence(adx, bb_width_percentile);
  }

  // ── Assemble result ──────────────────────────
  const result = Object.freeze({
    regime,
    confidence,
    adx_14:              parseFloat(adx.toFixed(2)),
    atr_ratio,
    bb_width_percentile,
    weight_adjustment:   REGIME_WEIGHTS[regime] ?? DEFAULT_WEIGHTS,
    position_size_multiplier: SIZE_MULT[regime] ?? 1.00,
    min_confidence_override:  CONF_OVERRIDE[regime] ?? null,
    transition_trigger:  trigger,
  });

  // Persist to localStorage history ring buffer
  _persistHistory(result);

  return result;
}

// ─────────────────────────────────────────────
// CONFIDENCE HELPERS
// ─────────────────────────────────────────────

function _trendConfidence(adx, bbPct, atrRatio) {
  // Base: ADX above 25 gives baseline, higher ADX = stronger trend
  let conf = 50;
  conf += Math.min(30, (adx - ADX_TRENDING_THRESH) * 2);
  // BB expanding confirms trend
  if (bbPct > 70) conf += 15;
  else if (bbPct > 50) conf += 8;
  // Moderate ATR ratio indicates healthy trend (too high = volatile)
  if (atrRatio > 0.8 && atrRatio < 1.6) conf += 5;
  return Math.min(100, Math.max(50, Math.round(conf)));
}

function _rangingConfidence(adx, bbPct) {
  let conf = 50;
  // Lower ADX = more confident ranging
  if (adx < 15) conf += 25;
  else if (adx < 20) conf += 15;
  // Contracting BB = more confident ranging
  if (bbPct < 20) conf += 20;
  else if (bbPct < 30) conf += 10;
  return Math.min(100, Math.max(40, Math.round(conf)));
}

// ─────────────────────────────────────────────
// TRIGGER STRING BUILDERS
// ─────────────────────────────────────────────

function _rangingTrigger(adx, bbPct, price, ma20, ma50) {
  const parts = [];
  if (adx < ADX_RANGING_THRESH)  parts.push(`ADX ${adx.toFixed(1)} < ${ADX_RANGING_THRESH}`);
  if (bbPct < BB_CONTRACTING_PCT) parts.push(`BB width pct ${bbPct} (contracting)`);
  if (parts.length === 0) {
    // Weak trend that didn't meet thresholds for trending/breakout
    parts.push(`ADX ${adx.toFixed(1)}, BB pct ${bbPct}, price ${price.toFixed(5)}`);
  }
  return parts.join(' · ');
}

// ─────────────────────────────────────────────
// BB WIDTH SERIES
// ─────────────────────────────────────────────

/**
 * Computes BB widths for the last `lookback` bars.
 * Used for percentile rank calculation.
 *
 * @param {number[]} closes
 * @param {number}   lookback
 * @returns {number[]}
 */
function _computeBBWidths(closes, lookback) {
  if (closes.length < 20 + lookback) return [0];
  const widths = [];
  const start  = Math.max(20, closes.length - lookback - 20);
  for (let i = start; i <= closes.length; i++) {
    const bb = calcBB(closes.slice(0, i), 20, 2);
    if (bb.width > 0) widths.push(bb.width);
  }
  return widths.length ? widths : [0];
}

// ─────────────────────────────────────────────
// DEFAULT RESULT
// ─────────────────────────────────────────────

function _defaultResult(regime, trigger) {
  return Object.freeze({
    regime,
    confidence:               30,
    adx_14:                   0,
    atr_ratio:                1.0,
    bb_width_percentile:      50,
    weight_adjustment:        DEFAULT_WEIGHTS,
    position_size_multiplier: 1.00,
    min_confidence_override:  null,
    transition_trigger:       trigger,
  });
}

// ─────────────────────────────────────────────
// HISTORY PERSISTENCE
// ─────────────────────────────────────────────

/**
 * Appends a regime classification to the localStorage ring buffer.
 * Keeps only the last MAX_HISTORY entries.
 *
 * Phase 5+: this will additionally write to market_regime_history Supabase table.
 *
 * @param {RegimeResult} result
 */
function _persistHistory(result) {
  try {
    const raw     = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    const entry = {
      regime:    result.regime,
      confidence: result.confidence,
      adx_14:    result.adx_14,
      atr_ratio: result.atr_ratio,
      bb_width_percentile: result.bb_width_percentile,
      transition_trigger: result.transition_trigger,
      timestamp: Date.now(),
    };

    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (_) {
    // localStorage not available (SSR / test env) — silently ignore
  }
}

// ─────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────

/**
 * @typedef {Object} RegimeResult
 * @property {string}       regime                   - 6-value enum
 * @property {number}       confidence               - 0–100
 * @property {number}       adx_14
 * @property {number}       atr_ratio
 * @property {number}       bb_width_percentile      - 0–100
 * @property {WeightConfig} weight_adjustment        - from Vote.js REGIME_WEIGHTS
 * @property {number}       position_size_multiplier - 0.50 | 0.75 | 1.00
 * @property {number|null}  min_confidence_override  - null = use profile default
 * @property {string}       transition_trigger       - human-readable classification reason
 */

/**
 * @typedef {Object} RegimeHistoryEntry
 * @property {string} regime
 * @property {number} confidence
 * @property {number} adx_14
 * @property {number} atr_ratio
 * @property {number} bb_width_percentile
 * @property {string} transition_trigger
 * @property {number} timestamp
 */
