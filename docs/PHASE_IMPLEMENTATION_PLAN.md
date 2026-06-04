# ONETO EUR/USD AI Tool — Phase Implementation Plan

**Version:** V4.0 | Living document  
**Rule:** Update this file after each phase is completed.  
**Last Updated:** 2026-06  

---

## Table of Contents

1. [Phase 0 — Documentation Foundation](#phase-0--documentation-foundation)
2. [Phase 1 — i18n + Utilities + Services + State](#phase-1--i18n--utilities--services--state)
3. [Phase 2 — MTF Engine + AI Committee + Regime Engine](#phase-2--mtf-engine--ai-committee--regime-engine)
4. [Phase 3 — Decision Engine + Risk Manager + Paper Trading](#phase-3--decision-engine--risk-manager--paper-trading)
5. [Phase 4 — UI Integration + Dashboard + Signal Cards](#phase-4--ui-integration--dashboard--signal-cards)
6. [Phase 5 — Supabase Integration](#phase-5--supabase-integration)
7. [Phase 6 — Memory Engines + Live API Integration](#phase-6--memory-engines--live-api-integration)
8. [Phase 7 — Learning Engine + Advanced Backtest](#phase-7--learning-engine--advanced-backtest)
9. [Phase Summary Table](#phase-summary-table)
10. [Go/No-Go Criteria for Live Trading](#gono-go-criteria-for-live-trading)
11. [Development Rules](#development-rules)

---

## Phase 0 — Documentation Foundation

**Status:** ✅ Complete  
**Complexity:** Low  
**Date Completed:** 2026-06  

### Goal
Establish all governance documents before any code is written. Make the project fully recoverable and maintainable across Claude, ChatGPT, Gemini, and future AI systems.

### Files Created
```
docs/V4_ARCHITECTURE_FREEZE.md       (~300 lines)   System architecture, all flows
docs/V4_MASTER_MANIFEST.md           (~280 lines)   Project brain, dependency tree
docs/DATABASE_SCHEMA.md              (~500 lines)   17 tables, ER diagram, indexes
docs/API_REPORT.md                   (~250 lines)   API costs, tiers, strategies
docs/DEVELOPMENT_LOG.md              (~200 lines)   Append-only history
docs/INTERFACE_CONTRACTS.md          (~350 lines)   11 frozen interface contracts
docs/PHASE_IMPLEMENTATION_PLAN.md    (~400 lines)   This file
```

### Files Modified
None

### Dependencies
None — foundation phase

### Estimated Lines
~1,500 lines of markdown

### Risks
**Low.** Pure documentation. No technical risk.

### Completion Criteria
- [x] All 7 documents approved by Rolan/ONETO
- [x] Documents saved to GitHub `/docs` folder
- [x] No code written until Phase 1 approval granted

---

## Phase 1 — i18n + Utilities + Services + State

**Status:** ⏳ Pending (approved, ready to start)  
**Complexity:** Low-Medium  
**Prerequisite:** Phase 0 approved  

### Goal
Build the foundation layer that all engines, agents, and components depend on. This phase produces no visible UI. It is pure infrastructure — tested in isolation before anything is built on top of it.

### Files Created (10 new files)

```
src/i18n/en.json                  (~180 lines)
  Purpose: English source of truth for all user-facing strings
  Key namespaces: nav, signal, signal.strength, risk, agents,
                  regime, decision, mtf, paper, settings,
                  calendar, news, errors, common
  Coverage: Every string that appears anywhere in the UI

src/i18n/zh.json                  (~180 lines)
  Purpose: Chinese display layer — mirror of en.json
  Rule: Every key in en.json must have a corresponding key here
  Translation quality: Professional financial Chinese

src/i18n/i18n.js                  (~60 lines)
  Purpose: Runtime language module
  Exports: t(key, params?), setLang(lang), getLang(),
           formatPrice(n), formatPips(n), formatPct(n)
  Behavior: Falls back to EN if ZH key missing
  Storage: language preference in localStorage

src/utils/indicators.js           (~200 lines)
  Purpose: Pure math functions for technical analysis
  Exports: calcMA(data, period), calcEMA(data, period),
           calcRSI(data, period), calcMACD(data),
           calcBB(data, period, stddev),
           calcATR(candles, period), calcADX(candles, period)
  Rule: No side effects. No imports. Pure functions only.
  Test: Unit-testable without any browser environment

src/utils/formatters.js           (~80 lines)
  Purpose: Locale-aware display formatting
  Exports: formatPrice(n), formatPips(n), formatPct(n),
           formatLot(n), formatUSD(n), formatDate(ts),
           formatDuration(minutes)
  Depends on: i18n.js (for locale-specific formats)

src/utils/validators.js           (~80 lines)
  Purpose: Input validation and signal validation
  Exports: validateSignal(result), validateTradeInput(input),
           validateAccountProfile(profile), isValidPrice(n),
           isValidPips(n), isValidLot(n)
  Rule: No side effects. Returns { valid: boolean, errors: string[] }

src/services/SimDataService.js    (~100 lines)
  Purpose: Simulated candle generator — fallback of last resort
  Exports: getCandles(count, basePrice, volatility, intervalHours)
  Behavior: Generates random-walk EUR/USD OHLCV data
           Slight bearish drift (Math.random() - 0.47)
           Time starts count×intervalHours ago from now()
  Rule: Always returns valid candles. Never returns empty array.

src/services/TwelveDataService.js (~180 lines)
  Purpose: Twelve Data API client with caching and fallback
  Exports: getPrice(symbol), getCandles(symbol, interval, count),
           testApiKey(key), getApiKeyStatus()
  Caching: Price 30s TTL · 1H candles 4min · 4H candles 4min · 1D 60min
  Fallback chain:
    1. Live API (if key set and valid)
    2. Cached response (if within TTL)
    3. SimDataService (always available)
  Health tracking: Updates api_health in localStorage

src/state/AccountState.js         (~100 lines)
  Purpose: User account profile — capital, risk preferences
  Exports: get(), getDefault(), update(fields),
           incrementLoss(), resetLossStreak()
  Storage: localStorage('account_profile')
  Default: balance=1000, risk_profile='standard',
           language='zh', timezone='Africa/Libreville'
  Phase 5+: Also syncs to Supabase account_profiles table

src/state/AppState.js             (~120 lines)
  Purpose: Central in-memory state store for current session
  Exports: getCandles(interval), currentPrice, prevClose,
           isLive, lastSignal, lastRegime, weights,
           refreshAll(), subscribe(event, callback)
  Stores: candles_1h, candles_4h, candles_1d (last fetch)
  Events: 'stateUpdated', 'signalGenerated', 'regimeChanged'
  On refreshAll(): fetches TwelveDataService → updates all arrays
                   → dispatches 'stateUpdated'
```

### Files Modified (0)
None. `index.html` is NOT touched in Phase 1.

### Dependency Build Order
```
Step 1: en.json, zh.json, validators.js, indicators.js  (no deps)
Step 2: i18n.js (needs json files), formatters.js (needs i18n),
        SimDataService.js (needs indicators)
Step 3: TwelveDataService.js (needs SimDataService), AccountState.js (needs i18n)
Step 4: AppState.js (needs AccountState + TwelveDataService)
```

### Estimated Lines
~1,280 lines total

### Complexity
Low-Medium. Pure logic, no UI. Fully testable in isolation.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Twelve Data CORS issue in browser | Low (confirmed working in v3.2) | SimDataService fallback |
| i18n key coverage gaps in zh.json | Low | i18n.js falls back to EN key |
| localStorage quota exceeded | Very low | Compressed storage, purge old candles |

### Completion Criteria
- [ ] `t('signal.sell')` returns "SELL" in EN, "做空" in ZH
- [ ] `t('signal.buy')` returns "BUY" in EN, "做多" in ZH
- [ ] `indicators.calcRSI(closes_14)` returns value between 0 and 100
- [ ] `indicators.calcMACD(closes_30)` returns `{ macd, signal, hist }`
- [ ] `SimDataService.getCandles(80)` returns 80 candles with valid OHLCV
- [ ] `TwelveDataService.getPrice('EUR/USD')` returns price OR simulated fallback
- [ ] `TwelveDataService.getCandles('EUR/USD', '4h', 80)` returns 80 candles
- [ ] `AccountState.getDefault()` returns object with `account_balance: 1000`
- [ ] `AppState.getCandles('4H')` returns array of Candle objects
- [ ] `setLang('en')` → `t('signal.sell')` returns "SELL"
- [ ] `setLang('zh')` → `t('signal.sell')` returns "做空"

---

## Phase 2 — MTF Engine + AI Committee + Regime Engine

**Status:** ⏳ Pending  
**Complexity:** Medium-High  
**Prerequisite:** Phase 1 complete and all completion criteria met  

### Goal
Build the analytical brain. All intelligence lives here. Five independent AI agents. MTF pre-gate. Regime classification. No UI yet — all logic must be independently verifiable in isolation.

### Files Created (9 new files)

```
src/core/MTFEngine.js                (~180 lines)
  Purpose: 3-timeframe alignment gate
  Inputs: candles_1d, candles_4h, candles_1h
  Computes: per-TF bias score using MA, RSI, MACD, price structure
  States: fully_aligned / partially_aligned / primary_only / not_aligned
  Output: MTFResult (see INTERFACE_CONTRACTS.md Contract 1)
  Critical: NOT_ALIGNED → gate_pass: false → Decision Engine stops

src/core/RegimeEngine.js             (~160 lines)
  Purpose: Market regime classifier
  Inputs: 4H candle array
  Computes: ADX, ATR_ratio, BB_width, MA alignment
  Classifies: 6 regimes (trending_bull/bear, ranging, volatile, breakout_up/down)
  Outputs: regime label + weight_adjustment JSON + position_size_multiplier
  Writes: market_regime_history (localStorage in Phase 1-4; Supabase in Phase 5+)

src/agents/TechnicalAnalyst.js       (~180 lines)
  Purpose: Technical analysis agent
  Weight: 35% (default)
  Inputs: 4H candles, current regime
  Scores: MA alignment, RSI, MACD, Bollinger position, ADX strength
  Score formula: 0–100 (>50 = bearish EUR/USD)
  Output: AgentVote (see INTERFACE_CONTRACTS.md)

src/agents/MacroAnalyst.js           (~140 lines)
  Purpose: Macroeconomic analysis agent
  Weight: 20% (default)
  Phase 2 inputs: memoryLayer stubs (hardcoded reasonable defaults)
    Fed: stance_score=60 (hawkish), ECB: stance_score=0 (neutral)
    us_de_spread=2.0, dxy_trend='rising'
  Phase 6 inputs: Central Bank Memory + FRED real data
  Score formula: FED_SCORE(30%) + ECB_SCORE(25%) + YIELD_SCORE(20%) + EVENT_SCORE(15%) + GDP_SCORE(10%)
  Output: AgentVote + macro_report stub

src/agents/PositioningAnalyst.js     (~130 lines)
  Purpose: Institutional positioning agent
  Weight: 10% (default)
  Phase 2 inputs: memoryLayer stubs (cot_z_score=0, cot_signal='neutral')
  Phase 6 inputs: COT history real data
  Score formula: COT_TREND(+/-20) + EXTREME_SCORE(+/-25) + DXY_CORR(+/-15) + YIELD(+/-10)
  Contrarian logic: extreme_long (z>2) → bearish signal; extreme_short (z<-2) → bullish
  Output: AgentVote

src/agents/NewsAnalyst.js            (~130 lines)
  Purpose: News sentiment analysis agent
  Weight: 20% (default)
  Phase 2 inputs: memoryLayer stubs (news_net_score=30 — mild USD bullish)
  Phase 6 inputs: news_memory real rolling aggregates
  Score formula: IMMEDIATE(25) + TREND(10) + NARRATIVE_SHIFT(-15 if true)
  Decay: exp(-t/decay_hours) per article age
  Output: AgentVote

src/agents/RiskAnalyst.js            (~150 lines)
  Purpose: Risk and volatility assessment agent
  Weight: 15% (default)
  Inputs: ATR from candles, regime from RegimeEngine, upcoming events stub
  Score: ATR_VOLATILITY + EVENT_PROXIMITY + REGIME_RISK + VIX_STUB
  Special: Risk Agent votes NEUTRAL when score < 65 (affects size, not direction)
  Outputs: AgentVote + position_size_multiplier recommendation

src/agents/CommitteeOrchestrator.js  (~160 lines)
  Purpose: Runs all 5 agents, applies MTF pre-gate, returns votes + verdict
  Flow: 
    1. Run MTFEngine.run() → if NOT_ALIGNED, return early with no_trade flag
    2. Run RegimeEngine.run() → get weights
    3. Run all 5 agents in parallel (Promise.all)
    4. Aggregate votes: sell_weight vs buy_weight
    5. Return CommitteeOutput (see INTERFACE_CONTRACTS.md Contract 3)
  Error handling: Any agent failure → neutral fallback for that agent

docs/DEVELOPMENT_LOG.md              (append entry 006)
```

### Files Modified (1)
```
docs/V4_MASTER_MANIFEST.md   → update phase status
```

### Dependency Build Order
```
Step 1: MTFEngine.js, RegimeEngine.js  (depend on Phase 1 indicators + AppState)
Step 2: All 5 agents in parallel       (depend on Phase 1 AppState + indicators)
Step 3: CommitteeOrchestrator.js       (depends on all agents + MTFEngine)
```

### Estimated Lines
~1,230 lines total

### Complexity
Medium-High. Algorithmic scoring. Each agent must be individually verifiable.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Agent score calibration poor on simulated data | Medium | Scores use simple linear math; easy to tune |
| MTF data unavailable (1H, 1D) | Low | Graceful fallback to `partially_aligned` |
| Circular import dependencies | Low | Strict dependency tree from Manifest |
| Agents producing all-neutral scores on sim data | Low | Simulated data has deliberate slight bearish drift |

### Completion Criteria
- [ ] `MTFEngine.run(c1d, c4h, c1h)` returns valid MTFResult for all inputs
- [ ] MTF with all 3 TF aligned bearish → `gate_pass: true, mtf_state: 'fully_aligned', confidence_adj: 10`
- [ ] MTF with 1D vs 4H conflict → `gate_pass: true, mtf_state: 'primary_only', confidence_adj: -15`
- [ ] MTF with no clear direction → `gate_pass: false, mtf_state: 'not_aligned'`
- [ ] `RegimeEngine.run(bearishCandles)` returns `regime: 'trending_bear'`
- [ ] Each agent returns `{ score, vote, confidence, reason_1, reason_2 }`
- [ ] `TechnicalAnalyst.run()` returns score > 55 on clearly bearish candles
- [ ] `CommitteeOrchestrator.run(appState)` returns exactly 5 votes
- [ ] `CommitteeOrchestrator.run()` returns `verdict.direction` matching majority vote
- [ ] If one agent throws: orchestrator still returns 5 votes (neutral fallback)

---

## Phase 3 — Decision Engine + Risk Manager + Paper Trading

**Status:** ⏳ Pending  
**Complexity:** Medium-High  
**Prerequisite:** Phase 2 complete  

### Goal
Connect the analytical brain to executable outputs. Decision Engine produces 8-state signals. Risk Manager sizes them correctly. Paper Trading records them with localStorage persistence.

### Files Created (5 new files)

```
src/core/DecisionEngine.js          (~220 lines)
  Purpose: 8-state signal generator
  Inputs: CommitteeOutput, AccountProfile, currentPrice
  Steps:
    0. Check MTF gate_pass → immediate NO_TRADE if false
    1. Apply regime-adjusted weights from AppState.weights
    2. Compute directional_score (weighted, excluding Risk agent)
    3. Apply confidence adjustments (risk penalty + MTF adj)
    4. Count agent agreement
    5. Map to 8-state output
    6. Apply hard gates (confidence, RR, drawdown, regime)
  Output: DecisionResult (see INTERFACE_CONTRACTS.md Contract 4)
  Defaults: sl_pips=50, tp1_pips=80, tp2_pips=130

src/core/RiskManager.js             (~160 lines)
  Purpose: Position sizing calculator
  Inputs: RiskCalcParams (see INTERFACE_CONTRACTS.md Contract 5)
  Computes:
    base_lot = risk_amount / (sl_pips × $10)
    × regime_multiplier
    × drawdown_multiplier
    × performance_multiplier
    × risk_score_multiplier
  Hard limits: min 0.01 lot, max balance/2000
  Output: RiskResult with lot_size, max_loss, expected_profit, risk_level

src/components/PaperTradePanel.js   (~180 lines)
  Purpose: Paper trading UI + logic
  Note: Logic extracted to PaperTradingEngine.js in Phase 5
  Phase 3 scope: In-component functions for submit/close/display
  Storage: localStorage('paper_trades') — array of trade records
  UI: Submit form + trade log table + validation progress bars
  Functions: submitTrade(), closeTrade(), getAll(), getStats()

docs/DEVELOPMENT_LOG.md             (append entry 007)
docs/V4_MASTER_MANIFEST.md          (update phase status)
```

### Files Modified (0)
No existing files changed. `index.html` still not touched.

### Dependency Build Order
```
Step 1: DecisionEngine.js  (depends on Phase 2 CommitteeOrchestrator)
Step 2: RiskManager.js     (depends on DecisionEngine output + Phase 1 AccountState)
Step 3: PaperTradePanel.js (depends on RiskManager + AccountState)
```

### Estimated Lines
~560 lines total

### Complexity
Medium-High. 8-state boundary conditions must be exact. Multiplier stacking must be tested.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| 8-state boundary conditions wrong | Medium | Unit test with known inputs |
| Risk Manager multipliers stack incorrectly | Low | Test each multiplier independently |
| Paper trades lost on page refresh | Low | localStorage persistence tested |

### Completion Criteria
- [ ] `DecisionEngine.run()` returns `STRONG_SELL` when directional_score > 75 + high confidence + 4+ agents agree
- [ ] `DecisionEngine.run()` returns `NO_TRADE` when `mtf_result.gate_pass = false`
- [ ] `DecisionEngine.run()` returns `NO_TRADE` when `final_confidence < 65`
- [ ] `DecisionEngine.run()` returns `NO_TRADE` when `rr_ratio < 1.5`
- [ ] `RiskManager.calc({balance:1000, sl_pips:50, profile:'standard', tp_pips:130, regime:'trending_bear', risk_score:50, consecutive_losses:0, win_rate_20:0.5})` returns `lot_size: 0.04` and `max_loss_usd: 20`
- [ ] `RiskManager.calc({..., regime:'volatile'})` returns `lot_size: 0.02` (0.5× multiplier)
- [ ] `RiskManager.calc({..., consecutive_losses:3})` returns `lot_size: 0.03` (0.75× multiplier)
- [ ] Paper trade submitted → appears in trade log
- [ ] Paper trade persists after page refresh (localStorage)
- [ ] `PaperTradingEngine.getStats()` returns correct win_rate

---

## Phase 4 — UI Integration + Dashboard + Signal Cards

**Status:** ⏳ Pending  
**Complexity:** Medium  
**Prerequisite:** Phase 3 complete  

### Goal
Wire all engines to a complete, production-quality user interface. This is the first phase producing a deployable, visible result. Carries forward the v3.2 K-line fix.

### Files Created (17 new files)

```
index.html                          (~350 lines)
  Purpose: V4.0 entry point — HTML skeleton only, no inline JS/CSS
  Structure:
    - <link> tags for 8 CSS files
    - <script type="module"> imports for all JS modules
    - TradingView Lightweight Charts CDN
    - Chart.js CDN
    - Version: v4.0 in logo
    - Sidebar navigation: 12 pages
    - Language toggle button (ZH | EN)
    - All page divs (HTML only, no inline content)

styles/base.css                     (~120 lines)
  CSS variables, reset, typography, color system

styles/layout.css                   (~150 lines)
  Sidebar (220px fixed), topbar, content area, grid system

styles/components.css               (~200 lines)
  Panel, card, tag, badge, button, toggle, select, progress bar

styles/risk-manager.css             (~80 lines)
  Dark gradient card, risk grid, profile buttons, risk level indicator

styles/committee.css                (~100 lines)
  Agent cards (5 variants), score bars, vote badges, breakdown grid

styles/decision.css                 (~100 lines)
  Decision flow diagram, MTF alignment panel, explanation grid

styles/kline.css                    (~80 lines)
  TradingView container (#tvChart), sub-chart panels (MACD/RSI)

styles/paper-trade.css              (~80 lines)
  Trade log table, validation progress, submit form

src/components/HeroPanel.js         (~160 lines)
  Price + signal arrow + confidence ring + Decision Engine mini-scores
  Reads: AppState (price), lastSignal (direction/confidence)
  Language: uses t() for all labels

src/components/CommitteePanel.js    (~180 lines)
  5 agent cards with individual scores, votes, reasons, weight bars
  Vote breakdown grid + weighted verdict display
  Language: agent names and reasons from i18n

src/components/DecisionPanel.js     (~200 lines)
  Decision flow diagram (5-node → final)
  MTF alignment panel (3-timeframe bias display)
  Signal explanation (4-category why-this-signal)
  Risk filter status table
  Historical similarity display

src/components/RiskManagerPanel.js  (~140 lines)
  Dark card with live calculation
  Inputs: account balance, sl pips, risk profile buttons
  Outputs: lot size, max loss, expected profit, RR, risk level
  Reads/writes: AccountState (live update on input change)
  Account risk dashboard: daily risk used, weekly, drawdown

src/components/KLinePanel.js        (~200 lines)
  TradingView Lightweight Charts v4 — confirmed fix from v3.2
  createMainChart() — initializes once only
  updateMainChart() — sets data only, never recreates chart
  Timeframe buttons (1H / 4H / Daily) with live data switch
  Indicator toggles (MA / BB / Signals / SL-TP)
  MACD + RSI sub-charts on Chart.js (bar/line)
  Signal markers via setMarkers()
  SL/TP price lines via createPriceLine()

src/components/SettingsPanel.js     (~120 lines)
  API key input + connect button
  Account profile editor
  Decision Engine parameter settings
  Risk Manager defaults
  Notification toggles
  Language switch (ZH | EN button)

docs/DEVELOPMENT_LOG.md             (append entry 008)
docs/V4_MASTER_MANIFEST.md          (update — Phase 4 complete)
```

### Files Modified (0)
`index.html` is new (v4.0), not a modification of v3.2.

### Dependency Build Order
```
Step 1: All 8 CSS files (depend only on each other via variables)
Step 2: All 7 component files (depend on Phase 1-3 modules)
Step 3: index.html (depends on all components and CSS)
```

### Estimated Lines
~2,460 lines total (HTML + CSS + components)

### Complexity
Medium. Logic is complete from Phases 1-3. This phase is assembly and styling.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| TradingView K-line blank (v3.2 bug recurring) | Very low | createMainChart/updateMainChart pattern confirmed in v3.2 |
| ZH/EN switch misses some strings | Low | All strings use t() — comprehensive review in en.json |
| Component state out of sync | Low | AppState is single source of truth, components subscribe to events |
| CSS specificity conflicts between files | Low | Each CSS file scoped to specific component classes |

### Completion Criteria
- [ ] Full app loads from `index.html` in browser with no console errors
- [ ] All 12 pages navigate without errors
- [ ] K-line renders with simulated data on load (no API key needed)
- [ ] K-line renders with real data after Twelve Data API key entry in Settings
- [ ] `setLang('en')` → all visible text switches to English, no page reload
- [ ] `setLang('zh')` → all visible text switches to Chinese, no page reload
- [ ] Risk Manager inputs update lot size in real time
- [ ] Committee panel shows 5 agents with scores, votes, weights, reasons
- [ ] MTF alignment panel shows 3-timeframe bias and alignment state
- [ ] Decision Engine page shows flow diagram with live scores
- [ ] Paper trade submitted → appears in log → persists after refresh
- [ ] `NO_TRADE` displayed when MTF not aligned

---

## Phase 5 — Supabase Integration

**Status:** ⏳ Pending  
**Complexity:** Medium  
**Prerequisite:** Phase 4 complete + Supabase project created  

### Goal
Migrate all persistence from localStorage to Supabase PostgreSQL. Signals, paper trades, and audit logs become permanent. All 17 tables created. Row-Level Security applied.

### Files Created (22 new files)

```
src/database/supabaseClient.js

supabase/migrations/001_signals.sql
supabase/migrations/002_signal_results.sql
supabase/migrations/003_market_snapshots.sql
supabase/migrations/004_committee_votes.sql
supabase/migrations/005_central_bank_memory.sql
supabase/migrations/006_news_memory.sql
supabase/migrations/007_news_events.sql
supabase/migrations/008_economic_events.sql
supabase/migrations/009_cot_history.sql
supabase/migrations/010_market_regime_history.sql
supabase/migrations/011_macro_reports.sql
supabase/migrations/012_paper_trades.sql
supabase/migrations/013_learning_snapshots.sql
supabase/migrations/014_account_profiles.sql
supabase/migrations/015_api_health.sql
supabase/migrations/016_signal_audit_log.sql
supabase/migrations/017_committee_weights.sql

supabase/rls/policies.sql

supabase/seeds/seed_committee_weights.sql
supabase/seeds/seed_cb_memory.sql
supabase/seeds/seed_cot_history.sql
```

### Files Modified (8 files — add DB persistence while keeping localStorage fallback)
```
src/state/AppState.js              + signal write to DB on generate
src/state/AccountState.js          + profile sync to account_profiles
src/core/DecisionEngine.js         + write signals + committee_votes + snapshots
src/core/RiskManager.js            + read account_profiles
src/components/PaperTradePanel.js  + read/write paper_trades
src/components/SettingsPanel.js    + Supabase URL + anon key inputs
src/components/KLinePanel.js       + write market_snapshots on render
docs/DEVELOPMENT_LOG.md
```

### Estimated Lines
~1,200 new lines (SQL + JS client code)

### Complexity
Medium. SQL schema is fully specified in DATABASE_SCHEMA.md. JS changes are additive.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| RLS misconfiguration blocks legitimate operations | Medium | Test every CRUD operation with test user |
| CORS from browser to Supabase | Very low | Use Supabase JS client, not raw fetch |
| Migration order dependency error | Low | Run in strict numbered order |
| committee_votes trigger not firing | Low | Test with paper trade close |
| audit_log UPDATE blocked (intended) | Expected | This is a feature, verify it works |

### Completion Criteria
- [ ] Signal generated → appears in Supabase `signals` table within 2 seconds
- [ ] Paper trade closed → `signal_results` written, `committee_votes.was_correct` updated
- [ ] `signal_audit_log` shows lifecycle events for every signal
- [ ] UPDATE on `signal_audit_log` fails (immutability enforced)
- [ ] Only one row in `committee_weights` has `is_active = true`
- [ ] Page refresh → paper trades retrieved from Supabase (not localStorage)
- [ ] Account profile persists across different browser sessions
- [ ] All 17 tables visible in Supabase dashboard

---

## Phase 6 — Memory Engines + Live API Integration

**Status:** ⏳ Pending  
**Complexity:** High  
**Prerequisite:** Phase 5 complete  

### Goal
Replace all stub data in agents with real live feeds. Central Bank Memory, News Memory, and COT Engine go live. All 5 agents produce scores from real data instead of hardcoded defaults.

### Files Created (11 new files)

```
src/memory/CentralBankMemory.js    (~140 lines)
  Purpose: Fed/ECB stance manager
  Reads from: central_bank_memory table
  Computes: policy_momentum from last 3 stance records
  Feeds: MacroAnalyst

src/memory/NewsMemory.js           (~160 lines)
  Purpose: Rolling sentiment aggregator
  Reads from: news_events table
  Computes: 24h/7d/30d sentiment with exponential decay
  Writes to: news_memory table
  Feeds: NewsAnalyst

src/memory/EconomicMemory.js       (~120 lines)
  Purpose: Economic surprise history
  Reads from: economic_events table (released events)
  Computes: surprise_score, historical impact patterns
  Feeds: RiskAnalyst (event proximity context)

src/memory/COTMemory.js            (~140 lines)
  Purpose: CFTC positioning intelligence
  Reads from: cot_history table
  Computes: z_score trends, extreme positioning flags
  Feeds: PositioningAnalyst

src/services/FREDService.js        (~120 lines)
  Purpose: FRED API client
  Fetches: FEDFUNDS, T10Y2Y, DGS10, CPIAUCSL, PCE, UNRATE
  Cache: 24 hours (FRED data updates weekly/monthly)
  Feeds: MacroAnalyst via CentralBankMemory

src/services/NewsAPIService.js     (~120 lines)
  Purpose: Financial headline fetcher (or Finnhub)
  Batches: 1 call per 4H cycle (6 calls/day on free tier)
  Feeds: NewsMemory.js

src/services/COTService.js         (~140 lines)
  Purpose: CFTC COT CSV parser
  Schedule: Weekly on Friday after 3:30 PM EST
  Normalizes: net position, z-score calculation
  Feeds: COTMemory.js → cot_history table

src/services/CalendarService.js    (~100 lines)
  Purpose: Economic calendar fetcher (ForexFactory RSS or FMP)
  Fetches: Next 7 days of high/medium impact events
  Feeds: economic_events table → RiskAnalyst

src/services/DataNormalizer.js     (~80 lines)
  Purpose: Unified format converter for all external data
  Ensures: All services return identical internal formats
  Prevents: Any service format change from breaking agents

src/components/MacroReportPanel.js (~160 lines)
  Purpose: Display AI Macro Report
  Reads: macro_reports table (latest)
  Displays: Fed/ECB stance, COT bias, DXY trend, summary (ZH/EN)
  Location: Committee page under Macro Agent card
  Also displays on: Dashboard trade plan panel (summary line)
```

### Files Modified (5 files)
```
src/agents/MacroAnalyst.js         → replace stubs with CentralBankMemory + FRED
src/agents/PositioningAnalyst.js   → replace stubs with COTMemory
src/agents/NewsAnalyst.js          → replace stubs with NewsMemory
src/components/SettingsPanel.js    → add API keys for FRED, Finnhub/NewsAPI
src/state/AppState.js              → initialize memory layer on startup
```

### Estimated Lines
~1,400 new lines

### Complexity
High. Multiple external APIs with different formats. Rate limit management. Graceful degradation for each failure mode.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| NewsAPI 24h free tier delay | High (known) | Use Finnhub free tier instead |
| CFTC COT CSV format change | Low | Monitor CFTC site; FMP calendar as backup |
| FRED API key rate limits | Very low | Unlimited tier; cache 24h |
| Memory engine cold start (no history yet) | Medium | Use stub values until 2 weeks of data accumulated |
| All APIs down simultaneously | Very low | SimDataService + manual CB memory entries |

### Completion Criteria
- [ ] Macro Agent score changes based on real FRED data (different from stub)
- [ ] News Agent score reflects real Finnhub headlines from last 24h
- [ ] Positioning Agent reflects last CFTC COT report z_score
- [ ] `api_health` table shows live status for all connected APIs
- [ ] Disconnecting Twelve Data → graceful fallback → stale data warning in UI
- [ ] Macro Report displays readable summary in both ZH and EN
- [ ] News memory computes 24h/7d/30d windows correctly

---

## Phase 7 — Learning Engine + Advanced Backtest

**Status:** ⏳ Pending  
**Complexity:** High  
**Prerequisite:** Phase 6 complete + minimum 20 closed paper trades  

### Goal
The system learns from its own history. Weight proposals generated automatically after every 10 closed trades. Backtest engine shows clickable expandable signal records. Historical similarity scoring active.

### Files Created (5 new files)

```
src/core/LearningEngine.js          (~280 lines)
  Purpose: Post-trade analytics and weight optimization
  Trigger: Every 10 closed trades (paper or live)
  Computes: win_rate, profit_factor, sharpe_ratio, max_drawdown,
            expectancy, per-agent accuracy, regime win rates
  Rules: 5 optimization rules (see Architecture Freeze Section 9)
  Outputs: proposals to learning_snapshots (requires manual approval)
  Critical: NEVER auto-applies weight changes

src/utils/similarityEngine.js       (~120 lines)
  Purpose: Historical similarity scoring for new signals
  Method: Cosine similarity of feature vectors
  Feature vector: [rsi_14, macd_hist_norm, bb_position, adx_14,
                   atr_ratio, news_sentiment_24h, us_de_spread, dxy_trend_code]
  Minimum data: 20 closed signals before activating
  Confidence adjustment: ±5–10% based on similar signal win rate

src/components/LearningPanel.js     (~180 lines)
  Purpose: Learning Engine UI
  Displays: Performance metrics, agent accuracy matrix, win rate by regime,
            weight optimization log, pending proposals with approve button
  Language: Full ZH/EN support

src/components/BacktestPanel.js     (~160 lines)
  Purpose: Advanced backtest with expandable records
  Displays: Summary stats (win rate, profit factor, sharpe, drawdown)
            Per-dimension win rates (regime, session, confidence tier)
            Historical signal table — each row expandable to show:
              Price snapshot at signal time
              Agent votes breakdown
              Macro summary
              Outcome + exit reason
              Win/loss reason from Learning Engine
  Pagination: 20 records per page

docs/DEVELOPMENT_LOG.md             (append final Phase 7 entry)
```

### Files Modified (3 files)
```
src/core/DecisionEngine.js    → add historical similarity score check
src/state/AppState.js         → add learning engine trigger on trade close
docs/V4_MASTER_MANIFEST.md    → update version to v4.0 COMPLETE
```

### Estimated Lines
~740 new lines

### Complexity
High. Cosine similarity requires pre-computed feature vectors. Learning rules must be conservative. Backtest UI performance with 500+ records requires pagination.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Insufficient similar signals for cosine scoring | Medium | Minimum 20 signals before activating; clear UI note |
| Overfitting via aggressive weight proposals | Low | All changes require manual approval |
| Backtest UI slow with many records | Low | Server-side pagination in Supabase query |
| Learning Engine runs before enough data | Low | Guard: `if (closedTrades.length >= 10)` |

### Completion Criteria
- [ ] Learning Engine runs after 10th closed paper trade
- [ ] Weight proposal appears in Learning Panel with explanation
- [ ] User approves → `committee_weights` table updated → Decision Engine uses new weights
- [ ] User can reject → proposal discarded, current weights unchanged
- [ ] Backtest panel shows expandable signal records (click to expand)
- [ ] Each expanded record shows: agent votes, regime, market snapshot, outcome, reason
- [ ] Regime-stratified win rate table shows at least 3 regimes
- [ ] Historical similarity score displayed on Dashboard for each signal
- [ ] Signal with similarity score < 0.40 shows confidence reduced by 10%

---

## Phase Summary Table

| Phase | Name | New Files | Modified | Est. Lines | Complexity | Status |
|-------|------|-----------|----------|------------|------------|--------|
| 0 | Documentation | 7 MD | 0 | ~1,500 | Low | ✅ Complete |
| 1 | Foundation | 10 JS | 0 | ~1,280 | Low-Med | ⏳ Ready |
| 2 | Engines + Committee | 9 JS | 1 | ~1,230 | Med-High | ⏳ Pending |
| 3 | Decision + Risk + Paper | 5 JS | 0 | ~560 | Med-High | ⏳ Pending |
| 4 | UI Integration | 17 files | 0 | ~2,460 | Medium | ⏳ Pending |
| 5 | Supabase | 22 SQL/JS | 8 | ~1,200 | Medium | ⏳ Pending |
| 6 | Memory + APIs | 11 JS | 5 | ~1,400 | High | ⏳ Pending |
| 7 | Learning + Backtest | 5 JS | 3 | ~740 | High | ⏳ Pending |
| **TOTAL** | | **86 files** | **17** | **~10,370** | | |

---

## Go/No-Go Criteria for Live Trading

Complete all 4 Paper Trading validation phases before any real capital.

| Metric | Minimum Required | Phase |
|--------|-----------------|-------|
| Completed trades | 100 (Phase 1), 300, 500, 1000 | Paper Phase 1 first |
| Win rate | ≥ 60% over last 100 closed trades | All phases |
| Profit factor | ≥ 1.5 | After Phase 1 gate |
| Maximum drawdown | ≤ 10% of starting balance | Continuous monitoring |
| Sharpe ratio | ≥ 1.0 | After Phase 2 gate |
| Consecutive losses max | ≤ 5 in last 50 trades | Continuous monitoring |
| Regime coverage | Performance data in ≥ 3 regimes | After Phase 2 gate |
| Learning Engine | At least 1 weight proposal cycle completed | After Phase 3 gate |

**If any criterion is not met after 300 trades:** Continue paper trading. Do NOT proceed to live capital. Investigate using Backtest Engine and Learning Engine.

---

## Development Rules

These rules apply to all phases and to any AI system assisting development.

```
RULE 1 — COMPLETE FILES ONLY
  Every output file must be complete and directly replaceable.
  No patches. No snippets. No diffs.
  If a file needs to change, the entire file is output.

RULE 2 — DEPENDENCY ORDER
  Always build in the order specified in the Dependency Build Order
  section of each phase. Never build a consumer before its dependency.

RULE 3 — PHASE ISOLATION
  Phase 1 files must not contain Supabase calls (Phase 5 concern)
  Phase 2 files must not contain Learning Engine logic (Phase 7)
  Phase 3 files must not contain Memory Engine logic (Phase 6)
  Future phase imports are stubbed with clear TODO comments

RULE 4 — INTERFACE CONTRACTS ARE FROZEN
  Function signatures in INTERFACE_CONTRACTS.md cannot change
  without a documented revision and approval.

RULE 5 — MANIFEST UPDATED AFTER EVERY PHASE
  V4_MASTER_MANIFEST.md must be updated with:
    - Completed tasks list
    - Created files list
    - Modified files list
    - Known issues at close

RULE 6 — ZH/EN RULE
  Zero hardcoded strings in any non-i18n file.
  All user-facing text uses t('namespace.key').
  en.json is updated first; zh.json mirrors immediately.

RULE 7 — GRACEFUL DEGRADATION
  Every external API call has a defined fallback behavior.
  System never crashes due to API failure.
  SimDataService is the fallback of last resort.

RULE 8 — APPROVAL GATE
  Each phase begins only after the previous phase's
  completion criteria are verified and coding is explicitly approved.

RULE 9 — ERROR HANDLING
  No function in core/, agents/, or services/ may throw an exception
  to a caller. All errors are caught, logged, and a safe fallback
  value returned. Components may display error UI, but never crash.

RULE 10 — TEST BEFORE NEXT PHASE
  Each phase's completion criteria must be manually verified
  in a browser before the next phase begins.
  Document any failures in DEVELOPMENT_LOG.md.
```

---

*Plan Version: V4.0 | Last Updated: 2026-06*  
*Next update: After Phase 1 completion — update status table and append DEVELOPMENT_LOG entry.*
