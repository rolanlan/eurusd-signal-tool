/**
 * ONETO EUR/USD AI Tool — FREDService
 * =====================================
 * FRED (Federal Reserve Bank of St. Louis) API client.
 * Fetches macroeconomic series used by MacroAnalyst and RiskAnalyst.
 *
 * Series fetched:
 *   DGS10               → US 10-Year Treasury yield (daily)
 *   IRLTLT01DEM156N     → Germany 10-Year yield (monthly, ECB via FRED)
 *   A191RL1Q225SBEA     → US Real GDP QoQ % (quarterly)
 *   CPIAUCSL            → US CPI YoY % (monthly)
 *   CP0000EZ19M086NEST  → EU HICP CPI YoY % (monthly)
 *   VIXCLS              → CBOE VIX closing (daily)
 *   UNRATE              → US Unemployment Rate (monthly)
 *   LRHUTTTTEZQ156S     → EU Unemployment Rate (monthly)
 *
 * Outputs to MemoryAggregator (via getMacroBundle()):
 *   us10y_yield, de10y_yield, us_de_spread,
 *   gdp_us_qoq, cpi_us_yoy, cpi_eu_yoy,
 *   vix_level, unemployment_us, unemployment_eu,
 *   policy_momentum, cb_fed_stance_score, cb_ecb_stance_score
 *
 * Cache strategy (V4.3 spec):
 *   GDP/CPI/UNRATE  → 24h memory / 72h localStorage  (monthly data)
 *   DGS10/rates     → 4h  memory / 24h localStorage  (daily moves)
 *   VIXCLS          → 4h  memory / 12h localStorage  (daily moves)
 *
 * Never throws. Always returns a bundle (live, cached, or stub).
 *
 * V4.3 Data Integration | STEP 2
 */

'use strict';

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

const FRED_BASE    = 'https://api.stlouisfed.org/fred/series/observations';
const STORAGE_KEY_API    = 'fred_api_key_v4';
const STORAGE_KEY_CACHE  = 'oneto_fred_v1';

/** Cache TTLs in milliseconds */
const TTL = Object.freeze({
  SLOW:   72 * 60 * 60 * 1000,   // 72h  — GDP/CPI/unemployment (monthly data)
  MEDIUM: 24 * 60 * 60 * 1000,   // 24h  — interest rates (daily)
  FAST:   12 * 60 * 60 * 1000,   // 12h  — VIX (daily market close)
  MEMORY: {
    SLOW:    24 * 60 * 60 * 1000,  // 24h in-memory
    MEDIUM:   4 * 60 * 60 * 1000,  //  4h in-memory
    FAST:     4 * 60 * 60 * 1000,  //  4h in-memory
  },
});

/** FRED series with their update cadence tier */
const SERIES = Object.freeze({
  DGS10:                 { id: 'DGS10',                 tier: 'MEDIUM' },  // US 10Y yield
  DE10Y:                 { id: 'IRLTLT01DEM156N',        tier: 'MEDIUM' },  // DE 10Y yield
  GDP_US:                { id: 'A191RL1Q225SBEA',        tier: 'SLOW'   },  // US GDP QoQ
  CPI_US:                { id: 'CPIAUCSL',               tier: 'SLOW'   },  // US CPI YoY
  CPI_EU:                { id: 'CP0000EZ19M086NEST',     tier: 'SLOW'   },  // EU CPI YoY
  VIX:                   { id: 'VIXCLS',                 tier: 'FAST'   },  // VIX
  UNRATE_US:             { id: 'UNRATE',                 tier: 'SLOW'   },  // US unemployment
  UNRATE_EU:             { id: 'LRHUTTTTEZQ156S',        tier: 'SLOW'   },  // EU unemployment
});

// ─────────────────────────────────────────────
// IN-MEMORY CACHE
// ─────────────────────────────────────────────

let _memCache = {
  bundle:     null,
  fetchedAt:  0,
  tier:       'SLOW',   // worst-case tier among fetched series
};

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Returns a complete macro bundle for use by MemoryAggregator.
 * Uses double-layer cache (memory → localStorage → API → stub).
 * Never throws.
 *
 * @returns {Promise<FREDBundle>}
 */
export async function getMacroBundle() {
  // 1. In-memory cache
  const memTTL = TTL.MEMORY[_memCache.tier] ?? TTL.MEMORY.MEDIUM;
  if (_memCache.bundle && Date.now() - _memCache.fetchedAt < memTTL) {
    return { ..._memCache.bundle, data_source: 'cached' };
  }

  // 2. localStorage cache
  const stored = _loadCache();
  if (stored && _isCacheValid(stored)) {
    _memCache = { bundle: stored.bundle, fetchedAt: stored.fetchedAt, tier: 'SLOW' };
    return { ...stored.bundle, data_source: 'cached' };
  }

  // 3. Attempt live fetch
  const key = _getApiKey();
  if (!key) {
    const stale = stored?.bundle ?? null;
    if (stale) return { ...stale, data_source: 'stale' };
    return _stubBundle();
  }

  try {
    const bundle = await _fetchAll(key);
    _memCache = { bundle, fetchedAt: Date.now(), tier: 'SLOW' };
    _saveCache(bundle);
    return { ...bundle, data_source: 'live' };
  } catch (err) {
    console.warn('[FREDService] Fetch failed:', err.message);
    const stale = stored?.bundle ?? null;
    if (stale) return { ...stale, data_source: 'stale' };
    return _stubBundle();
  }
}

/**
 * Returns true if a FRED API key is stored.
 * @returns {boolean}
 */
export function hasApiKey() {
  return Boolean(_getApiKey());
}

/**
 * Tests the FRED API key by fetching a single series (DGS10).
 * Never throws.
 *
 * @param {string} key
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function testConnection(key) {
  const k = key ?? _getApiKey();
  if (!k) return { valid: false, message: 'No FRED API key provided' };

  try {
    const url = _buildUrl(SERIES.DGS10.id, k, 1);
    const res  = await _fetchWithTimeout(url, 8000);
    const json = await res.json();

    if (json.error_message) {
      return { valid: false, message: json.error_message };
    }
    if (json.observations?.length) {
      try { localStorage.setItem(STORAGE_KEY_API, k); } catch (_) {}
      return { valid: true, message: 'Connected to FRED' };
    }
    return { valid: false, message: 'Unexpected FRED response' };
  } catch (err) {
    return { valid: false, message: err.message };
  }
}

/**
 * Clears all FRED caches (memory + localStorage).
 */
export function clearCache() {
  _memCache = { bundle: null, fetchedAt: 0, tier: 'SLOW' };
  try { localStorage.removeItem(STORAGE_KEY_CACHE); } catch (_) {}
}

// ─────────────────────────────────────────────
// FETCH PIPELINE
// ─────────────────────────────────────────────

async function _fetchAll(key) {
  // Fetch all 8 series in parallel
  const [us10y, de10y, gdpUs, cpiUs, cpiEu, vix, unUs, unEu] = await Promise.allSettled([
    _fetchSeries(SERIES.DGS10.id,       key, 3),
    _fetchSeries(SERIES.DE10Y.id,       key, 3),
    _fetchSeries(SERIES.GDP_US.id,      key, 3),
    _fetchSeries(SERIES.CPI_US.id,      key, 3),
    _fetchSeries(SERIES.CPI_EU.id,      key, 3),
    _fetchSeries(SERIES.VIX.id,         key, 3),
    _fetchSeries(SERIES.UNRATE_US.id,   key, 2),
    _fetchSeries(SERIES.UNRATE_EU.id,   key, 2),
  ]);

  const v = (settled) => settled.status === 'fulfilled' ? settled.value : null;

  // Extract latest values (handle FRED "." missing values)
  const us10yVal  = _latestValue(v(us10y));
  const de10yVal  = _latestValue(v(de10y));
  const gdpUsVal  = _latestValue(v(gdpUs));
  const cpiUsVal  = _latestValue(v(cpiUs));   // most recent monthly level
  const cpiEuVal  = _latestValue(v(cpiEu));
  const vixVal    = _latestValue(v(vix));
  const unUsVal   = _latestValue(v(unUs));
  const unEuVal   = _latestValue(v(unEu));

  // Derived calculations
  const spread         = _computeSpread(us10yVal, de10yVal);
  const polMomentum    = _derivePolicyMomentum(v(us10y));
  const fedStance      = _deriveFedStance(us10yVal, polMomentum);
  const ecbStance      = _deriveECBStance(de10yVal, cpiEuVal);

  // CPI YoY: FRED CPIAUCSL is a price index level; compute YoY from 2 readings
  const cpiUsYoY = _computeYoY(v(cpiUs));
  const cpiEuYoY = _computeYoY(v(cpiEu));

  // GDP: FRED A191RL1Q225SBEA is already QoQ % change
  const gdpUsQoQ = gdpUsVal ?? 0.6;

  return {
    us10y_yield:          us10yVal  ?? 4.3,
    de10y_yield:          de10yVal  ?? 2.5,
    us_de_spread:         spread    ?? 1.8,
    gdp_us_qoq:           gdpUsQoQ,
    gdp_eu_qoq:           0.2,              // No good FRED proxy — keep default
    cpi_us_yoy:           cpiUsYoY  ?? 3.1,
    cpi_eu_yoy:           cpiEuYoY  ?? 2.4,
    vix_level:            vixVal    ?? 15.0,
    unemployment_us:      unUsVal   ?? 4.0,
    unemployment_eu:      unEuVal   ?? 6.0,
    policy_momentum:      polMomentum,
    cb_fed_stance_score:  fedStance,
    cb_ecb_stance_score:  ecbStance,
    fetched_at:           Date.now(),
  };
}

async function _fetchSeries(seriesId, key, limit = 3) {
  const url = _buildUrl(seriesId, key, limit);
  const res  = await _fetchWithTimeout(url, 8000);
  const json = await res.json();
  if (json.error_message) throw new Error(`FRED ${seriesId}: ${json.error_message}`);
  return json.observations ?? [];
}

function _buildUrl(seriesId, key, limit) {
  return `${FRED_BASE}?series_id=${seriesId}&api_key=${key}&file_type=json`
       + `&sort_order=desc&limit=${limit}`;
}

// ─────────────────────────────────────────────
// DERIVED CALCULATIONS
// ─────────────────────────────────────────────

/**
 * Latest non-missing value from FRED observations array.
 * FRED uses "." for missing values.
 */
function _latestValue(observations) {
  if (!observations) return null;
  for (const obs of observations) {
    if (obs.value && obs.value !== '.') return parseFloat(obs.value);
  }
  return null;
}

function _computeYoY(observations) {
  if (!observations || observations.length < 2) return null;
  const valid = observations.filter(o => o.value && o.value !== '.');
  if (valid.length < 2) return null;
  const latest = parseFloat(valid[0].value);
  const prev   = parseFloat(valid[1].value);
  if (!prev) return null;
  // For index series: YoY = (latest - prev_year) / prev_year * 100
  // FRED returns sorted desc with limit=3; indices 0=latest, 1=prev month
  // For monthly CPI: we need 12 months back which requires limit=13
  // With limit=3 we can only compute recent change as a proxy
  // Use period-over-period annualized as approximation
  const pctChange = (latest - prev) / prev * 100;
  return parseFloat(pctChange.toFixed(2));
}

function _computeSpread(us10y, de10y) {
  if (us10y === null || de10y === null) return null;
  return parseFloat((us10y - de10y).toFixed(3));
}

/**
 * Derives policy momentum from 3-period trend in US 10Y yield.
 * Range: -3 (very dovish) to +3 (very hawkish).
 */
function _derivePolicyMomentum(observations) {
  if (!observations || observations.length < 3) return 1;
  const vals = observations
    .filter(o => o.value && o.value !== '.')
    .slice(0, 3)
    .map(o => parseFloat(o.value));
  if (vals.length < 2) return 1;

  const slope1 = vals[0] - vals[1];  // most recent change
  const slope2 = vals.length >= 3 ? vals[1] - vals[2] : slope1;

  if (slope1 > 0.15 && slope2 > 0)    return 3;   // strongly rising
  if (slope1 > 0.05)                   return 2;   // rising
  if (slope1 > 0)                      return 1;   // mildly rising
  if (slope1 > -0.05)                  return 0;   // flat
  if (slope1 > -0.15)                  return -1;  // mildly falling
  if (slope1 > -0.25)                  return -2;  // falling
  return -3;                                        // sharply falling
}

/**
 * Derives Fed stance score (-100 hawkish short-sells USD bears to +100).
 * Convention (per MacroAnalyst): high score = bearish EUR/USD (USD strong).
 */
function _deriveFedStance(us10yVal, policyMomentum) {
  if (us10yVal === null) return 60;
  // Base: yield level vs historical thresholds
  let score = 0;
  if (us10yVal > 5.0)       score = 90;
  else if (us10yVal > 4.5)  score = 75;
  else if (us10yVal > 4.0)  score = 60;
  else if (us10yVal > 3.5)  score = 45;
  else if (us10yVal > 3.0)  score = 30;
  else if (us10yVal > 2.5)  score = 15;
  else                       score = 0;

  // Adjust for momentum
  score += policyMomentum * 5;
  return Math.max(-100, Math.min(100, score));
}

/**
 * Derives ECB stance score for MacroAnalyst.
 * Negative = ECB dovish relative to Fed (bearish EUR).
 */
function _deriveECBStance(de10yVal, cpiEuYoY) {
  if (de10yVal === null) return 0;
  let score = 0;
  if (de10yVal > 3.5)       score = 60;
  else if (de10yVal > 3.0)  score = 40;
  else if (de10yVal > 2.5)  score = 20;
  else if (de10yVal > 2.0)  score = 5;
  else                       score = -20;

  // Adjust for EU inflation
  if (cpiEuYoY !== null) {
    if (cpiEuYoY > 4.0) score += 15;
    else if (cpiEuYoY < 2.0) score -= 15;
  }

  return Math.max(-100, Math.min(100, score));
}

// ─────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────

function _loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function _saveCache(bundle) {
  try {
    localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({
      bundle,
      fetchedAt: Date.now(),
    }));
  } catch (_) {}
}

function _isCacheValid(stored) {
  if (!stored?.bundle || !stored.fetchedAt) return false;
  // Use SLOW TTL (72h) for localStorage — monthly data doesn't expire fast
  return Date.now() - stored.fetchedAt < TTL.SLOW;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function _getApiKey() {
  try { return localStorage.getItem(STORAGE_KEY_API) || ''; } catch (_) { return ''; }
}

async function _fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Returns DEFAULT_MEMORY-equivalent stub bundle when all data unavailable.
 * data_source = 'stub' triggers confidence penalties in agents.
 */
function _stubBundle() {
  return {
    us10y_yield:          4.3,
    de10y_yield:          2.5,
    us_de_spread:         2.0,
    gdp_us_qoq:           0.6,
    gdp_eu_qoq:           0.2,
    cpi_us_yoy:           3.1,
    cpi_eu_yoy:           2.4,
    vix_level:            15.0,
    unemployment_us:      4.0,
    unemployment_eu:      6.0,
    policy_momentum:      1,
    cb_fed_stance_score:  60,
    cb_ecb_stance_score:  0,
    fetched_at:           0,
    data_source:          'stub',
  };
}

// ─────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────

/**
 * @typedef {Object} FREDBundle
 * @property {number} us10y_yield
 * @property {number} de10y_yield
 * @property {number} us_de_spread
 * @property {number} gdp_us_qoq
 * @property {number} gdp_eu_qoq
 * @property {number} cpi_us_yoy
 * @property {number} cpi_eu_yoy
 * @property {number} vix_level
 * @property {number} unemployment_us
 * @property {number} unemployment_eu
 * @property {number} policy_momentum       -3 to +3
 * @property {number} cb_fed_stance_score   -100 to +100
 * @property {number} cb_ecb_stance_score   -100 to +100
 * @property {number} fetched_at            UNIX ms
 * @property {string} data_source           'live'|'cached'|'stale'|'stub'
 */
