/**
 * ONETO EUR/USD AI Tool — COTService
 * =====================================
 * CFTC Commitments of Traders (COT) data client.
 * Fetches the weekly Financial Futures COT report and extracts
 * EUR/USD non-commercial positioning for PositioningAnalyst.
 *
 * Source: https://www.cftc.gov/dea/futures/deacmesf.zip (public, no key)
 * CFTC.gov supports CORS — direct browser fetch works.
 *
 * Target row: Market_and_Exchange_Names contains "EURO FX"
 * Target columns:
 *   NonComm_Positions_Long_All  → non-commercial longs
 *   NonComm_Positions_Short_All → non-commercial shorts
 *   net = long - short
 *
 * Z-score computation (52-week rolling):
 *   z = (current_net - mean_52w) / std_52w
 *   Signal: z > 2 → extreme_long (contrarian SELL)
 *           z < -2 → extreme_short (contrarian BUY)
 *
 * History is maintained in localStorage (rolling 52-week array).
 * Each weekly entry is appended; oldest entries pruned beyond 55 weeks.
 *
 * Cache strategy (V4.3 spec):
 *   7d memory / 7d localStorage (weekly release)
 *
 * Never throws. Always returns a bundle (live, cached, or stub).
 *
 * V4.3 Data Integration | STEP 4
 */

'use strict';

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

// Primary: unzipped text file (no decompression needed)
const CFTC_TXT_URL  = 'https://www.cftc.gov/dea/futures/deacmesf.txt';
// Fallback: current week zip
const CFTC_ZIP_URL  = 'https://www.cftc.gov/dea/futures/deacmesf.zip';

const STORAGE_KEY_BUNDLE  = 'oneto_cot_v1';
const STORAGE_KEY_HISTORY = 'oneto_cot_history_v1';
const MAX_HISTORY_WEEKS   = 55;   // keep a little over 52 for z-score buffer

const TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days

// ─────────────────────────────────────────────
// IN-MEMORY CACHE
// ─────────────────────────────────────────────

let _memCache = { bundle: null, fetchedAt: 0 };

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Returns the CFTC COT bundle for EUR/USD positioning.
 * Never throws.
 *
 * @returns {Promise<COTBundle>}
 */
export async function getCOTBundle() {
  // 1. Memory cache
  if (_memCache.bundle && Date.now() - _memCache.fetchedAt < TTL_MS) {
    return { ..._memCache.bundle, data_source: 'cached' };
  }

  // 2. localStorage cache
  const stored = _loadBundle();
  if (stored?.bundle && Date.now() - stored.fetchedAt < TTL_MS) {
    _memCache = { bundle: stored.bundle, fetchedAt: stored.fetchedAt };
    return { ...stored.bundle, data_source: 'cached' };
  }

  // 3. Live fetch
  try {
    const csv    = await _fetchCSV();
    const row    = _parseEURRow(csv);
    if (!row) throw new Error('EURO FX row not found in COT data');

    const net    = row.longPos - row.shortPos;
    const history = _appendHistory(net, row.reportDate);
    const bundle  = _computeBundle(net, row, history);

    _memCache = { bundle, fetchedAt: Date.now() };
    _saveBundle(bundle);
    return { ...bundle, data_source: 'live' };

  } catch (err) {
    console.warn('[COTService] Fetch failed:', err.message);
    // Return stale cache if available
    if (stored?.bundle) return { ...stored.bundle, data_source: 'stale' };
    return _stubBundle();
  }
}

/**
 * Returns the stored 52-week history array.
 * @returns {COTWeek[]}
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

/**
 * Clears all COT caches and history.
 */
export function clearCache() {
  _memCache = { bundle: null, fetchedAt: 0 };
  try { localStorage.removeItem(STORAGE_KEY_BUNDLE);  } catch (_) {}
  try { localStorage.removeItem(STORAGE_KEY_HISTORY); } catch (_) {}
}

// ─────────────────────────────────────────────
// CSV FETCHING
// ─────────────────────────────────────────────

async function _fetchCSV() {
  // Try plain text first (no decompression needed)
  try {
    const res = await _fetchWithTimeout(CFTC_TXT_URL, 15000);
    if (res.ok) {
      const text = await res.text();
      if (text.includes('EURO FX')) return text;
    }
  } catch (_) { /* fall through to zip */ }

  // Fallback: fetch zip and decompress using DecompressionStream API
  const res = await _fetchWithTimeout(CFTC_ZIP_URL, 20000);
  if (!res.ok) throw new Error(`CFTC HTTP ${res.status}`);

  // Use DecompressionStream if available (modern browsers)
  if (typeof DecompressionStream !== 'undefined') {
    const blob    = await res.blob();
    const buffer  = await blob.arrayBuffer();
    // zip header: find the local file header and decompress content
    const text = await _decompressZip(buffer);
    return text;
  }

  // Last resort: try to read the raw response as text (may work for some servers)
  throw new Error('DecompressionStream API not available and text URL failed');
}

/**
 * Minimal zip reader for single-file archives (CFTC uses single-file zips).
 * Finds local file header (PK\x03\x04), extracts compressed data, inflates.
 */
async function _decompressZip(buffer) {
  const bytes  = new Uint8Array(buffer);
  // Find local file header signature: 50 4B 03 04
  let offset = 0;
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x50 && bytes[i+1] === 0x4B && bytes[i+2] === 0x03 && bytes[i+3] === 0x04) {
      offset = i;
      break;
    }
  }
  // Local file header is 30 + filename_len + extra_len bytes
  const fileNameLen  = bytes[offset + 26] | (bytes[offset + 27] << 8);
  const extraLen     = bytes[offset + 28] | (bytes[offset + 29] << 8);
  const compression  = bytes[offset + 8]  | (bytes[offset + 9]  << 8);
  const compSize     = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16);

  const dataOffset   = offset + 30 + fileNameLen + extraLen;
  const compressedData = bytes.slice(dataOffset, dataOffset + compSize);

  if (compression === 0) {
    // Stored (no compression)
    return new TextDecoder('latin1').decode(compressedData);
  }

  // Deflate
  const ds     = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(compressedData);
  writer.close();

  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
  return new TextDecoder('latin1').decode(result);
}

// ─────────────────────────────────────────────
// CSV PARSING
// ─────────────────────────────────────────────

/**
 * Parses COT CSV text and extracts the EURO FX row.
 * CFTC CSV uses comma delimiters; first row is header.
 */
function _parseEURRow(csvText) {
  const lines = csvText.split('\n');
  if (!lines.length) return null;

  // Parse header to find column indices by name
  const header = _parseCSVLine(lines[0]);
  const idx = {
    name:       _findCol(header, ['Market_and_Exchange_Names', 'Market and Exchange Names']),
    date:       _findCol(header, ['As_of_Date_In_Form_YYMMDD', 'Report_Date_as_YYYY-MM-DD']),
    longPos:    _findCol(header, ['NonComm_Positions_Long_All',  'Noncommercial Long']),
    shortPos:   _findCol(header, ['NonComm_Positions_Short_All', 'Noncommercial Short']),
  };

  if (idx.name < 0 || idx.longPos < 0 || idx.shortPos < 0) {
    // Try positional fallback for legacy format
    return _parseEURRowPositional(lines);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = _parseCSVLine(line);
    if (cols[idx.name] && cols[idx.name].toUpperCase().includes('EURO FX')) {
      const dateRaw = cols[idx.date] ?? '';
      return {
        longPos:    parseInt(cols[idx.longPos],  10) || 0,
        shortPos:   parseInt(cols[idx.shortPos], 10) || 0,
        reportDate: _normalizeDate(dateRaw),
      };
    }
  }
  return null;
}

/**
 * Positional fallback: CFTC legacy format has EURO FX at known column positions.
 * col 8 = NonComm Long, col 9 = NonComm Short, col 2 = date (YYMMDD)
 */
function _parseEURRowPositional(lines) {
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.toUpperCase().includes('EURO FX')) continue;
    const cols = _parseCSVLine(line);
    return {
      longPos:    parseInt(cols[8],  10) || 0,
      shortPos:   parseInt(cols[9],  10) || 0,
      reportDate: _normalizeDate(cols[2] ?? ''),
    };
  }
  return null;
}

function _findCol(headers, names) {
  for (const name of names) {
    const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function _parseCSVLine(line) {
  // Handle quoted fields with commas
  const result = [];
  let inQuote = false, current = '';
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function _normalizeDate(raw) {
  // YYMMDD → YYYY-MM-DD, or YYYY-MM-DD passthrough
  if (!raw) return new Date().toISOString().slice(0, 10);
  const s = raw.replace(/[^0-9]/g, '');
  if (s.length === 6) {
    const yy = parseInt(s.slice(0, 2));
    const mm = s.slice(2, 4);
    const dd = s.slice(4, 6);
    const yyyy = yy >= 50 ? `19${s.slice(0,2)}` : `20${s.slice(0,2)}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (s.length === 8) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// Z-SCORE + BUNDLE COMPUTATION
// ─────────────────────────────────────────────

/**
 * Appends current week's net position to history.
 * Prunes to MAX_HISTORY_WEEKS. Returns updated history.
 */
function _appendHistory(net, reportDate) {
  const history = getHistory();
  // Avoid duplicate entries for same report date
  const exists = history.some(h => h.date === reportDate);
  if (!exists) {
    history.push({ date: reportDate, net });
    if (history.length > MAX_HISTORY_WEEKS) {
      history.splice(0, history.length - MAX_HISTORY_WEEKS);
    }
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (_) {}
  }
  return history;
}

function _computeBundle(currentNet, row, history) {
  const nets      = history.map(h => h.net);
  const z52w      = _zScore(currentNet, nets);
  const z26w      = history.length >= 26 ? _zScore(currentNet, nets.slice(-26)) : z52w;
  const trend3w   = _trend3w(history);
  const change1w  = history.length >= 2 ? currentNet - history[history.length - 2].net : 0;
  const change4w  = history.length >= 5 ? currentNet - history[history.length - 5].net : 0;

  const ageMs    = Date.now() - new Date(row.reportDate).getTime();
  const ageDays  = Math.round(ageMs / (24 * 3600 * 1000));

  return {
    cot_net_position:  currentNet,
    cot_z_score_52w:   parseFloat(z52w.toFixed(2)),
    cot_z_score_26w:   parseFloat(z26w.toFixed(2)),
    cot_signal:        _deriveSignal(z52w),
    cot_trend_3w:      trend3w,
    cot_extreme:       Math.abs(z52w) > 2.0,
    cot_change_weekly: change1w,
    cot_change_4week:  change4w,
    data_age_days:     ageDays,
    report_date:       row.reportDate,
    fetched_at:        Date.now(),
  };
}

function _zScore(value, series) {
  if (!series || series.length < 4) return 0;
  const mean = series.reduce((s, v) => s + v, 0) / series.length;
  const std  = Math.sqrt(series.reduce((s, v) => s + (v - mean) ** 2, 0) / series.length);
  if (std === 0) return 0;
  return (value - mean) / std;
}

function _deriveSignal(z) {
  if (z >  2.0) return 'extreme_long';
  if (z >  1.0) return 'long';
  if (z < -2.0) return 'extreme_short';
  if (z < -1.0) return 'short';
  return 'neutral';
}

function _trend3w(history) {
  if (history.length < 3) return 'flat';
  const recent = history.slice(-3).map(h => h.net);
  const slope1 = recent[2] - recent[1];
  const slope2 = recent[1] - recent[0];
  if (slope1 > 5000 && slope2 > 0) return 'increasing';
  if (slope1 < -5000 && slope2 < 0) return 'decreasing';
  return 'flat';
}

// ─────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────

function _loadBundle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUNDLE);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function _saveBundle(bundle) {
  try {
    localStorage.setItem(STORAGE_KEY_BUNDLE, JSON.stringify({
      bundle,
      fetchedAt: Date.now(),
    }));
  } catch (_) {}
}

function _stubBundle() {
  return {
    cot_net_position:  0,
    cot_z_score_52w:   0,
    cot_z_score_26w:   0,
    cot_signal:        'neutral',
    cot_trend_3w:      'flat',
    cot_extreme:       false,
    cot_change_weekly: 0,
    cot_change_4week:  0,
    data_age_days:     7,
    report_date:       new Date().toISOString().slice(0, 10),
    fetched_at:        0,
    data_source:       'stub',
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function _fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      mode:   'cors',
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────

/**
 * @typedef {Object} COTBundle
 * @property {number}  cot_net_position     non-commercial net (long - short)
 * @property {number}  cot_z_score_52w      z-score vs 52-week history
 * @property {number}  cot_z_score_26w      z-score vs 26-week history
 * @property {string}  cot_signal           extreme_long|long|neutral|short|extreme_short
 * @property {string}  cot_trend_3w         increasing|decreasing|flat
 * @property {boolean} cot_extreme          |z| > 2.0
 * @property {number}  cot_change_weekly    week-over-week net delta
 * @property {number}  cot_change_4week     4-week cumulative delta
 * @property {number}  data_age_days        days since CFTC report date
 * @property {string}  report_date          ISO date string
 * @property {number}  fetched_at           UNIX ms
 * @property {string}  data_source          live|cached|stale|stub
 */

/**
 * @typedef {Object} COTWeek
 * @property {string} date   ISO date
 * @property {number} net    non-commercial net position
 */
