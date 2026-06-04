/**
 * ONETO EUR/USD AI Tool — MTFEngine
 * ====================================
 * Multi-Timeframe Alignment Engine.
 * Step 0 of the decision pipeline — the pre-gate that must pass
 * before the AI Committee is even invoked.
 *
 * Computes a directional bias score for each of three timeframes
 * (1D · 4H · 1H) using MA alignment, RSI momentum, MACD cross,
 * and BB position. Weights them into a composite MTF score and
 * classifies alignment state.
 *
 * Timeframe weights (composite score):
 *   1D: 50%  (primary trend — highest authority)
 *   4H: 35%  (trading timeframe — execution reference)
 *   1H: 15%  (entry timing — fine-tuning only)
 *
 * MTF States → confidence_adj → gate_pass:
 *   fully_aligned:    all 3 TF same direction, |1D bias| > 30  → +10 → true
 *   partially_aligned: 1D + 4H agree, 1H within ±30           → +5  → true
 *   primary_only:     1D and 4H disagree (counter-trend)       → -15 → true
 *   not_aligned:      |MTF score| ≤ 20 (no clear direction)    →  0  → false
 *
 * Contract: run() NEVER throws. Always returns a valid MTFResult.
 *
 * Interface Contract 1 compliant.
 * Architecture Freeze V4.0-R1 | Phase 3
 */

'use strict';

import {
  calcMA,
  calcRSI,
  calcMACD,
  calcBB,
  calcATR,
  calcADX,
} from '../utils/indicators.js';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

/** Minimum candles required for a meaningful bias score */
const MIN_CANDLES = 20;

/** Composite score weights per timeframe */
const TF_WEIGHTS = Object.freeze({ '1d': 0.50, '4h': 0.35, '1h': 0.15 });

/** Bias score thresholds for state classification */
const NOT_ALIGNED_THRESHOLD   = 20;   // |MTF score| ≤ 20 → not_aligned
const STRONG_ALIGNMENT_BIAS   = 30;   // |1D bias| > 30 needed for fully_aligned

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Runs the Multi-Timeframe Alignment analysis.
 *
 * NOTE: Parameter order follows the contract signature:
 *   run(candles1d, candles4h, candles1h)
 *
 * @param {Candle[]} candles1d  - 1D OHLCV, ascending time, min 50
 * @param {Candle[]} candles4h  - 4H OHLCV, ascending time, min 50
 * @param {Candle[]} candles1h  - 1H OHLCV, ascending time, min 50
 * @returns {MTFResult}
 */
export function run(candles1d, candles4h, candles1h) {
  try {
    return _run(candles1d, candles4h, candles1h);
  } catch (err) {
    console.error('[MTFEngine] Unexpected error:', err.message);
    return _insufficientResult();
  }
}

// ─────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────

function _run(candles1d, candles4h, candles1h) {
  // Guard: any TF with < MIN_CANDLES falls back gracefully
  const has1d = Array.isArray(candles1d) && candles1d.length >= MIN_CANDLES;
  const has4h = Array.isArray(candles4h) && candles4h.length >= MIN_CANDLES;
  const has1h = Array.isArray(candles1h) && candles1h.length >= MIN_CANDLES;

  if (!has4h) {
    // 4H is the non-negotiable primary timeframe
    return _insufficientResult();
  }

  // Compute per-timeframe bias scores
  const bias4h = _computeBias(candles4h, '4h');
  const bias1d  = has1d
    ? _computeBias(candles1d, '1d')
    : _mirrorBias(bias4h, 0.80);   // 1D absent: mirror 4H with 80% dampening
  const bias1h  = has1h
    ? _computeBias(candles1h, '1h')
    : _mirrorBias(bias4h, 0.40);   // 1H absent: mirror 4H with 40% dampening

  // Composite MTF score: negative = bearish, positive = bullish
  const mtf_score = parseFloat(
    (bias1d  * TF_WEIGHTS['1d'] +
     bias4h  * TF_WEIGHTS['4h'] +
     bias1h  * TF_WEIGHTS['1h']).toFixed(2)
  );

  // Direction
  const direction = mtf_score < -NOT_ALIGNED_THRESHOLD
    ? 'BEARISH'
    : mtf_score >  NOT_ALIGNED_THRESHOLD
      ? 'BULLISH'
      : 'NEUTRAL';

  // State classification
  const { mtf_state, confidence_adj } = _classifyState(bias1d, bias4h, bias1h, mtf_score);

  const gate_pass = mtf_state !== 'not_aligned';

  // Labels for description strings
  const { description_en, description_zh } = _buildDescriptions(
    direction, mtf_state, bias1d, bias4h, bias1h, mtf_score
  );

  return Object.freeze({
    mtf_score,
    mtf_state,
    bias_1d:      parseFloat(bias1d.toFixed(2)),
    bias_4h:      parseFloat(bias4h.toFixed(2)),
    bias_1h:      parseFloat(bias1h.toFixed(2)),
    direction,
    confidence_adj,
    gate_pass,
    description_en,
    description_zh,
  });
}

// ─────────────────────────────────────────────
// PER-TIMEFRAME BIAS COMPUTATION
// ─────────────────────────────────────────────

/**
 * Computes a directional bias score for a single timeframe.
 *
 * Bias range: -100 (strongly bearish) to +100 (strongly bullish).
 * Four components:
 *   1. MA alignment   — structural trend direction (max ±35)
 *   2. RSI momentum   — momentum confirmation     (max ±20)
 *   3. MACD histogram — trend acceleration        (max ±25)
 *   4. BB position    — mean-reversion context    (max ±20)
 *
 * @param {Candle[]} candles
 * @param {'1d'|'4h'|'1h'} label   (for comment/debugging only)
 * @returns {number}  bias in [-100, +100], negative = bearish
 */
function _computeBias(candles, label) {
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const last   = closes[closes.length - 1];

  let bias = 0;

  // ── 1. MA Alignment (±35) ──────────────────
  const ma20  = calcMA(closes, 20);
  const ma50  = calcMA(closes, Math.min(50, closes.length));
  const ma200 = closes.length >= 200 ? calcMA(closes, 200) : 0;

  if (ma20 > 0 && ma50 > 0) {
    if (last > ma20 && ma20 > ma50) {
      // Price above short and medium MA — bullish structure
      bias += 20;
      if (ma200 > 0 && last > ma200) bias += 8;   // above 200MA: extra bull
      if (ma20 - ma50 > ma50 * 0.002) bias += 7;  // MA spread widening
    } else if (last < ma20 && ma20 < ma50) {
      // Price below short and medium MA — bearish structure
      bias -= 20;
      if (ma200 > 0 && last < ma200) bias -= 8;
      if (ma50 - ma20 > ma50 * 0.002) bias -= 7;
    } else if (last > ma20) {
      bias += 10;   // price above MA20 only — mild bull
    } else if (last < ma20) {
      bias -= 10;   // price below MA20 only — mild bear
    }
  }

  // ── 2. RSI Momentum (±20) ─────────────────
  const rsi = calcRSI(closes, 14);
  if      (rsi < 30)  bias += 15;   // deeply oversold = contrarian bullish
  else if (rsi < 40)  bias += 8;    // oversold momentum = bullish lean
  else if (rsi > 55 && rsi <= 70) bias -= 12;  // healthy bearish momentum
  else if (rsi > 70)  bias -= 15;   // overbought = contrarian bearish
  else if (rsi < 50)  bias += 5;    // below 50 = mild bullish
  else if (rsi > 50)  bias -= 5;    // above 50 = mild bearish

  // ── 3. MACD Histogram (±25) ───────────────
  const macd = calcMACD(closes);
  const hist = macd.hist;
  if (hist !== 0) {
    // Normalise hist against a reasonable ATR scale
    const atr    = calcATR(highs, lows, closes, 14) || 0.001;
    const relHist = hist / atr;   // dimensionless ratio

    if      (relHist >  0.15) bias -= 20;   // strong bullish MACD
    else if (relHist >  0.05) bias -= 12;
    else if (relHist >  0.01) bias -=  6;
    else if (relHist < -0.15) bias += 20;   // strong bearish MACD
    else if (relHist < -0.05) bias += 12;
    else if (relHist < -0.01) bias +=  6;
  }

  // ── 4. Bollinger Band Position (±20) ──────
  const bb = calcBB(closes, 20, 2);
  if (bb.upper > bb.lower) {
    const bbPct = (last - bb.lower) / (bb.upper - bb.lower);  // 0=lower, 1=upper
    if      (bbPct < 0.15) bias += 15;   // near lower band = oversold/bullish
    else if (bbPct < 0.35) bias +=  8;
    else if (bbPct > 0.85) bias -= 15;   // near upper band = overbought/bearish
    else if (bbPct > 0.65) bias -=  8;
    // Middle zone: no contribution
  }

  // Clamp to [-100, +100]
  return Math.max(-100, Math.min(100, parseFloat(bias.toFixed(2))));
}

// ─────────────────────────────────────────────
// STATE CLASSIFICATION
// ─────────────────────────────────────────────

/**
 * Classifies MTF alignment state from the three bias values.
 *
 * Rules (evaluated top-down, first match wins):
 *
 *   fully_aligned:    all three share same sign, |bias1d| > 30
 *   partially_aligned: 1D + 4H share same sign, |1H bias| < 30 from neutral
 *   primary_only:     1D and 4H have OPPOSITE signs
 *   not_aligned:      |MTF composite score| ≤ 20 (too close to neutral)
 *
 * @param {number} bias1d
 * @param {number} bias4h
 * @param {number} bias1h
 * @param {number} mtf_score
 * @returns {{ mtf_state: string, confidence_adj: number }}
 */
function _classifyState(bias1d, bias4h, bias1h, mtf_score) {
  const sign1d = Math.sign(bias1d);
  const sign4h = Math.sign(bias4h);
  const sign1h = Math.sign(bias1h);

  // Treat near-zero bias as neutral (threshold: ±5)
  const effective1d = Math.abs(bias1d) >= 5 ? sign1d : 0;
  const effective4h = Math.abs(bias4h) >= 5 ? sign4h : 0;
  const effective1h = Math.abs(bias1h) >= 5 ? sign1h : 0;

  // fully_aligned: all three agree AND 1D is a strong trend signal
  if (effective1d !== 0 &&
      effective1d === effective4h &&
      effective1d === effective1h &&
      Math.abs(bias1d) > STRONG_ALIGNMENT_BIAS) {
    return { mtf_state: 'fully_aligned', confidence_adj: 10 };
  }

  // partially_aligned: 1D + 4H agree (1H neutral or same)
  if (effective1d !== 0 &&
      effective1d === effective4h &&
      (effective1h === 0 || effective1h === effective1d)) {
    return { mtf_state: 'partially_aligned', confidence_adj: 5 };
  }

  // primary_only: 1D and 4H directly oppose each other
  if (effective1d !== 0 && effective4h !== 0 && effective1d !== effective4h) {
    return { mtf_state: 'primary_only', confidence_adj: -15 };
  }

  // not_aligned: MTF composite score too weak to commit to a direction
  if (Math.abs(mtf_score) <= NOT_ALIGNED_THRESHOLD) {
    return { mtf_state: 'not_aligned', confidence_adj: 0 };
  }

  // Fallback: partial alignment (1D only set, 4H near-neutral)
  return { mtf_state: 'partially_aligned', confidence_adj: 5 };
}

// ─────────────────────────────────────────────
// DESCRIPTION BUILDERS
// ─────────────────────────────────────────────

const STATE_LABELS_EN = Object.freeze({
  fully_aligned:    '3TF Confirmed',
  partially_aligned:'2TF Confirmed',
  primary_only:     'Counter-Trend ⚠️',
  not_aligned:      'Not Aligned — Signal Suppressed',
});

const STATE_LABELS_ZH = Object.freeze({
  fully_aligned:    '三周期完全对齐',
  partially_aligned:'双周期对齐',
  primary_only:     '逆势信号 ⚠️',
  not_aligned:      '周期冲突 — 信号已屏蔽',
});

function _buildDescriptions(direction, mtf_state, bias1d, bias4h, bias1h, mtf_score) {
  const dirEN = direction === 'BEARISH' ? 'Bearish' : direction === 'BULLISH' ? 'Bullish' : 'Neutral';
  const dirZH = direction === 'BEARISH' ? '偏空' : direction === 'BULLISH' ? '偏多' : '中性';
  const stateEN = STATE_LABELS_EN[mtf_state] ?? mtf_state;
  const stateZH = STATE_LABELS_ZH[mtf_state] ?? mtf_state;

  const bStr = `1D:${bias1d.toFixed(0)} 4H:${bias4h.toFixed(0)} 1H:${bias1h.toFixed(0)}`;

  return {
    description_en: `MTF ${dirEN} · ${stateEN} · ${bStr} (score:${mtf_score})`,
    description_zh: `${dirZH} · ${stateZH} · ${bStr}`,
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Mirrors a bias value with a dampening factor — used when a TF is absent */
function _mirrorBias(bias, factor) {
  return parseFloat((bias * factor).toFixed(2));
}

/** Contract-specified fallback for insufficient data */
function _insufficientResult() {
  return Object.freeze({
    mtf_score:     0,
    mtf_state:     'partially_aligned',
    bias_1d:       0,
    bias_4h:       0,
    bias_1h:       0,
    direction:     'NEUTRAL',
    confidence_adj: 0,
    gate_pass:     true,
    description_en:'Insufficient data — partial alignment assumed',
    description_zh:'数据不足 — 假定部分对齐',
  });
}

// ─────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────

/**
 * @typedef {Object} MTFResult
 * @property {number}  mtf_score        - composite bias, -100 to +100
 * @property {string}  mtf_state        - fully_aligned|partially_aligned|primary_only|not_aligned
 * @property {number}  bias_1d
 * @property {number}  bias_4h
 * @property {number}  bias_1h
 * @property {string}  direction        - BEARISH|BULLISH|NEUTRAL
 * @property {number}  confidence_adj   - -15|0|5|10
 * @property {boolean} gate_pass        - false only when not_aligned
 * @property {string}  description_en
 * @property {string}  description_zh
 */
