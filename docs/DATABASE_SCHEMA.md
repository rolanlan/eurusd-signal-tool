# ONETO EUR/USD AI Tool — Database Schema

**Version:** V4.0 Final (Revision 1)  
**Database:** Supabase (PostgreSQL)  
**Implementation Phase:** Phase 5  
**Total Tables:** 17  

---

## Table of Contents

1. [ER Diagram](#1-er-diagram)
2. [Table Descriptions](#2-table-descriptions)
3. [Relationship Map](#3-relationship-map)
4. [Indexes Summary](#4-indexes-summary)
5. [Scaling Considerations](#5-scaling-considerations)
6. [Triggers and Constraints](#6-triggers-and-constraints)
7. [Row-Level Security Overview](#7-row-level-security-overview)
8. [Seed Data Requirements](#8-seed-data-requirements)
9. [Migration Order](#9-migration-order)

---

## 1. ER Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   account_profiles  │       │  committee_weights   │
│─────────────────────│       │─────────────────────│
│ id (PK)             │       │ id (PK)              │
│ user_id             │       │ is_active (1 only)   │
│ is_default          │       │ weight_technical     │
│ account_balance     │       │ weight_macro         │
│ risk_profile        │       │ weight_positioning   │
│ max_drawdown_limit  │       │ weight_news          │
│ consecutive_losses  │       │ weight_risk          │
└────────┬────────────┘       │ regime_weights JSONB │
         │ (1:many)           │ min_confidence       │
         │                    └──────────────────────┘
         ▼                             │ (read by)
┌─────────────────────┐               ▼
│  signal_audit_log   │◄─────── ┌─────────────────────┐
│─────────────────────│  (all   │      signals         │
│ id (PK)             │  write) │─────────────────────│
│ signal_id (FK)      │         │ id (PK)              │
│ paper_trade_id (FK) │         │ direction            │
│ event_type          │         │ signal_strength      │
│ event_severity      │         │ confidence           │
│ description_en      │         │ final_score          │
│ triggered_by        │         │ technical_score      │
│ [IMMUTABLE]         │         │ macro_score          │
└─────────────────────┘         │ positioning_score    │
                                 │ news_score           │
                                 │ risk_score           │
┌────────────────────┐           │ entry_price          │
│  market_snapshots  │◄──────────│ stop_loss            │
│────────────────────│ snapshot_id│ take_profit_1       │
│ id (PK)            │           │ take_profit_2        │
│ price              │           │ lot_size             │
│ rsi_14             │           │ market_regime        │
│ macd_hist          │           │ status               │
│ bb_upper/mid/lower │           │ snapshot_id (FK)     │
│ ma20 / ma50        │           │ macro_report_id (FK) │
│ adx_14             │           └──────────┬───────────┘
│ mtf_score          │                      │
│ mtf_state          │               ┌──────┴────────────┐
│ us_de_spread       │               │                   │
│ cot_net_position   │        (1:many)▼           (1:1)  ▼
└────────────────────┘  ┌────────────────────┐  ┌─────────────────┐
                         │  committee_votes   │  │ signal_results  │
┌────────────────────┐   │────────────────────│  │─────────────────│
│   macro_reports    │   │ id (PK)            │  │ id (PK)         │
│────────────────────│   │ signal_id (FK)     │  │ signal_id (FK)  │
│ id (PK)            │   │ agent              │  │ outcome         │
│ signal_id (FK)     │   │ score              │  │ profit_pips     │
│ summary_en         │   │ vote               │  │ profit_r        │
│ summary_zh         │   │ confidence         │  │ exit_reason     │
│ macro_score        │   │ weight_applied     │  │ closed_at       │
│ fed_stance         │   │ was_correct ←──────┼──┤ (triggers       │
│ ecb_stance         │   │ [trigger updated]  │  │  was_correct)   │
│ generated_by       │   └────────────────────┘  └────────┬────────┘
└────────────────────┘                                     │
                                                           ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │     paper_trades     │──────────────►  learning_snapshots  │
        │──────────────────────│  (on close,  │──────────────────────│
        │ id (PK)              │   writes     │ win_rate             │
        │ signal_id (FK)       │   results)   │ profit_factor        │
        │ direction            │              │ agent_win_rates JSONB│
        │ entry_price          │              │ proposed_changes JSONB│
        │ lot_size             │              │ changes_approved     │
        │ validation_phase     │              └──────────────────────┘
        │ status               │
        └──────────────────────┘

MEMORY TABLES (read by agents, written by memory services):
┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ central_bank_memory │  │   news_memory   │  │    cot_history      │
│ Fed/ECB stances     │  │ 24h/7d/30d      │  │ Weekly COT data     │
│ policy_momentum     │  │ sentiment agg.  │  │ z_score_52w         │
│ key_quote           │  │ narrative_shift │  │ extreme positioning │
└─────────────────────┘  └─────────────────┘  └─────────────────────┘
┌─────────────────────────┐  ┌────────────────────────┐
│  market_regime_history  │  │   economic_events      │
│ regime classification   │  │ Calendar events        │
│ weight_adjustment       │  │ AI forecast            │
│ per-regime weights      │  │ surprise_score         │
└─────────────────────────┘  └────────────────────────┘
┌─────────────────────┐
│     news_events     │
│ Per-article records │
│ impact_score        │
│ direction_code      │
│ recency_weight      │
└─────────────────────┘
┌─────────────────────┐
│     api_health      │
│ API status monitor  │
│ rate_limit_used     │
│ fallback_active     │
└─────────────────────┘
```

---

## 2. Table Descriptions

---

### TABLE 01: signals

**Purpose:** Master record for every signal generated. Central FK reference for all downstream tables. One row per signal regardless of outcome.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| timestamp | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| direction | TEXT | CHECK IN ('BUY','SELL') | |
| signal_strength | TEXT | CHECK IN ('STRONG_BUY','BUY','WEAK_BUY','NEUTRAL', 'WEAK_SELL','SELL','STRONG_SELL','NO_TRADE') | 8-state output |
| confidence | INTEGER | CHECK 0–100 | |
| final_score | INTEGER | CHECK 0–100 | Weighted composite |
| technical_score | INTEGER | — | From Technical Analyst |
| macro_score | INTEGER | — | From Macro Analyst |
| positioning_score | INTEGER | — | From Positioning Analyst |
| news_score | INTEGER | — | From News Analyst |
| risk_score | INTEGER | — | From Risk Analyst |
| entry_price | NUMERIC(10,5) | — | |
| stop_loss | NUMERIC(10,5) | — | |
| take_profit_1 | NUMERIC(10,5) | — | |
| take_profit_2 | NUMERIC(10,5) | — | |
| sl_pips | INTEGER | — | |
| tp1_pips | INTEGER | — | |
| tp2_pips | INTEGER | — | |
| rr_ratio | NUMERIC(4,2) | — | |
| lot_size | NUMERIC(6,2) | — | From Risk Manager |
| max_loss_usd | NUMERIC(8,2) | — | |
| expected_profit | NUMERIC(8,2) | — | |
| timeframe | TEXT | CHECK IN ('1H','4H','1D') | |
| market_regime | TEXT | — | Denormalized for query speed |
| session | TEXT | CHECK IN ('london','newyork','asian','overlap','off') | |
| agents_agreeing | INTEGER | — | Count matching direction |
| status | TEXT | CHECK IN ('generated','open','closed','cancelled','no_trade') | |
| macro_report_id | UUID | FK → macro_reports.id | Nullable |
| snapshot_id | UUID | FK → market_snapshots.id | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `timestamp DESC`, `status`, `direction`, `market_regime`, `confidence DESC`

---

### TABLE 02: signal_results

**Purpose:** Trade outcome record. Written when a paper or live trade closes. Append-only — never deleted. Used by Learning Engine and Backtest Engine.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| signal_id | UUID | FK → signals.id UNIQUE | One result per signal |
| outcome | TEXT | CHECK IN ('win','loss','breakeven') | |
| actual_exit | NUMERIC(10,5) | — | |
| profit_pips | INTEGER | — | |
| profit_r | NUMERIC(6,2) | — | Expressed as R multiples |
| profit_usd | NUMERIC(8,2) | — | |
| drawdown_pips | INTEGER | — | Max adverse excursion |
| drawdown_usd | NUMERIC(8,2) | — | |
| trade_duration | INTEGER | — | Minutes from open to close |
| exit_reason | TEXT | CHECK IN ('tp1','tp2','sl','manual','timeout','cancelled') | |
| market_regime_at_close | TEXT | — | |
| price_at_close | NUMERIC(10,5) | — | |
| closed_at | TIMESTAMPTZ | — | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `signal_id`, `outcome`, `closed_at DESC`, `profit_r`

**Trigger:** On INSERT → UPDATE committee_votes SET was_correct = (vote = direction) WHERE signal_id = NEW.signal_id

---

### TABLE 03: market_snapshots

**Purpose:** Complete market state at the moment of signal generation. Enables historical similarity scoring (cosine similarity), backtest replay, and regime analysis.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | NOT NULL |
| price | NUMERIC(10,5) | |
| spread | NUMERIC(6,5) | |
| atr_14 | NUMERIC(8,5) | |
| atr_ratio | NUMERIC(4,2) | vs 30-day average |
| rsi_14 | NUMERIC(6,2) | |
| macd_line | NUMERIC(8,5) | |
| macd_signal | NUMERIC(8,5) | |
| macd_hist | NUMERIC(8,5) | |
| bb_upper | NUMERIC(10,5) | |
| bb_mid | NUMERIC(10,5) | |
| bb_lower | NUMERIC(10,5) | |
| bb_width | NUMERIC(8,5) | |
| bb_width_percentile | NUMERIC(5,2) | vs 30-day range |
| ma20 | NUMERIC(10,5) | |
| ma50 | NUMERIC(10,5) | |
| ma200 | NUMERIC(10,5) | |
| adx_14 | NUMERIC(6,2) | |
| price_vs_ma20 | TEXT | above/below/crossing |
| price_vs_ma50 | TEXT | above/below/crossing |
| market_regime | TEXT | |
| session | TEXT | |
| dxy_level | NUMERIC(8,3) | |
| us10y_yield | NUMERIC(5,3) | |
| de10y_yield | NUMERIC(5,3) | |
| us_de_spread | NUMERIC(5,3) | us10y - de10y |
| vix_level | NUMERIC(6,2) | |
| cot_net_position | INTEGER | |
| cot_change_weekly | INTEGER | |
| cot_extreme | BOOLEAN | |
| news_sentiment_24h | INTEGER | -100 to +100 |
| economic_state | TEXT | expansion/contraction/neutral |
| mtf_1d_bias | NUMERIC(6,2) | MTF Engine 1D output |
| mtf_4h_bias | NUMERIC(6,2) | MTF Engine 4H output |
| mtf_1h_bias | NUMERIC(6,2) | MTF Engine 1H output |
| mtf_score | NUMERIC(6,2) | Weighted MTF composite |
| mtf_state | TEXT | fully_aligned/partially_aligned/primary_only/not_aligned |
| mtf_confidence_adj | INTEGER | -15, 0, +5, or +10 |
| created_at | TIMESTAMPTZ | |

**Indexes:** `timestamp DESC`, `market_regime`, `session`, `mtf_state`

---

### TABLE 04: committee_votes

**Purpose:** Individual agent votes stored per signal. Enables per-agent win rate tracking and Learning Engine weight optimization. `was_correct` is set by trigger after outcome is known.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| signal_id | UUID | FK → signals.id | |
| timestamp | TIMESTAMPTZ | NOT NULL | |
| agent | TEXT | CHECK IN ('technical','macro','positioning','news','risk') | |
| score | INTEGER | CHECK 0–100 | |
| vote | TEXT | CHECK IN ('BUY','SELL','NEUTRAL') | |
| confidence | INTEGER | CHECK 0–100 | |
| weight_applied | NUMERIC(4,2) | — | Regime-adjusted weight used |
| weighted_contrib | NUMERIC(6,2) | — | score × weight_applied |
| reason_1 | TEXT | — | |
| reason_2 | TEXT | — | |
| market_regime | TEXT | — | |
| was_correct | BOOLEAN | — | NULL until trigger fires on signal_results INSERT |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `signal_id`, `agent`, `was_correct`, `market_regime`

---

### TABLE 05: central_bank_memory

**Purpose:** Persistent institutional memory of Fed and ECB policy posture. Macro Agent reads the latest record per bank. `policy_momentum` encodes the direction of recent consecutive stance changes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| timestamp | TIMESTAMPTZ | NOT NULL | |
| bank | TEXT | CHECK IN ('FED','ECB','BOE','BOJ','SNB') | |
| event_type | TEXT | CHECK IN ('meeting','minutes','speech','emergency') | |
| meeting_date | DATE | — | |
| stance | TEXT | CHECK IN ('very_hawkish','hawkish','neutral','dovish','very_dovish') | |
| stance_score | INTEGER | CHECK -100 to +100 | Positive = hawkish for FED = USD bullish |
| rate_current | NUMERIC(5,2) | — | |
| rate_previous | NUMERIC(5,2) | — | |
| rate_change | NUMERIC(4,2) | — | |
| rate_expected_next | NUMERIC(5,2) | — | |
| next_meeting_date | DATE | — | |
| forward_guidance | TEXT | — | max 500 chars |
| key_quote | TEXT | — | max 280 chars, stored in EN |
| policy_momentum | INTEGER | CHECK -3 to +3 | Rolling direction of last 3 stance changes |
| source_url | TEXT | — | |
| analyst_note | TEXT | — | Manual override note |
| fed_to_engine | BOOLEAN | DEFAULT false | Marks if this has been consumed by Decision Engine |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes:** `bank`, `timestamp DESC`, `stance_score`

---

### TABLE 06: news_memory

**Purpose:** Rolling aggregate sentiment across 24h, 7d, and 30d windows. News Agent reads pre-computed aggregates (O(1) lookup) rather than summing individual articles.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | |
| window | TEXT | CHECK IN ('24h','7d','30d') |
| usd_sentiment | INTEGER | -100 to +100 |
| eur_sentiment | INTEGER | -100 to +100 |
| net_direction | TEXT | USD_BULLISH / EUR_BULLISH / NEUTRAL |
| net_score | INTEGER | usd_sentiment - eur_sentiment (-200 to +200) |
| dominant_theme | TEXT | max 100 chars |
| secondary_theme | TEXT | nullable |
| headline_count | INTEGER | |
| high_impact_count | INTEGER | |
| source_breakdown | JSONB | {"reuters":4,"bloomberg":3} |
| decay_applied | BOOLEAN | DEFAULT false |
| narrative_shift | BOOLEAN | DEFAULT false |
| narrative_shift_magnitude | INTEGER | |
| narrative_note | TEXT | max 280 chars |
| fed_to_engine | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | |

**Indexes:** `window`, `timestamp DESC`, `net_direction`

---

### TABLE 07: market_regime_history

**Purpose:** Dedicated regime state log. Decision Engine reads the most recent row to determine weight adjustments before every signal.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | |
| regime | TEXT | trending_bull / trending_bear / ranging / volatile / breakout_up / breakout_down |
| confidence | INTEGER | 0–100 |
| adx_14 | NUMERIC(6,2) | |
| atr_14 | NUMERIC(8,5) | |
| atr_ratio | NUMERIC(4,2) | current / 30-day average |
| bb_width | NUMERIC(8,5) | |
| bb_width_percentile | NUMERIC(5,2) | |
| ma20 | NUMERIC(10,5) | |
| ma50 | NUMERIC(10,5) | |
| price_vs_ma20 | TEXT | above/below/crossing |
| price_vs_ma50 | TEXT | above/below/crossing |
| session | TEXT | |
| regime_duration_minutes | INTEGER | |
| prev_regime | TEXT | |
| transition_trigger | TEXT | What indicator condition caused regime change |
| weight_technical | NUMERIC(4,2) | DEFAULT 0.35 |
| weight_macro | NUMERIC(4,2) | DEFAULT 0.20 |
| weight_positioning | NUMERIC(4,2) | DEFAULT 0.10 |
| weight_news | NUMERIC(4,2) | DEFAULT 0.20 |
| weight_risk | NUMERIC(4,2) | DEFAULT 0.15 |
| position_size_multiplier | NUMERIC(3,2) | DEFAULT 1.00 |
| min_confidence_override | INTEGER | nullable — overrides account_profile setting |
| created_at | TIMESTAMPTZ | |

**Indexes:** `timestamp DESC`, `regime`, `session`

---

### TABLE 08: cot_history

**Purpose:** Weekly CFTC Commitments of Traders data. Positioning Agent reads the last 8 rows (8 weeks) to compute trend direction, extreme positioning flags, and contrarian signals.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| report_date | DATE | UNIQUE NOT NULL — Tuesday of report week |
| published_date | DATE | Following Friday |
| currency | TEXT | DEFAULT 'EUR' |
| contract | TEXT | DEFAULT 'EUR/USD FUTURES' |
| non_comm_long | INTEGER | Speculative longs |
| non_comm_short | INTEGER | Speculative shorts |
| non_comm_net | INTEGER | long - short |
| non_comm_net_chg | INTEGER | Week-over-week change |
| non_comm_net_chg_4w | INTEGER | 4-week cumulative change |
| comm_long | INTEGER | Commercial/hedger longs |
| comm_short | INTEGER | Commercial/hedger shorts |
| comm_net | INTEGER | |
| oi_total | INTEGER | Open interest |
| net_pct_oi | NUMERIC(5,2) | non_comm_net / oi_total × 100 |
| z_score_52w | NUMERIC(5,2) | vs 52-week mean in standard deviations |
| z_score_26w | NUMERIC(5,2) | vs 26-week mean |
| extreme_long | BOOLEAN | z_score_52w > +2.0 |
| extreme_short | BOOLEAN | z_score_52w < -2.0 |
| trend_3w | TEXT | increasing / decreasing / flat |
| signal | TEXT | bullish_eur / bearish_eur / neutral / contrarian_long / contrarian_short |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

**Indexes:** `report_date DESC`

---

### TABLE 09: macro_reports

**Purpose:** AI-generated macro analysis reports. Stored in both English and Chinese. Produced by Macro Agent each decision cycle and displayed in the Committee UI.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| signal_id | UUID | FK → signals.id (nullable for standalone reports) |
| timestamp | TIMESTAMPTZ | |
| report_type | TEXT | pre_signal / weekly / event_driven / manual |
| fed_stance | TEXT | |
| fed_stance_score | INTEGER | |
| ecb_stance | TEXT | |
| ecb_stance_score | INTEGER | |
| rate_diff_direction | TEXT | widening / narrowing / stable |
| rate_diff_value | NUMERIC(5,3) | |
| gdp_outlook | TEXT | positive / negative / neutral |
| inflation_trend | TEXT | rising / falling / stable |
| employment_trend | TEXT | strong / weak / mixed |
| cot_bias | TEXT | |
| cot_z_score | NUMERIC(5,2) | |
| dxy_trend | TEXT | rising / falling / ranging |
| macro_score | INTEGER | 0–100 |
| macro_direction | TEXT | BUY / SELL / NEUTRAL |
| confidence | INTEGER | 0–100 |
| summary_en | TEXT | max 500 chars |
| summary_zh | TEXT | max 500 chars |
| key_risks_en | TEXT | |
| key_risks_zh | TEXT | |
| data_sources | JSONB | {"fred":true,"cot":true,"central_bank_memory":true} |
| generated_by | TEXT | rules_engine / claude_api / manual |
| created_at | TIMESTAMPTZ | |

**Indexes:** `signal_id`, `timestamp DESC`, `macro_direction`

---

### TABLE 10: paper_trades

**Purpose:** Simulated trade records for pre-live system validation. Results written to signal_results on close so Learning Engine treats paper trades identically to live trades.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| signal_id | UUID | FK → signals.id (nullable if manually entered) |
| direction | TEXT | CHECK IN ('BUY','SELL') |
| entry_price | NUMERIC(10,5) | |
| stop_loss | NUMERIC(10,5) | |
| take_profit_1 | NUMERIC(10,5) | |
| take_profit_2 | NUMERIC(10,5) | |
| sl_pips | INTEGER | |
| tp1_pips | INTEGER | |
| tp2_pips | INTEGER | |
| lot_size | NUMERIC(6,2) | From Risk Manager |
| account_balance | NUMERIC(10,2) | At time of entry |
| risk_amount | NUMERIC(8,2) | |
| risk_pct | NUMERIC(4,2) | |
| status | TEXT | CHECK IN ('open','closed','cancelled') |
| exit_price | NUMERIC(10,5) | nullable until closed |
| pnl_pips | INTEGER | nullable until closed |
| pnl_r | NUMERIC(6,2) | nullable until closed |
| pnl_usd | NUMERIC(8,2) | nullable until closed |
| exit_reason | TEXT | tp1 / tp2 / sl / manual / timeout |
| market_regime | TEXT | |
| session | TEXT | |
| validation_phase | INTEGER | CHECK IN (1,2,3,4) — 100/300/500/1000 |
| opened_at | TIMESTAMPTZ | NOT NULL |
| closed_at | TIMESTAMPTZ | nullable |
| duration_minutes | INTEGER | nullable |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

**Indexes:** `status`, `opened_at DESC`, `validation_phase`

---

### TABLE 11: account_profiles

**Purpose:** User account configuration, risk preferences, and capital parameters. Risk Manager reads this table. Enables multi-account support. One row is always marked `is_default = true`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| profile_name | TEXT | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| is_default | BOOLEAN | DEFAULT false — one per user only |
| account_balance | NUMERIC(12,2) | NOT NULL |
| account_currency | TEXT | DEFAULT 'USD' |
| broker_name | TEXT | nullable |
| account_type | TEXT | demo / paper / live — DEFAULT 'paper' |
| risk_profile | TEXT | conservative / standard / aggressive |
| risk_pct_conservative | NUMERIC(4,2) | DEFAULT 1.00 |
| risk_pct_standard | NUMERIC(4,2) | DEFAULT 2.00 |
| risk_pct_aggressive | NUMERIC(4,2) | DEFAULT 5.00 |
| max_risk_per_day | NUMERIC(4,2) | DEFAULT 6.00 |
| max_risk_per_week | NUMERIC(4,2) | DEFAULT 10.00 |
| max_drawdown_limit | NUMERIC(4,2) | DEFAULT 10.00 |
| max_consecutive_losses | INTEGER | DEFAULT 5 |
| max_lot_size | NUMERIC(6,2) | DEFAULT 1.00 |
| min_lot_size | NUMERIC(6,2) | DEFAULT 0.01 |
| max_open_trades | INTEGER | DEFAULT 1 |
| min_confidence | INTEGER | DEFAULT 65 |
| min_rr_ratio | NUMERIC(4,2) | DEFAULT 2.00 |
| preferred_sessions | JSONB | DEFAULT '["london","newyork","overlap"]' |
| blocked_regimes | JSONB | DEFAULT '["volatile"]' |
| preferred_timeframes | JSONB | DEFAULT '["4H","1D"]' |
| total_trades | INTEGER | DEFAULT 0 |
| total_pnl_r | NUMERIC(8,2) | DEFAULT 0.00 |
| total_pnl_usd | NUMERIC(10,2) | DEFAULT 0.00 |
| peak_balance | NUMERIC(12,2) | |
| current_drawdown | NUMERIC(5,2) | DEFAULT 0.00 |
| consecutive_losses | INTEGER | DEFAULT 0 |
| daily_risk_used | NUMERIC(5,2) | DEFAULT 0.00 |
| weekly_risk_used | NUMERIC(5,2) | DEFAULT 0.00 |
| last_reset_date | DATE | DEFAULT CURRENT_DATE |
| language | TEXT | CHECK IN ('en','zh') DEFAULT 'zh' |
| timezone | TEXT | DEFAULT 'Africa/Libreville' |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `user_id`, `is_active`, `is_default`

---

### TABLE 12: api_health

**Purpose:** Monitors the status, response times, and rate limits of every external API. Decision Engine checks this table before each cycle. Enables intelligent graceful degradation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| api_name | TEXT | UNIQUE — twelve_data / fred / newsapi / cftc_cot / forexfactory / finnhub / polygon / fmp / alpha_vantage / claude_api / openai / gemini / supabase |
| status | TEXT | healthy / degraded / down / unknown — DEFAULT 'unknown' |
| last_checked | TIMESTAMPTZ | |
| last_success | TIMESTAMPTZ | |
| last_failure | TIMESTAMPTZ | |
| consecutive_failures | INTEGER | DEFAULT 0 |
| consecutive_successes | INTEGER | DEFAULT 0 |
| response_time_ms | INTEGER | Last successful response |
| response_time_avg | INTEGER | Rolling 10-call average |
| uptime_pct_24h | NUMERIC(5,2) | |
| rate_limit_total | INTEGER | Calls per window from free tier |
| rate_limit_used | INTEGER | DEFAULT 0 |
| rate_limit_window | TEXT | per_minute / per_hour / per_day |
| rate_limit_reset_at | TIMESTAMPTZ | |
| rate_limit_pct_used | NUMERIC(5,2) | GENERATED ALWAYS AS (rate_limit_used::numeric / NULLIF(rate_limit_total,0) * 100) STORED |
| is_critical | BOOLEAN | DEFAULT false — if down, Decision Engine cannot run |
| has_fallback | BOOLEAN | DEFAULT false |
| fallback_api | TEXT | e.g. 'polygon' fallback for 'twelve_data' |
| fallback_active | BOOLEAN | DEFAULT false |
| degraded_threshold | INTEGER | DEFAULT 3 — consecutive failures before 'degraded' |
| down_threshold | INTEGER | DEFAULT 5 — consecutive failures before 'down' |
| last_error_code | TEXT | |
| last_error_message | TEXT | max 280 chars |
| error_count_24h | INTEGER | DEFAULT 0 |
| api_version | TEXT | |
| endpoint_tested | TEXT | URL of health check endpoint |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `api_name UNIQUE`, `status`, `last_checked DESC`

---

### TABLE 13: signal_audit_log

**Purpose:** Immutable, append-only audit trail of every system event. Never updated or deleted after insert. Full transparency for debugging, compliance, and learning.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| signal_id | UUID | FK → signals.id (nullable) |
| paper_trade_id | UUID | FK → paper_trades.id (nullable) |
| account_profile_id | UUID | FK → account_profiles.id (nullable) |
| event_type | TEXT | signal_generated / signal_published / signal_cancelled / signal_no_trade / paper_trade_opened / paper_trade_closed / decision_cycle_start / decision_cycle_complete / regime_change / api_failure / api_recovery / fallback_activated / rate_limit_warning / weight_proposal / weight_approved / weight_applied / confidence_adjusted / similarity_match / drawdown_warning / drawdown_limit_hit / system_halt / risk_reduced / consecutive_loss_warning / api_key_saved / profile_updated / language_changed / manual_override |
| event_severity | TEXT | info / warning / error / critical — DEFAULT 'info' |
| previous_state | JSONB | nullable |
| new_state | JSONB | nullable |
| change_delta | JSONB | nullable |
| description_en | TEXT | NOT NULL — human-readable |
| description_zh | TEXT | nullable |
| agent | TEXT | nullable — which agent triggered this |
| triggered_by | TEXT | system / user / api / learning_engine / risk_manager / decision_engine |
| data_sources_used | JSONB | Which APIs and tables read this cycle |
| api_health_snapshot | JSONB | API statuses at time of event |
| processing_time_ms | INTEGER | |
| error_code | TEXT | nullable |
| error_detail | TEXT | nullable — max 500 chars |

**Indexes:** `timestamp DESC`, `event_type`, `signal_id`, `event_severity`

**Immutability:**
```sql
-- RLS: INSERT only
CREATE POLICY audit_insert_only ON signal_audit_log
  FOR INSERT WITH CHECK (true);
-- No UPDATE or DELETE policy = blocked by default

-- Trigger
CREATE TRIGGER prevent_audit_modification
  BEFORE UPDATE OR DELETE ON signal_audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_exception('Audit log is immutable');
```

---

### TABLE 14: committee_weights

**Purpose:** Active and historical committee weight configurations. Only one row is active at any time. Learning Engine writes proposals; user approves; trigger activates new config.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| config_name | TEXT | NOT NULL |
| is_active | BOOLEAN | DEFAULT false — ONE row active at a time (enforced by trigger) |
| is_default | BOOLEAN | DEFAULT false — factory reset target |
| weight_technical | NUMERIC(4,2) | CHECK 0–1 |
| weight_macro | NUMERIC(4,2) | CHECK 0–1 |
| weight_positioning | NUMERIC(4,2) | CHECK 0–1 |
| weight_news | NUMERIC(4,2) | CHECK 0–1 |
| weight_risk | NUMERIC(4,2) | CHECK 0–1 |
| weight_sum_check | NUMERIC(4,2) | GENERATED — must equal 1.00 (enforced by trigger) |
| regime_weights | JSONB | Per-regime weight overrides (see default below) |
| min_confidence_default | INTEGER | DEFAULT 65 |
| min_confidence_volatile | INTEGER | DEFAULT 75 |
| min_confidence_ranging | INTEGER | DEFAULT 70 |
| min_rr_ratio | NUMERIC(4,2) | DEFAULT 2.00 |
| min_agents_agreeing | INTEGER | DEFAULT 3 |
| source | TEXT | factory_default / learning_proposal / manual_override |
| proposed_by | TEXT | DEFAULT 'system' |
| proposed_at | TIMESTAMPTZ | |
| approved_by | TEXT | DEFAULT 'user' |
| approved_at | TIMESTAMPTZ | |
| activation_reason | TEXT | |
| trades_on_this_config | INTEGER | DEFAULT 0 |
| win_rate_on_this_config | NUMERIC(5,3) | |
| profit_factor_on_this_config | NUMERIC(5,2) | |
| activated_at | TIMESTAMPTZ | |
| deactivated_at | TIMESTAMPTZ | nullable |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `is_active`, `is_default`, `created_at DESC`

**Factory default regime_weights JSONB:**
```json
{
  "trending_bull":  {"technical":0.45,"macro":0.20,"positioning":0.10,"news":0.15,"risk":0.10},
  "trending_bear":  {"technical":0.45,"macro":0.20,"positioning":0.10,"news":0.15,"risk":0.10},
  "ranging":        {"technical":0.25,"macro":0.25,"positioning":0.15,"news":0.20,"risk":0.15},
  "volatile":       {"technical":0.30,"macro":0.15,"positioning":0.05,"news":0.20,"risk":0.30},
  "breakout_up":    {"technical":0.45,"macro":0.20,"positioning":0.10,"news":0.15,"risk":0.10},
  "breakout_down":  {"technical":0.45,"macro":0.20,"positioning":0.10,"news":0.15,"risk":0.10}
}
```

---

### TABLE 15: learning_snapshots

**Purpose:** Periodic analytics summaries written by Learning Engine after every 10 closed trades. Tracks performance evolution. Proposed weight changes require manual approval.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | |
| snapshot_trigger | TEXT | 10_trades / 50_trades / manual / weekly |
| sample_size | INTEGER | Total closed trades analyzed |
| win_rate | NUMERIC(5,3) | |
| loss_rate | NUMERIC(5,3) | |
| breakeven_rate | NUMERIC(5,3) | |
| profit_factor | NUMERIC(5,2) | |
| sharpe_ratio | NUMERIC(5,2) | |
| sortino_ratio | NUMERIC(5,2) | |
| max_drawdown | NUMERIC(5,3) | |
| max_drawdown_r | NUMERIC(5,2) | |
| avg_win_r | NUMERIC(5,2) | |
| avg_loss_r | NUMERIC(5,2) | |
| expectancy_r | NUMERIC(5,2) | |
| avg_rr_achieved | NUMERIC(4,2) | |
| consecutive_losses_max | INTEGER | |
| agent_win_rates | JSONB | {"technical":0.68,"macro":0.55,...} |
| regime_win_rates | JSONB | {"trending_bull":0.72,"ranging":0.48,...} |
| weight_technical | NUMERIC(4,2) | Active weights at snapshot time |
| weight_macro | NUMERIC(4,2) | |
| weight_positioning | NUMERIC(4,2) | |
| weight_news | NUMERIC(4,2) | |
| weight_risk | NUMERIC(4,2) | |
| proposed_changes | JSONB | nullable — requires user approval |
| changes_approved | BOOLEAN | DEFAULT false |
| changes_applied_at | TIMESTAMPTZ | nullable |
| conf_threshold | INTEGER | Active threshold at snapshot time |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `timestamp DESC`, `snapshot_trigger`

---

### TABLE 16: news_events

**Purpose:** Individual news article records. Raw material consumed by NewsMemory service to produce `news_memory` aggregates. `recency_weight` decays exponentially over time.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| timestamp | TIMESTAMPTZ | NOT NULL |
| headline_en | TEXT | |
| headline_zh | TEXT | nullable |
| source | TEXT | |
| category | TEXT | fed / ecb / macro / geopolitical / market / other |
| impact_score | INTEGER | CHECK 1–10 |
| direction | TEXT | Human-readable e.g. "USD Bullish" |
| direction_code | TEXT | USD_POS / USD_NEG / EUR_POS / EUR_NEG / NEUTRAL |
| duration_hours | INTEGER | Expected market impact duration |
| confidence | INTEGER | 0–100 |
| recency_weight | NUMERIC(4,2) | 1.0 at publish; decays to 0 |
| decay_hours | INTEGER | DEFAULT 24 — high impact = 48, low = 8 |
| is_high_impact | BOOLEAN | GENERATED ALWAYS AS (impact_score >= 7) STORED |
| fed_to_memory | BOOLEAN | DEFAULT false |
| fed_to_engine | BOOLEAN | DEFAULT false |
| url | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `timestamp DESC`, `direction_code`, `impact_score DESC`, `is_high_impact`, `fed_to_memory`

---

### TABLE 17: economic_events

**Purpose:** Economic calendar with AI forecast layer. Risk Analyst reads upcoming high-impact events for event proximity scoring. `surprise_score` populated after actual release.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_name | TEXT | |
| currency | TEXT | CHECK IN ('USD','EUR','GBP','JPY') |
| impact_level | TEXT | CHECK IN ('high','medium','low') |
| scheduled_at | TIMESTAMPTZ | NOT NULL |
| timezone | TEXT | DEFAULT 'America/New_York' |
| previous_value | TEXT | |
| consensus_value | TEXT | Market forecast |
| ai_forecast | TEXT | System AI forecast |
| actual_value | TEXT | nullable until released |
| surprise_score | NUMERIC(6,2) | (actual - consensus) / historical_std |
| surprise_direction | TEXT | better / worse / inline / n/a |
| impact_direction | TEXT | USD_BULLISH / EUR_BULLISH / NEUTRAL / MIXED |
| impact_duration | TEXT | e.g. "2-4 hours" |
| fed_to_engine | BOOLEAN | DEFAULT false |
| engine_adjustment | TEXT | What Decision Engine did with this event |
| is_released | BOOLEAN | DEFAULT false |
| language | TEXT | CHECK IN ('en','zh') DEFAULT 'en' |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:** `scheduled_at`, `impact_level`, `currency`, `is_released`

---

## 3. Relationship Map

```
account_profiles (1) ──────► (many) paper_trades
account_profiles (1) ──────► (many) signal_audit_log

signals (1) ──────────────► (1)    signal_results
signals (1) ──────────────► (many) committee_votes
signals (1) ──────────────► (1)    macro_reports (optional)
signals (many) ◄───────────  (1)   market_snapshots

signal_results INSERT ──────► TRIGGER: updates committee_votes.was_correct
committee_weights (1 active) ──► READ BY: DecisionEngine, CommitteeOrchestrator
market_regime_history ─────► DENORMALIZED INTO: signals.market_regime

paper_trades (on close) ────► WRITES: signal_results
signal_results ────────────► READ BY: learning_snapshots computation

news_events ────────────────► AGGREGATED BY: NewsMemory → news_memory
central_bank_memory ────────► READ BY: MacroAnalyst
cot_history ────────────────► READ BY: PositioningAnalyst
economic_events ────────────► READ BY: RiskAnalyst (event proximity)
market_snapshots ───────────► READ BY: LearningEngine (similarity scoring)

signal_audit_log ◄──────────── WRITTEN BY: all modules (immutable)
api_health ◄────────────────── WRITTEN BY: all service calls
```

---

## 4. Indexes Summary

| Table | Indexes |
|-------|---------|
| signals | timestamp DESC, status, direction, market_regime, confidence DESC |
| signal_results | signal_id, outcome, closed_at DESC, profit_r |
| market_snapshots | timestamp DESC, market_regime, session, mtf_state |
| committee_votes | signal_id, agent, was_correct, market_regime |
| central_bank_memory | bank, timestamp DESC, stance_score |
| news_memory | window, timestamp DESC, net_direction |
| market_regime_history | timestamp DESC, regime, session |
| cot_history | report_date DESC |
| macro_reports | signal_id, timestamp DESC, macro_direction |
| paper_trades | status, opened_at DESC, validation_phase |
| account_profiles | user_id, is_active, is_default |
| api_health | api_name UNIQUE, status, last_checked DESC |
| signal_audit_log | timestamp DESC, event_type, signal_id, event_severity |
| committee_weights | is_active, is_default, created_at DESC |
| learning_snapshots | timestamp DESC, snapshot_trigger |
| news_events | timestamp DESC, direction_code, impact_score DESC, is_high_impact |
| economic_events | scheduled_at, impact_level, currency, is_released |

---

## 5. Scaling Considerations

| Table | Rows/Year | Partition By | Archive After | Notes |
|-------|-----------|-------------|---------------|-------|
| signals | ~2,200 | Month (after 10K rows) | 2 years | Keep NO_TRADE signals |
| signal_results | ~2,200 | With signals | Never | Append-only, permanent |
| market_snapshots | ~2,200 | Month (after 5K) | 2 years | Add snapshot_vectors after 5K |
| committee_votes | ~11,000 | Month (after 50K) | 1 year | was_correct must be computed first |
| signal_audit_log | ~110,000 | Month (after 6 mo) | 1 year* | *Signal lifecycle events kept forever |
| news_events | ~7,300 | Month (after 6 mo) | 90 days | Raw source; news_memory is the summary |
| news_memory | ~1,100 | Never | Never | 3 rows per update cycle |
| economic_events | ~500 | Never | Never | Low volume calendar |
| cot_history | ~52 | Never | Never | Seed with 52 weeks; low write frequency |
| central_bank_memory | ~20 | Never | Never | CB meets 6-8× per year per bank |
| market_regime_history | ~1,000 | Never | Never | Regime changes + 4H snapshots |
| macro_reports | ~2,200 | Never (5yr) | Never | One per signal |
| paper_trades | ~1,000 | Never | Never | Bounded by validation gates |
| account_profiles | <10 | Never | Never | Very low volume |
| api_health | ~15 rows | Never | Never | One row per API |
| committee_weights | <50 | Never | Never | Low change frequency |
| learning_snapshots | ~50/yr | Never | Never | Every 10 trades |

---

## 6. Triggers and Constraints

### Trigger 1: committee_votes.was_correct update
```sql
CREATE OR REPLACE FUNCTION update_vote_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE committee_votes
  SET was_correct = (
    vote = (SELECT direction FROM signals WHERE id = NEW.signal_id)
  )
  WHERE signal_id = NEW.signal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vote_accuracy
  AFTER INSERT ON signal_results
  FOR EACH ROW EXECUTE FUNCTION update_vote_accuracy();
```

### Trigger 2: committee_weights single active row
```sql
CREATE OR REPLACE FUNCTION enforce_single_active_weight()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE committee_weights
    SET is_active = false,
        deactivated_at = NOW()
    WHERE is_active = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_active_weight
  BEFORE INSERT OR UPDATE ON committee_weights
  FOR EACH ROW EXECUTE FUNCTION enforce_single_active_weight();
```

### Trigger 3: signal_audit_log immutability
```sql
CREATE OR REPLACE FUNCTION prevent_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'signal_audit_log is immutable. No UPDATE or DELETE allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_modification
  BEFORE UPDATE OR DELETE ON signal_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_changes();
```

### Constraint: committee_weights sum validation
```sql
ALTER TABLE committee_weights
  ADD CONSTRAINT chk_weights_sum
  CHECK (
    ABS((weight_technical + weight_macro + weight_positioning +
         weight_news + weight_risk) - 1.00) < 0.001
  );
```

---

## 7. Row-Level Security Overview

All tables use Supabase Auth user_id for isolation.

```sql
-- Pattern for all user-scoped tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY [table]_user_isolation ON [table_name]
  FOR ALL USING (user_id = auth.uid());

-- signal_audit_log: insert only (no update, no delete)
CREATE POLICY audit_insert_only ON signal_audit_log
  FOR INSERT WITH CHECK (true);

-- committee_weights: readable by all authenticated users
-- (factory default is global; user proposals are scoped)
CREATE POLICY weights_read ON committee_weights
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

## 8. Seed Data Requirements

### seed_committee_weights.sql
```
One row with:
  config_name = 'V4.0 Factory Default'
  is_active = true
  is_default = true
  weight_technical = 0.35, macro = 0.20, positioning = 0.10
  weight_news = 0.20, risk = 0.15
  regime_weights = [full JSON as specified in Table 14]
  min_confidence_default = 65
  min_confidence_volatile = 75
  min_confidence_ranging = 70
  min_rr_ratio = 2.00
  min_agents_agreeing = 3
  source = 'factory_default'
```

### seed_cb_memory.sql
```
Last 12 months of Fed and ECB policy decisions:
  Minimum 4 rows per bank (quarterly meetings)
  Most recent row per bank has fed_to_engine = false (will be consumed)
  policy_momentum computed from last 3 stance changes
```

### seed_cot_history.sql
```
Last 52 weeks of CFTC EUR/USD futures positioning:
  One row per weekly report
  z_score_52w computed from the 52-week dataset
  extreme_long and extreme_short flags computed
  signal computed from z_score and trend_3w
```

---

## 9. Migration Order

Migrations must be executed in this exact order. No skipping.

```
001_signals.sql                 ← No FK dependencies
002_signal_results.sql          ← FK: signals
003_market_snapshots.sql        ← No FK dependencies
004_committee_votes.sql         ← FK: signals
005_central_bank_memory.sql     ← No FK dependencies
006_news_memory.sql             ← No FK dependencies
007_news_events.sql             ← No FK dependencies
008_economic_events.sql         ← No FK dependencies
009_cot_history.sql             ← No FK dependencies
010_market_regime_history.sql   ← No FK dependencies
011_macro_reports.sql           ← FK: signals
012_paper_trades.sql            ← FK: signals
013_learning_snapshots.sql      ← No FK dependencies
014_account_profiles.sql        ← FK: auth.users
015_api_health.sql              ← No FK dependencies
016_signal_audit_log.sql        ← FK: signals, paper_trades, account_profiles
017_committee_weights.sql       ← No FK dependencies
rls/policies.sql                ← After all tables exist
seeds/seed_committee_weights.sql
seeds/seed_cb_memory.sql
seeds/seed_cot_history.sql
```

---

*Schema Version: V4.0-R1 | Phase: 5 (Supabase Integration)*  
*Last updated: 2026-06*
