/**
 * ONETO EUR/USD AI Tool — MemoryAggregator
 * ==========================================
 * Single entry point for all live market data services.
 * Aggregates FREDService, FinnhubService, COTService, and DataProvider (DXY)
 * into the `memoryLayer` object consumed by CommitteeOrchestrator.
 *
 * Architecture principle:
 *   - Zero agent files modified (CommitteeOrchestrator already does
 *     `const memory = { ...DEFAULT_MEMORY, ...memoryLayer }`)
 *   - index.html adds 2 lines: getMemoryLayer() then pass to SignalEngine
 *   - Each data field degrades independently
 *   - One service failing never blocks other fields
 *
 * Data flow:
 *   MemoryAggregator.getMemoryLayer()
 *     → Promise.allSettled([FRED, DXY, news, calendar, COT])
 *     → merge each bundle over DEFAULT_MEMORY baseline
 *     → return complete memoryLayer
 *
 * Public API:
 *   getMemoryLayer()   → Promise<memoryLayer>
 *   refresh()          → Promise<void>  (force-bypass all caches)
 *   getStatus()        → AggregatorStatus  (per-service live/cached/stub)
 *
 * Never throws. Always returns a complete memoryLayer object.
 *
 * V4.3 Data Integration | STEP 5
 */

'use strict';

import * as FREDService    from './FREDService.js';
import * as FinnhubService from './FinnhubService.js';
import * as COTService     from './COTService.js';
import * as DataProvider   from '../core/DataProvider.js';

// ─────────────────────────────────────────────
// DEFAULT_MEMORY BASELINE
// Must match CommitteeOrchestrator DEFAULT_MEMORY exactly.
// MemoryAggregator merges real data ON TOP of these defaults.
// Fields not provided by any service fall back to these values.
// ─────────────────────────────────────────────

const DEFAULT_MEMORY = Object.freeze({
  // Central bank
  cb_fed_stance_score:   60,
  cb_ecb_stance_score:    0,
  // COT positioning
  cot_net_position:       0,
  cot_z_score_52w:        0,
  cot_signal:         'neutral',
  cot_trend_3w:       'flat',
  cot_extreme:            false,
  // News sentiment
  news_net_score_24h:    30,
  news_net_score_7d:     15,
  news_net_score_30d:     5,
  narrative_shift:        false,
  // Macro context
  us_de_spread:           2.0,
  dxy_trend:          'rising',
  dxy_level:            104.5,
  policy_momentum:        1,
  // Risk context
  vix_level:             15.0,
  upcoming_event_risk:    false,
  event_within_hours:     null,
  event_impact_level:  'low',
  // Data quality
  data_source:         'stub',
});

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────

let _lastStatus = null;
let _lastFetchedAt = 0;

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Returns a complete memoryLayer object for CommitteeOrchestrator.
 * Runs all data services in parallel; each degrades independently.
 * Never throws.
 *
 * @returns {Promise<memoryLayer>}
 */
export async function getMemoryLayer() {
  return _fetchAll(false);
}

/**
 * Force-refreshes all data services, bypassing their caches.
 * Useful after a Settings save or manual user trigger.
 * Never throws.
 *
 * @returns {Promise<void>}
 */
export async function refresh() {
  FREDService.clearCache?.();
  FinnhubService.clearCache?.();
  COTService.clearCache?.();
  await _fetchAll(true);
}

/**
 * Returns the status of each data service from the last fetch cycle.
 *
 * @returns {AggregatorStatus}
 */
export function getStatus() {
  return _lastStatus ?? _emptyStatus();
}

// ─────────────────────────────────────────────
// CORE AGGREGATION
// ─────────────────────────────────────────────

async function _fetchAll(forceRefresh) {
  // Run all services in parallel — Promise.allSettled never throws
  const [fredResult, dxyResult, newsResult, calResult, cotResult] = await Promise.allSettled([
    _safeFetch(() => FREDService.getMacroBundle()),
    _safeFetch(() => _getDXYBundle()),
    _safeFetch(() => FinnhubService.getNewsBundle()),
    _safeFetch(() => FinnhubService.getCalendarBundle()),
    _safeFetch(() => COTService.getCOTBundle()),
  ]);

  const fred     = fredResult.status     === 'fulfilled' ? fredResult.value     : null;
  const dxy      = dxyResult.status      === 'fulfilled' ? dxyResult.value      : null;
  const news     = newsResult.status     === 'fulfilled' ? newsResult.value     : null;
  const calendar = calResult.status      === 'fulfilled' ? calResult.value      : null;
  const cot      = cotResult.status      === 'fulfilled' ? cotResult.value      : null;

  // Merge all bundles over DEFAULT_MEMORY (real data overwrites defaults field by field)
  const merged = {
    ...DEFAULT_MEMORY,
    ..._pickFREDFields(fred),
    ..._pickDXYFields(dxy),
    ..._pickNewsFields(news),
    ..._pickCalendarFields(calendar),
    ..._pickCOTFields(cot),
  };

  // Compute overall data_source (worst-case wins)
  merged.data_source = _computeOverallSource([fred, dxy, news, calendar, cot]);

  // Update status for Settings display
  _lastStatus = _buildStatus(fred, dxy, news, calendar, cot);
  _lastFetchedAt = Date.now();

  return merged;
}

async function _safeFetch(fn) {
  try { return await fn(); } catch (err) {
    console.warn('[MemoryAggregator] Service error:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// DXY VIA DATA PROVIDER
// ─────────────────────────────────────────────

async function _getDXYBundle() {
  const [priceResult, candlesResult] = await Promise.allSettled([
    DataProvider.getDXYPrice(),
    DataProvider.getDXYCandles(30),
  ]);

  const dxyPrice   = priceResult.status   === 'fulfilled' ? priceResult.value   : null;
  const dxyCandles = candlesResult.status === 'fulfilled' ? candlesResult.value : null;

  if (!dxyPrice?.price) return null;

  const trend = (dxyCandles?.candles?.length >= 20)
    ? DataProvider.computeDXYTrend(dxyCandles.candles)
    : DEFAULT_MEMORY.dxy_trend;

  return {
    dxy_level:   parseFloat(dxyPrice.price.toFixed(3)),
    dxy_trend:   trend,
    data_source: dxyPrice.source ?? 'cached',
    fetched_at:  Date.now(),
  };
}

// ─────────────────────────────────────────────
// FIELD EXTRACTORS
// Each picks only the fields it is responsible for.
// Returns {} if bundle is null (falls back to DEFAULT_MEMORY).
// ─────────────────────────────────────────────

function _pickFREDFields(fred) {
  if (!fred) return {};
  const src = fred.data_source;
  const out = {};

  if (fred.cb_fed_stance_score  !== undefined) out.cb_fed_stance_score  = fred.cb_fed_stance_score;
  if (fred.cb_ecb_stance_score  !== undefined) out.cb_ecb_stance_score  = fred.cb_ecb_stance_score;
  if (fred.us_de_spread         !== undefined) out.us_de_spread         = fred.us_de_spread;
  if (fred.policy_momentum      !== undefined) out.policy_momentum      = fred.policy_momentum;
  if (fred.gdp_us_qoq           !== undefined) out.gdp_us_qoq           = fred.gdp_us_qoq;
  if (fred.gdp_eu_qoq           !== undefined) out.gdp_eu_qoq           = fred.gdp_eu_qoq;
  if (fred.cpi_us_yoy           !== undefined) out.cpi_us_yoy           = fred.cpi_us_yoy;
  if (fred.cpi_eu_yoy           !== undefined) out.cpi_eu_yoy           = fred.cpi_eu_yoy;
  if (fred.vix_level            !== undefined) out.vix_level            = fred.vix_level;
  if (fred.unemployment_us      !== undefined) out.unemployment_us      = fred.unemployment_us;
  if (fred.unemployment_eu      !== undefined) out.unemployment_eu      = fred.unemployment_eu;

  return out;
}

function _pickDXYFields(dxy) {
  if (!dxy) return {};
  const out = {};
  if (dxy.dxy_level !== undefined) out.dxy_level = dxy.dxy_level;
  if (dxy.dxy_trend !== undefined) out.dxy_trend = dxy.dxy_trend;
  return out;
}

function _pickNewsFields(news) {
  if (!news) return {};
  const out = {};
  if (news.news_net_score_24h        !== undefined) out.news_net_score_24h        = news.news_net_score_24h;
  if (news.news_net_score_7d         !== undefined) out.news_net_score_7d         = news.news_net_score_7d;
  if (news.news_net_score_30d        !== undefined) out.news_net_score_30d        = news.news_net_score_30d;
  if (news.headline_count_24h        !== undefined) out.headline_count_24h        = news.headline_count_24h;
  if (news.high_impact_count_24h     !== undefined) out.high_impact_count_24h     = news.high_impact_count_24h;
  if (news.narrative_shift           !== undefined) out.narrative_shift           = news.narrative_shift;
  if (news.narrative_shift_magnitude !== undefined) out.narrative_shift_magnitude = news.narrative_shift_magnitude;
  if (news.dominant_theme            !== undefined) out.dominant_theme            = news.dominant_theme;
  if (news.secondary_theme           !== undefined) out.secondary_theme           = news.secondary_theme;
  if (news.data_age_hours            !== undefined) out.data_age_hours            = news.data_age_hours;
  if (news.news_blackout             !== undefined) out.news_blackout             = news.news_blackout;
  return out;
}

function _pickCalendarFields(calendar) {
  if (!calendar) return {};
  const out = {};
  if (calendar.upcoming_event_risk !== undefined) out.upcoming_event_risk = calendar.upcoming_event_risk;
  if (calendar.event_within_hours  !== undefined) out.event_within_hours  = calendar.event_within_hours;
  if (calendar.event_impact_level  !== undefined) out.event_impact_level  = calendar.event_impact_level;
  // news_blackout from calendar is secondary; news blackout from NewsAnalyst takes precedence
  if (calendar.news_blackout && !out.news_blackout) out.news_blackout = calendar.news_blackout;
  return out;
}

function _pickCOTFields(cot) {
  if (!cot) return {};
  const out = {};
  if (cot.cot_net_position  !== undefined) out.cot_net_position  = cot.cot_net_position;
  if (cot.cot_z_score_52w   !== undefined) out.cot_z_score_52w   = cot.cot_z_score_52w;
  if (cot.cot_z_score_26w   !== undefined) out.cot_z_score_26w   = cot.cot_z_score_26w;
  if (cot.cot_signal        !== undefined) out.cot_signal        = cot.cot_signal;
  if (cot.cot_trend_3w      !== undefined) out.cot_trend_3w      = cot.cot_trend_3w;
  if (cot.cot_extreme       !== undefined) out.cot_extreme       = cot.cot_extreme;
  if (cot.cot_change_weekly !== undefined) out.cot_change_weekly = cot.cot_change_weekly;
  if (cot.cot_change_4week  !== undefined) out.cot_change_4week  = cot.cot_change_4week;
  if (cot.data_age_days     !== undefined) out.data_age_days     = cot.data_age_days;
  return out;
}

// ─────────────────────────────────────────────
// DATA SOURCE AGGREGATION
// ─────────────────────────────────────────────

/**
 * Worst-case wins: stub > stale > cached > live.
 */
function _computeOverallSource(bundles) {
  const sources = bundles
    .filter(Boolean)
    .map(b => b.data_source ?? 'stub');

  if (sources.includes('stub'))   return 'stub';
  if (sources.includes('stale'))  return 'stale';
  if (sources.includes('cached')) return 'cached';
  if (sources.includes('live'))   return 'live';
  return 'stub';
}

// ─────────────────────────────────────────────
// STATUS BUILDER
// ─────────────────────────────────────────────

function _buildStatus(fred, dxy, news, calendar, cot) {
  return {
    fred: {
      status:       fred?.data_source ?? 'missing',
      fetched_at:   fred?.fetched_at  ?? 0,
      vix:          fred?.vix_level   ?? null,
      spread:       fred?.us_de_spread ?? null,
    },
    dxy: {
      status:     dxy?.data_source ?? 'missing',
      price:      dxy?.dxy_level   ?? null,
      trend:      dxy?.dxy_trend   ?? null,
      fetched_at: dxy?.fetched_at  ?? 0,
    },
    news: {
      status:     news?.data_source         ?? 'missing',
      score_24h:  news?.news_net_score_24h  ?? null,
      count_24h:  news?.headline_count_24h  ?? null,
      fetched_at: news?.fetched_at          ?? 0,
    },
    calendar: {
      status:           calendar?.data_source        ?? 'missing',
      next_event_hours: calendar?.event_within_hours ?? null,
      event_risk:       calendar?.upcoming_event_risk ?? false,
      fetched_at:       calendar?.fetched_at         ?? 0,
    },
    cot: {
      status:      cot?.data_source    ?? 'missing',
      z_score:     cot?.cot_z_score_52w ?? null,
      signal:      cot?.cot_signal     ?? null,
      report_date: cot?.report_date    ?? null,
      fetched_at:  cot?.fetched_at     ?? 0,
    },
    last_aggregated: _lastFetchedAt,
  };
}

function _emptyStatus() {
  return {
    fred:     { status: 'not_fetched' },
    dxy:      { status: 'not_fetched' },
    news:     { status: 'not_fetched' },
    calendar: { status: 'not_fetched' },
    cot:      { status: 'not_fetched' },
    last_aggregated: 0,
  };
}

// ─────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────

/**
 * @typedef {Object} AggregatorStatus
 * @property {{ status, fetched_at, vix, spread }}               fred
 * @property {{ status, price, trend, fetched_at }}               dxy
 * @property {{ status, score_24h, count_24h, fetched_at }}       news
 * @property {{ status, next_event_hours, event_risk, fetched_at }} calendar
 * @property {{ status, z_score, signal, report_date, fetched_at }} cot
 * @property {number} last_aggregated
 */
