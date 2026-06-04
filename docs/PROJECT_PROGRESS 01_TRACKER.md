# ONETO EURUSD AI TOOL V4.0

# PROJECT PROGRESS TRACKER 01

Last Updated: 2026-06-04

────────────────────────────────────
PROJECT STATUS
────────────────────────────────────

Architecture Phase:
COMPLETED

Documentation Phase:
COMPLETED

Phase 1:
IN PROGRESS

Phase 2:
NOT STARTED

Phase 3:
PARTIALLY IMPLEMENTED

Phase 4:
NOT STARTED

Phase 5:
NOT STARTED

Phase 6:
NOT STARTED

Phase 7:
NOT STARTED

────────────────────────────────────
PHASE 0
DOCUMENTATION LAYER
STATUS: COMPLETED
────────────────────────────────────

docs/API_REPORT.md

docs/DATABASE_SCHEMA.md

docs/DEVELOPMENT_LOG.md

docs/INTERFACE_CONTRACTS.md

docs/PHASE_IMPLEMENTATION_PLAN.md

docs/PROJECT_STRUCTURE.md

docs/V4_ARCHITECTURE_FREEZE.md

docs/V4_MASTER_MANIFEST.md

Total:
8 Files

Status:
100% Complete

────────────────────────────────────
PHASE 1
FOUNDATION LAYER
STATUS: 73%
────────────────────────────────────

I18N

src/i18n/en.json
src/i18n/zh.json
src/i18n/i18n.js

Status:
Completed

---

UTILS

src/utils/indicators.js

src/utils/formatters.js

src/utils/validators.js

Status:
Completed

---

SERVICES

Completed:

src/services/SimDataService.js

Pending:

src/services/TwelveDataService.js

Status:
Partial

---

STATE

Pending:

src/state/AppState.js

src/state/AccountState.js

Status:
Missing

---

Current Progress

Completed:
7 Files

Missing:
2 Files

Required To Close Phase 1:

src/state/AppState.js

src/state/AccountState.js

────────────────────────────────────
PHASE 2
AI COMMITTEE LAYER
STATUS: NOT STARTED
────────────────────────────────────

CORE

src/core/MTFEngine.js

src/core/RegimeEngine.js

---

AGENTS

src/agents/TechnicalAnalyst.js

src/agents/MacroAnalyst.js

src/agents/PositioningAnalyst.js

src/agents/NewsAnalyst.js

src/agents/RiskAnalyst.js

src/agents/CommitteeOrchestrator.js

Total:
8 Files

Committee Weights

Technical:
30%

Macro:
20%

Positioning:
20%

News:
15%

Risk:
15%

────────────────────────────────────
PHASE 3
DECISION + EXECUTION LAYER
STATUS: PARTIALLY IMPLEMENTED
────────────────────────────────────

Implemented:

src/core/RiskManager.js

src/core/ExecutionManager.js

src/core/PaperExecution.js

src/core/OandaExecution.js

---

Pending:

src/core/DecisionEngine.js

Total:
5 Files

────────────────────────────────────
PHASE 4
UI LAYER
STATUS: NOT STARTED
────────────────────────────────────

src/components/HeroPanel.js

src/components/CommitteePanel.js

src/components/DecisionPanel.js

src/components/RiskManagerPanel.js

src/components/KLinePanel.js

src/components/PaperTradePanel.js

src/components/MacroReportPanel.js

src/components/BacktestPanel.js

src/components/LearningPanel.js

src/components/SettingsPanel.js

---

CSS

styles/base.css

styles/layout.css

styles/components.css

styles/risk-manager.css

styles/committee.css

styles/decision.css

styles/kline.css

styles/paper-trade.css

Total:
18 Files

────────────────────────────────────
PHASE 5
SUPABASE DATABASE LAYER
STATUS: NOT STARTED
────────────────────────────────────

Database JS

supabaseClient.js

signalsRepo.js

committeeRepo.js

memoryRepo.js

cotRepo.js

regimeRepo.js

macroReportRepo.js

paperTradeRepo.js

learningRepo.js

---

Migrations

001_signals.sql

002_signal_results.sql

003_market_snapshots.sql

004_committee_votes.sql

005_central_bank_memory.sql

006_news_memory.sql

007_news_events.sql

008_economic_events.sql

009_cot_history.sql

010_market_regime_history.sql

011_macro_reports.sql

012_paper_trades.sql

013_learning_snapshots.sql

014_account_profiles.sql

015_api_health.sql

016_signal_audit_log.sql

017_committee_weights.sql

---

Seeds

seed_committee_weights.sql

seed_cb_memory.sql

seed_cot_history.sql

---

RLS

policies.sql

Total:
30 Files

────────────────────────────────────
PHASE 6
MACRO INTELLIGENCE LAYER
STATUS: NOT STARTED
────────────────────────────────────

Memory

CentralBankMemory.js

NewsMemory.js

EconomicMemory.js

COTMemory.js

---

Services

TwelveDataService.js

FREDService.js

NewsAPIService.js

COTService.js

CalendarService.js

DataNormalizer.js

---

UI

MacroReportPanel.js

Total:
11 Files

────────────────────────────────────
PHASE 7
LEARNING LAYER
STATUS: NOT STARTED
────────────────────────────────────

LearningEngine.js

BacktestPanel.js

LearningPanel.js

learningRepo.js

013_learning_snapshots.sql

Total:
5 Files

────────────────────────────────────
CURRENT REPOSITORY STATUS
────────────────────────────────────

Completed Source Files:
26

Pending Source Files:
Remaining Phases

Current Focus:

1.

Finish Phase 1

Required:

src/state/AppState.js

src/state/AccountState.js

2.

Review

3.

Begin Phase 2

4.

Implement AI Committee

────────────────────────────────────
IMPORTANT RULES
────────────────────────────────────

No French

Supported Languages:

EN
ZH

---

Learning Engine

Recommendation Only

Never Auto Modify Production Strategy

Human Approval Required

---

Execution Layer

PaperExecution:
Enabled

OandaExecution:
Interface Only

No Live Trading

---

Market Snapshot Required

Store:

Price

DXY

US10Y

US02Y

VIX

ATR

Market Regime

Committee Votes
