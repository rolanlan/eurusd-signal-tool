# ONETO EUR/USD AI Tool — V4.0 Master Manifest

**Project Brain — This file must be updated after every development phase.**  
**If this file is out of date, the project state is unknown.**

---

## Table of Contents

1. [Current Status](#1-current-status)
2. [Version History](#2-version-history)
3. [Approved Modules](#3-approved-modules)
4. [Completed Phases](#4-completed-phases)
5. [Pending Phases](#5-pending-phases)
6. [Folder Structure](#6-folder-structure)
7. [Dependency Tree](#7-dependency-tree)
8. [Core Interface Summary](#8-core-interface-summary)
9. [API Status](#9-api-status)
10. [Database Status](#10-database-status)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Development Rules](#12-development-rules)
13. [Known Issues](#13-known-issues)

---

## 1. Current Status

| Field | Value |
|-------|-------|
| **Current Version** | v4.0 |
| **Current Phase** | Phase 0 — Documentation Foundation |
| **Next Phase** | Phase 1 — i18n + Utilities + Services + State |
| **Architecture Freeze** | ✅ Approved (Revision 1) |
| **Coding Status** | NOT STARTED |
| **Last Updated** | 2026-06 |
| **Last Updated By** | Rolan / ONETO |
| **Base File (last working)** | `index.html` (v3.2, TradingView K-line confirmed working) |

---

## 2. Version History

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| v3.0 | 2026-05 | Initial signal display tool (single HTML, simulated data) | ✅ Complete |
| v3.1 | 2026-05 | Twelve Data API integration attempt; OANDA abandoned | ✅ Complete |
| v3.2 | 2026-05 | TradingView K-line fix; candlestick bug resolved | ✅ Complete |
| v4.0 Arch | 2026-06 | Full institutional architecture designed and approved | ✅ Approved |
| v4.0 P0 | 2026-06 | Documentation foundation (this phase) | 🔄 In Progress |
| v4.0 P1 | — | i18n + Utilities + Services + State | ⏳ Pending |
| v4.0 P2 | — | MTF Engine + AI Committee + Regime Engine | ⏳ Pending |
| v4.0 P3 | — | Decision Engine + Risk Manager + Paper Trading | ⏳ Pending |
| v4.0 P4 | — | UI Integration + Dashboard + Signal Cards | ⏳ Pending |
| v4.0 P5 | — | Supabase Integration | ⏳ Pending |
| v4.0 P6 | — | Memory Engines + Live API Integration | ⏳ Pending |
| v4.0 P7 | — | Learning Engine + Advanced Backtest | ⏳ Pending |

---

## 3. Approved Modules

All modules listed below are part of the V4.0 Architecture Freeze (Revision 1).

| Module | Implementation Phase | Architecture Status |
|--------|---------------------|---------------------|
| ZH/EN Internationalization | Phase 1 | ✅ Approved |
| Utility Functions | Phase 1 | ✅ Approved |
| Twelve Data Service | Phase 1 | ✅ Approved |
| SimData Service | Phase 1 | ✅ Approved |
| State Layer (App + Account) | Phase 1 | ✅ Approved |
| MTF Engine | Phase 2 | ✅ Approved |
| Market Regime Engine | Phase 2 | ✅ Approved |
| Technical Analyst Agent | Phase 2 | ✅ Approved |
| Macro Analyst Agent | Phase 2 | ✅ Approved |
| Positioning Analyst Agent | Phase 2 | ✅ Approved |
| News Analyst Agent | Phase 2 | ✅ Approved |
| Risk Analyst Agent | Phase 2 | ✅ Approved |
| Committee Orchestrator | Phase 2 | ✅ Approved |
| Decision Engine | Phase 3 | ✅ Approved |
| Risk Manager | Phase 3 | ✅ Approved |
| Paper Trading Engine | Phase 3 | ✅ Approved |
| UI Components (7 panels) | Phase 4 | ✅ Approved |
| CSS Style System | Phase 4 | ✅ Approved |
| Historical Database (17 tables) | Phase 5 | ✅ Approved |
| Central Bank Memory Engine | Phase 6 | ✅ Approved |
| News Memory Engine | Phase 6 | ✅ Approved |
| COT Positioning Engine | Phase 6 | ✅ Approved |
| Economic Memory Engine | Phase 6 | ✅ Approved |
| FRED Service | Phase 6 | ✅ Approved |
| NewsAPI Service | Phase 6 | ✅ Approved |
| COT Service | Phase 6 | ✅ Approved |
| AI Macro Report | Phase 6 | ✅ Approved |
| Learning Engine | Phase 7 | ✅ Approved |
| Backtest Engine | Phase 7 | ✅ Approved |
| Similarity Engine | Phase 7 | ✅ Approved |

---

## 4. Completed Phases

| Phase | Name | Files Created | Files Modified | Completed |
|-------|------|--------------|----------------|-----------|
| v3.0 | Initial Signal Tool | 1 (index.html) | — | 2026-05 |
| v3.1 | API Integration | 1 (index.html) | — | 2026-05 |
| v3.2 | TradingView K-line Fix | 1 (index.html) | — | 2026-05 |
| v4.0 Arch | Architecture Design | 0 | — | 2026-06 |
| v4.0 P0 | Documentation Foundation | 7 (docs/*.md) | — | 2026-06 (in progress) |

---

## 5. Pending Phases

| Phase | Name | Prerequisite | Est. Files | Est. Lines | Complexity |
|-------|------|-------------|-----------|-----------|------------|
| Phase 1 | i18n + Utils + Services + State | P0 approved | 10 | ~1,280 | Low-Medium |
| Phase 2 | MTF + Committee + Regime | P1 complete | 9 | ~1,230 | Medium-High |
| Phase 3 | Decision + Risk + Paper | P2 complete | 5 | ~560 | Medium-High |
| Phase 4 | UI Integration | P3 complete | 17 | ~2,460 | Medium |
| Phase 5 | Supabase | P4 complete | 22 | ~1,200 | Medium |
| Phase 6 | Memory + Live APIs | P5 complete | 11 | ~1,400 | High |
| Phase 7 | Learning + Backtest | P6 complete | 5 | ~740 | High |

**Total estimated: ~9,050 lines across ~79 files (excludes docs)**

---

## 6. Folder Structure

```
oneto-eurusd-v4/
│
├── index.html                              ← Entry point (created Phase 4)
│
├── src/
│   ├── core/
│   │   ├── DecisionEngine.js               ← Phase 3
│   │   ├── MTFEngine.js                    ← Phase 2
│   │   ├── RiskManager.js                  ← Phase 3
│   │   ├── RegimeEngine.js                 ← Phase 2
│   │   └── LearningEngine.js               ← Phase 7
│   │
│   ├── agents/
│   │   ├── TechnicalAnalyst.js             ← Phase 2
│   │   ├── MacroAnalyst.js                 ← Phase 2
│   │   ├── PositioningAnalyst.js           ← Phase 2
│   │   ├── NewsAnalyst.js                  ← Phase 2
│   │   ├── RiskAnalyst.js                  ← Phase 2
│   │   └── CommitteeOrchestrator.js        ← Phase 2
│   │
│   ├── memory/
│   │   ├── CentralBankMemory.js            ← Phase 6
│   │   ├── NewsMemory.js                   ← Phase 6
│   │   ├── EconomicMemory.js               ← Phase 6
│   │   └── COTMemory.js                    ← Phase 6
│   │
│   ├── services/
│   │   ├── TwelveDataService.js            ← Phase 1
│   │   ├── FREDService.js                  ← Phase 6
│   │   ├── NewsAPIService.js               ← Phase 6
│   │   ├── COTService.js                   ← Phase 6
│   │   ├── CalendarService.js              ← Phase 6
│   │   ├── SimDataService.js               ← Phase 1
│   │   └── DataNormalizer.js               ← Phase 6
│   │
│   ├── state/
│   │   ├── AppState.js                     ← Phase 1
│   │   └── AccountState.js                 ← Phase 1
│   │
│   ├── components/
│   │   ├── HeroPanel.js                    ← Phase 4
│   │   ├── CommitteePanel.js               ← Phase 4
│   │   ├── DecisionPanel.js                ← Phase 4
│   │   ├── RiskManagerPanel.js             ← Phase 4
│   │   ├── KLinePanel.js                   ← Phase 4
│   │   ├── PaperTradePanel.js              ← Phase 3 (logic) + Phase 4 (UI)
│   │   └── SettingsPanel.js                ← Phase 4
│   │
│   ├── utils/
│   │   ├── indicators.js                   ← Phase 1
│   │   ├── formatters.js                   ← Phase 1
│   │   └── validators.js                   ← Phase 1
│   │
│   └── i18n/
│       ├── en.json                         ← Phase 1
│       ├── zh.json                         ← Phase 1
│       └── i18n.js                         ← Phase 1
│
├── styles/
│   ├── base.css                            ← Phase 4
│   ├── layout.css                          ← Phase 4
│   ├── components.css                      ← Phase 4
│   ├── risk-manager.css                    ← Phase 4
│   ├── committee.css                       ← Phase 4
│   ├── decision.css                        ← Phase 4
│   ├── kline.css                           ← Phase 4
│   └── paper-trade.css                     ← Phase 4
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_signals.sql                 ← Phase 5
│   │   ├── 002_signal_results.sql
│   │   ├── 003_market_snapshots.sql
│   │   ├── 004_committee_votes.sql
│   │   ├── 005_central_bank_memory.sql
│   │   ├── 006_news_memory.sql
│   │   ├── 007_news_events.sql
│   │   ├── 008_economic_events.sql
│   │   ├── 009_cot_history.sql
│   │   ├── 010_market_regime_history.sql
│   │   ├── 011_macro_reports.sql
│   │   ├── 012_paper_trades.sql
│   │   ├── 013_learning_snapshots.sql
│   │   ├── 014_account_profiles.sql
│   │   ├── 015_api_health.sql
│   │   ├── 016_signal_audit_log.sql
│   │   └── 017_committee_weights.sql
│   ├── rls/
│   │   └── policies.sql
│   └── seeds/
│       ├── seed_committee_weights.sql
│       ├── seed_cb_memory.sql
│       └── seed_cot_history.sql
│
├── tests/
│   ├── core/
│   ├── agents/
│   └── utils/
│
└── docs/
    ├── V4_ARCHITECTURE_FREEZE.md           ← Phase 0 ✅
    ├── V4_MASTER_MANIFEST.md               ← Phase 0 ✅ (this file)
    ├── DATABASE_SCHEMA.md                  ← Phase 0 ✅
    ├── API_REPORT.md                       ← Phase 0 ✅
    ├── DEVELOPMENT_LOG.md                  ← Phase 0 ✅
    ├── INTERFACE_CONTRACTS.md              ← Phase 0 ✅
    └── PHASE_IMPLEMENTATION_PLAN.md        ← Phase 0 ✅
```

---

## 7. Dependency Tree

Build order is strictly bottom-up. Never build a consumer before its dependency.

```
LEVEL 0 — No dependencies (build first)
  src/utils/validators.js
  src/utils/indicators.js
  src/i18n/en.json
  src/i18n/zh.json

LEVEL 1 — Depends on Level 0 only
  src/i18n/i18n.js             ← needs en.json, zh.json
  src/utils/formatters.js      ← needs i18n.js
  src/services/SimDataService.js ← needs indicators.js

LEVEL 2 — Depends on Level 0-1
  src/services/TwelveDataService.js  ← needs SimDataService.js, indicators.js
  src/state/AccountState.js          ← needs i18n.js

LEVEL 3 — Depends on Level 0-2
  src/state/AppState.js         ← needs AccountState.js, TwelveDataService.js
  src/core/MTFEngine.js         ← needs indicators.js, TwelveDataService.js
  src/core/RegimeEngine.js      ← needs indicators.js, AppState.js

LEVEL 4 — Depends on Level 0-3 (all 5 agents)
  src/agents/TechnicalAnalyst.js     ← needs indicators.js, AppState.js
  src/agents/MacroAnalyst.js         ← needs AppState.js
  src/agents/PositioningAnalyst.js   ← needs AppState.js
  src/agents/NewsAnalyst.js          ← needs AppState.js
  src/agents/RiskAnalyst.js          ← needs indicators.js, AppState.js

LEVEL 5 — Depends on Level 0-4
  src/agents/CommitteeOrchestrator.js ← needs all 5 agents, MTFEngine

LEVEL 6 — Depends on Level 0-5
  src/core/DecisionEngine.js    ← needs CommitteeOrchestrator, validators

LEVEL 7 — Depends on Level 0-6
  src/core/RiskManager.js       ← needs DecisionEngine output, AccountState, formatters

LEVEL 8 — Depends on Level 0-7 (all components)
  src/components/HeroPanel.js
  src/components/CommitteePanel.js
  src/components/DecisionPanel.js
  src/components/RiskManagerPanel.js
  src/components/KLinePanel.js
  src/components/PaperTradePanel.js
  src/components/SettingsPanel.js

LEVEL 9 — Depends on all
  index.html
```

---

## 8. Core Interface Summary

Full specifications are in `docs/INTERFACE_CONTRACTS.md`.

| Interface | Key Input | Key Output |
|-----------|-----------|------------|
| `MTFEngine.run(c1d, c4h, c1h)` | 3× candle arrays | `{ mtf_score, mtf_state, bias×3, confidence_adj, gate_pass }` |
| `RegimeEngine.run(candles)` | 4H candle array | `{ regime, weight_adjustment, position_size_multiplier }` |
| `CommitteeOrchestrator.run(appState)` | App state object | `{ votes[5], verdict{direction, confidence} }` |
| `DecisionEngine.run(committee, regime, profile)` | Committee output + regime | `{ signal_strength, direction, confidence, price_levels, explanation[] }` |
| `RiskManager.calc(params)` | Balance + pips + profile | `{ lot_size, max_loss, expected_profit, rr, level, system_halt }` |
| `TwelveDataService.getPrice(symbol)` | Symbol string | `{ price, timestamp, source }` |
| `TwelveDataService.getCandles(symbol, interval, count)` | Symbol + interval + count | `{ candles[], source }` |
| `t(key, params?)` | i18n key string | Localized string |
| `PaperTradingEngine.submitTrade(input)` | Trade parameters | Trade record object |
| `PaperTradingEngine.closeTrade(id, exitPrice, reason)` | Trade ID + exit | Updated trade record |

---

## 9. API Status

| API | Purpose | Status | Key Location | Free Tier | Phase |
|-----|---------|--------|-------------|-----------|-------|
| Twelve Data | Price + OHLCV | ⚡ Partial (v3.2) | `localStorage` | 800 req/day | 1 |
| FRED | Macro data | ⏳ Not started | — | Unlimited | 6 |
| NewsAPI | Headlines | ⏳ Not started | — | 100 req/day | 6 |
| CFTC COT | Positioning | ⏳ Not started | — | Free public | 6 |
| ForexFactory | Calendar | ⏳ Not started | — | RSS free | 6 |
| Finnhub | News backup | ⏳ Not started | — | 60/min | 6 |
| Claude API | Report gen | ⏳ Not started | — | Limited | 6+ |
| Gemini Pro | ZH translation | ⏳ Not started | — | 60/min free | 6+ |

---

## 10. Database Status

| Item | Status | Phase | Notes |
|------|--------|-------|-------|
| Supabase project | ⏳ Not created | 5 | Create before Phase 5 begins |
| Migration files (17) | ⏳ Not written | 5 | Run in numbered order |
| RLS policies | ⏳ Not written | 5 | Required before any user data |
| Seed: committee_weights | ⏳ Not written | 5 | Factory default row required |
| Seed: cb_memory | ⏳ Not written | 5 | Last 12 months Fed/ECB stances |
| Seed: cot_history | ⏳ Not written | 5 | Last 52 weeks CFTC data |

**Phase 1–4:** localStorage used for all persistence  
**Phase 5:** Migration to Supabase; localStorage remains as offline fallback

---

## 11. Implementation Roadmap

| Phase | Name | New Files | Modified Files | Est. Lines | Complexity | Gate |
|-------|------|-----------|----------------|------------|------------|------|
| 0 | Documentation | 7 MD | 0 | ~1,500 | Low | ✅ Approved |
| 1 | Foundation | 10 JS | 0 | ~1,280 | Low-Med | P0 approved |
| 2 | Engines + Committee | 9 JS | 1 MD | ~1,230 | Med-High | P1 complete |
| 3 | Decision + Risk + Paper | 5 JS | 0 | ~560 | Med-High | P2 complete |
| 4 | UI Integration | 17 files | 0 | ~2,460 | Medium | P3 complete |
| 5 | Supabase | 22 SQL/JS | 8 JS | ~1,200 | Medium | P4 complete |
| 6 | Memory + APIs | 11 JS | 5 JS | ~1,400 | High | P5 complete |
| 7 | Learning + Backtest | 5 JS | 3 files | ~740 | High | P6 complete |

### Go Criteria for Real Trading (after Paper Trading validation)

```
✅ Win rate ≥ 60% over 100+ paper trades
✅ Profit factor ≥ 1.5
✅ Max drawdown ≤ 10%
✅ Sharpe ratio ≥ 1.0
✅ No more than 5 consecutive losses in last 50 trades
✅ All 4 validation phases complete (100 / 300 / 500 / 1000 trades)
```

---

## 12. Development Rules

These rules are mandatory across all phases and AI systems working on this project.

```
RULE 1 — COMPLETE FILES ONLY
  Every output file must be complete and directly replaceable.
  No patches. No snippets. No diffs. No "modify this section."
  If a file is changed, the entire file must be output.

RULE 2 — DOCUMENT FIRST
  No module may be coded without its interface defined in
  INTERFACE_CONTRACTS.md and its phase documented in
  PHASE_IMPLEMENTATION_PLAN.md.

RULE 3 — DEPENDENCY ORDER
  Always build in dependency order (see Section 7).
  Never build a consumer before its dependency exists.

RULE 4 — PHASE ISOLATION
  Do not implement future-phase modules during an earlier phase.
  Phase 1 must not contain Supabase calls.
  Phase 2 must not contain Learning Engine logic.
  Phase 3 must not contain Memory Engine logic.

RULE 5 — INTERFACE CONTRACTS ARE FROZEN
  Once INTERFACE_CONTRACTS.md is approved, function signatures
  cannot change without a documented revision to that file.

RULE 6 — MANIFEST UPDATE REQUIRED
  V4_MASTER_MANIFEST.md must be updated at the end of every phase.
  Required fields: completed tasks, created files, modified files, known issues.

RULE 7 — GRACEFUL DEGRADATION
  Every external API call must have a defined fallback behavior.
  The system must never crash due to an API failure.
  SimDataService.js is the fallback of last resort.

RULE 8 — ZH/EN RULE
  Zero hardcoded strings in any non-i18n file.
  All user-facing text must use t('namespace.key').

RULE 9 — AUDIT TRAIL
  Every signal generated must write to signal_audit_log (Phase 5+).
  signal_audit_log is immutable — no UPDATE, no DELETE ever.

RULE 10 — APPROVAL GATE
  Each phase plan must be approved before coding begins.
  Architecture changes require a freeze revision.
  Weight changes in Learning Engine require manual user approval.

RULE 11 — RECOVERABILITY
  Any AI system (Claude, ChatGPT, Gemini) must be able to continue
  development from this document alone.
  Every decision must be documented; no tribal knowledge.
```

---

## 13. Known Issues

| ID | Description | Severity | Phase to Resolve | Status |
|----|-------------|----------|-----------------|--------|
| K-001 | K-line chart blank when Twelve Data API key entered (v3.1 bug) | Critical | Resolved in v3.2 | ✅ Resolved |
| K-002 | OANDA API registration failures; replaced with Twelve Data | Critical | Resolved in v3.1 | ✅ Resolved |
| K-003 | Chart.js `candlestick` controller not registered error | Critical | Resolved in v3.2 (switched to TradingView) | ✅ Resolved |
| K-004 | Canvas reuse error on refresh in v3.1 | High | Resolved in v3.2 (createMainChart/updateMainChart pattern) | ✅ Resolved |
| K-005 | All data simulated in v3.2 — no live macro/news/COT | Medium | Phase 6 | ⏳ Planned |
| K-006 | No persistent storage — all state lost on page refresh | Medium | Phase 5 | ⏳ Planned |

---

*This document must be updated at the end of every development phase.*  
*An outdated manifest is a project risk.*  
*Last updated: 2026-06 | Phase: 0 (Documentation)*
