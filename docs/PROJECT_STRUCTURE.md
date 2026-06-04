一、完整文件树 Full Project Tree
oneto-eurusd-v4/
│
├── index.html                              ← 唯一入口文件（HTML骨架，无内联JS/CSS）
│
├── src/                                    ← 所有源码模块
│   │
│   ├── i18n/                               ← 国际化层（Phase 1）
│   │   ├── en.json                         ← 英文字符串（source of truth）
│   │   ├── zh.json                         ← 中文字符串（display layer）
│   │   └── i18n.js                         ← t(), setLang(), getLang(), formatters
│   │
│   ├── utils/                              ← 纯函数工具层（Phase 1）
│   │   ├── indicators.js                   ← MA/EMA/RSI/MACD/BB/ATR/ADX 纯数学
│   │   ├── formatters.js                   ← 价格/点数/百分比/日期格式化
│   │   └── validators.js                   ← 信号验证/输入校验/账户校验
│   │
│   ├── services/                           ← 外部数据服务层（Phase 1 + 6）
│   │   ├── SimDataService.js               ← 模拟K线生成器（永久兜底）[Phase 1]
│   │   ├── TwelveDataService.js            ← Twelve Data API客户端 [Phase 1]
│   │   ├── FREDService.js                  ← 美联储宏观数据 [Phase 6]
│   │   ├── NewsAPIService.js               ← 新闻标题抓取 [Phase 6]
│   │   ├── COTService.js                   ← CFTC持仓数据解析 [Phase 6]
│   │   ├── CalendarService.js              ← 经济日历 [Phase 6]
│   │   └── DataNormalizer.js               ← 多源数据统一格式转换 [Phase 6]
│   │
│   ├── state/                              ← 状态管理层（Phase 1）
│   │   ├── AppState.js                     ← 全局运行时状态中心
│   │   └── AccountState.js                 ← 账户资金/风险配置/连亏追踪
│   │
│   ├── core/                               ← 核心引擎层（Phase 2–3）
│   │   ├── MTFEngine.js                    ← 多周期对齐引擎（决策前门） [Phase 2]
│   │   ├── RegimeEngine.js                 ← 市场状态分类引擎 [Phase 2]
│   │   ├── DecisionEngine.js               ← 8状态信号决策引擎 [Phase 3]
│   │   ├── RiskManager.js                  ← 仓位计算/动态风控 [Phase 3]
│   │   └── LearningEngine.js               ← 历史学习/权重优化 [Phase 7]
│   │
│   ├── agents/                             ← AI委员会代理层（Phase 2）
│   │   ├── TechnicalAnalyst.js             ← 技术分析代理（权重35%）
│   │   ├── MacroAnalyst.js                 ← 宏观分析代理（权重20%）
│   │   ├── PositioningAnalyst.js           ← 持仓分析代理（权重10%）
│   │   ├── NewsAnalyst.js                  ← 新闻情绪代理（权重20%）
│   │   ├── RiskAnalyst.js                  ← 风险评估代理（权重15%）
│   │   └── CommitteeOrchestrator.js        ← 委员会调度器（整合5代理输出）
│   │
│   ├── memory/                             ← 记忆层（Phase 6）
│   │   ├── CentralBankMemory.js            ← 央行政策记忆（Fed/ECB）
│   │   ├── NewsMemory.js                   ← 滚动情绪记忆（24h/7d/30d）
│   │   ├── EconomicMemory.js               ← 经济惊喜分数历史
│   │   └── COTMemory.js                    ← CFTC持仓历史记忆
│   │
│   ├── components/                         ← UI组件层（Phase 4）
│   │   ├── HeroPanel.js                    ← 价格+信号箭头+置信度环
│   │   ├── CommitteePanel.js               ← 5代理卡片+投票结果
│   │   ├── DecisionPanel.js                ← 决策流程图+MTF对齐面板
│   │   ├── RiskManagerPanel.js             ← 深色风控卡+实时计算
│   │   ├── KLinePanel.js                   ← TradingView K线（v3.2修复）
│   │   ├── PaperTradePanel.js              ← 模拟交易提交+记录展示
│   │   ├── MacroReportPanel.js             ← AI宏观报告（ZH+EN） [Phase 6]
│   │   ├── BacktestPanel.js                ← 高级回测+可展开记录 [Phase 7]
│   │   ├── LearningPanel.js                ← 学习引擎+权重优化记录 [Phase 7]
│   │   └── SettingsPanel.js                ← API Key+账户+语言设置
│   │
│   └── database/                           ← 数据库访问层（Phase 5）
│       ├── supabaseClient.js               ← Supabase连接初始化
│       ├── signalsRepo.js                  ← signals + signal_results CRUD
│       ├── committeeRepo.js                ← committee_votes 读写
│       ├── memoryRepo.js                   ← CB/新闻/经济记忆读写
│       ├── cotRepo.js                      ← cot_history 读写
│       ├── regimeRepo.js                   ← market_regime_history 读写
│       ├── macroReportRepo.js              ← macro_reports 读写
│       ├── paperTradeRepo.js               ← paper_trades CRUD
│       └── learningRepo.js                 ← learning_snapshots 读写
│
├── styles/                                 ← 样式层（Phase 4）
│   ├── base.css                            ← CSS变量/重置/字体/色彩系统
│   ├── layout.css                          ← 侧边栏/顶栏/内容区/栅格
│   ├── components.css                      ← Panel/Card/Tag/Badge/Button/Toggle
│   ├── risk-manager.css                    ← 深色渐变卡片/风险专属样式
│   ├── committee.css                       ← 代理卡片/评分条/投票徽章
│   ├── decision.css                        ← 流程图/MTF面板/解释网格
│   ├── kline.css                           ← TradingView容器/子图面板
│   └── paper-trade.css                     ← 交易日志/验证进度/提交表单
│
├── supabase/                               ← 数据库层（Phase 5）
│   ├── migrations/
│   │   ├── 001_signals.sql
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
├── tests/                                  ← 单元测试（未来阶段）
│   ├── core/
│   │   ├── DecisionEngine.test.js
│   │   ├── MTFEngine.test.js
│   │   └── RiskManager.test.js
│   ├── agents/
│   │   ├── TechnicalAnalyst.test.js
│   │   └── CommitteeOrchestrator.test.js
│   └── utils/
│       ├── indicators.test.js
│       └── validators.test.js
│
└── docs/                                   ← 治理文档（Phase 0 ✅）
    ├── V4_ARCHITECTURE_FREEZE.md           ← ✅
    ├── V4_MASTER_MANIFEST.md               ← ✅
    ├── DATABASE_SCHEMA.md                  ← ✅
    ├── API_REPORT.md                       ← ✅
    ├── DEVELOPMENT_LOG.md                  ← ✅
    ├── INTERFACE_CONTRACTS.md              ← ✅
    └── PHASE_IMPLEMENTATION_PLAN.md        ← ✅

────────────────────────────────────────────
总文件数统计
────────────────────────────────────────────
Phase 1 新建文件：   10 个 JS/JSON
Phase 2 新建文件：    9 个 JS
Phase 3 新建文件：    5 个 JS
Phase 4 新建文件：   17 个 HTML/CSS/JS
Phase 5 新建文件：   22 个 SQL/JS
Phase 6 新建文件：   11 个 JS
Phase 7 新建文件：    5 个 JS
文档文件：            7 个 MD
────────────────────────────────────────────
总计：              86 个文件（不含测试）
────────────────────────────────────────────

二、模块依赖关系图
════════════════════════════════════════════════════════
构建层级：从下往上，箭头方向 = "被依赖"
════════════════════════════════════════════════════════

LEVEL 0 ── 无任何依赖（最底层，最先构建）
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  en.json    │  │  zh.json    │  │validators.js│  │indicators.js│
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

LEVEL 1 ── 仅依赖 Level 0
┌─────────────────┐   ┌─────────────────┐   ┌───────────────────┐
│    i18n.js      │   │  formatters.js  │   │  SimDataService.js│
│ (needs en+zh)   │   │  (needs i18n)   │   │ (needs indicators)│
└─────────────────┘   └─────────────────┘   └───────────────────┘

LEVEL 2 ── 依赖 Level 0 + 1
┌──────────────────────────┐   ┌──────────────────┐
│   TwelveDataService.js   │   │  AccountState.js  │
│ (needs SimData+indicators│   │  (needs i18n)     │
└──────────────────────────┘   └──────────────────┘

LEVEL 3 ── 依赖 Level 0 + 1 + 2
┌───────────────┐   ┌─────────────────┐   ┌───────────────────┐
│  AppState.js  │   │  MTFEngine.js   │   │  RegimeEngine.js  │
│(needs Account │   │(needs indicators│   │(needs indicators  │
│ +TwelveData)  │   │ +TwelveData)    │   │ +AppState)        │
└───────────────┘   └─────────────────┘   └───────────────────┘

LEVEL 4 ── 5个代理（可并行构建，均依赖 Level 3）
┌───────────────┐ ┌────────────┐ ┌──────────────────┐ ┌────────────┐ ┌────────────┐
│ Technical     │ │  Macro     │ │  Positioning     │ │   News     │ │   Risk     │
│ Analyst.js    │ │ Analyst.js │ │  Analyst.js      │ │ Analyst.js │ │ Analyst.js │
│(indicators    │ │(AppState)  │ │(AppState)        │ │(AppState)  │ │(indicators │
│ +AppState)    │ │            │ │                  │ │            │ │ +AppState) │
└───────────────┘ └────────────┘ └──────────────────┘ └────────────┘ └────────────┘

LEVEL 5 ── 依赖全部5个代理 + MTFEngine
┌──────────────────────────────────────────────────────────────────┐
│                  CommitteeOrchestrator.js                         │
│           (needs ALL 5 agents + MTFEngine + AppState)            │
└──────────────────────────────────────────────────────────────────┘

LEVEL 6 ── 依赖 CommitteeOrchestrator + AppState + validators
┌───────────────────────────────────────┐
│           DecisionEngine.js           │
│  (needs Orchestrator + validators     │
│   + AppState + RegimeEngine output)   │
└───────────────────────────────────────┘

LEVEL 7 ── 依赖 DecisionEngine + AccountState + formatters
┌───────────────────────────────────────┐
│             RiskManager.js            │
│  (needs DecisionEngine output         │
│   + AccountState + formatters)        │
└───────────────────────────────────────┘

LEVEL 8 ── 全部7个UI组件（均依赖 i18n + formatters + AppState）
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Hero    │ │Committee │ │Decision  │ │  Risk    │ │  KLine   │ │  Paper   │ │Settings  │
│ Panel   │ │ Panel    │ │ Panel    │ │ Manager  │ │  Panel   │ │  Trade   │ │  Panel   │
│+Decision│ │+Orchestr │ │+Decision │ │ Panel    │ │+TwelveD  │ │  Panel   │ │+Account  │
│+TwelveD │ │          │ │+MTF      │ │+Risk+Acc │ │+indicators│ │+Risk+Acc │ │+i18n     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

LEVEL 9 ── 最终组装
┌──────────────────────────────────────────────────────────────────┐
│                          index.html                              │
│              (depends on ALL components + ALL CSS)               │
└──────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════
关键规则：禁止向下依赖（高层不能被低层引用）
禁止循环依赖（任何两个模块不能互相引用）
════════════════════════════════════════════════════

三、前后端架构图
════════════════════════════════════════════════════════════════════
                    V4.0 前后端架构全景图
════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────┐
│                        用户浏览器 (Browser)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     index.html (入口)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │  侧边栏导航   │  │   顶部状态栏  │  │  语言切换 ZH/EN  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    UI 组件层 (Components)                   │  │
│  │                                                            │  │
│  │  HeroPanel  CommitteePanel  DecisionPanel  RiskManagerPanel│  │
│  │  KLinePanel PaperTradePanel SettingsPanel  [+4 Phase 6-7]  │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          ↕ 读写状态                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   状态管理层 (State)                         │  │
│  │                                                            │  │
│  │    AppState.js          AccountState.js                    │  │
│  │    (全局运行时状态)      (账户/风险配置)                     │  │
│  │    ┌──candles_4h        ┌──account_balance                 │  │
│  │    ├──candles_1d        ├──risk_profile                    │  │
│  │    ├──candles_1h        ├──consecutive_losses              │  │
│  │    ├──currentPrice      └──language ('zh'|'en')            │  │
│  │    ├──isLive                                               │  │
│  │    ├──lastSignal        CustomEvent Bus:                   │  │
│  │    └──weights           'stateUpdated'                     │  │
│  │                         'signalGenerated'                  │  │
│  │                         'regimeChanged'                    │  │
│  │                         'languagechange'                   │  │
│  │                         'profileUpdated'                   │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          ↕                                       │
│  ┌─────────────────── 决策流水线 ─────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌──────────────┐  MTFEngine.run()                        │  │
│  │  │  RegimeEngine│→ NOT_ALIGNED? ──→ NO_TRADE (终止)       │  │
│  │  └──────────────┘                                         │  │
│  │         ↓ 权重调整JSON                                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              CommitteeOrchestrator                   │  │  │
│  │  │  Technical(35%) Macro(20%) Positioning(10%)          │  │  │
│  │  │  News(20%)      Risk(15%)                            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │         ↓ 5票 + 裁定                                      │  │
│  │  ┌──────────────┐         ┌──────────────────────────┐   │  │
│  │  │DecisionEngine│ ──────→ │      RiskManager         │   │  │
│  │  │8态信号输出    │         │ 仓位×4乘数=最终手数       │   │  │
│  │  └──────────────┘         └──────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  i18n 国际化层                              │  │
│  │  en.json ──→ i18n.js ←── zh.json                          │  │
│  │              t('key') → 当前语言字符串                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  本地持久化 (Phase 1–4)                     │  │
│  │  localStorage:                                             │  │
│  │  · td_api_key_eurusd   · account_profile                  │  │
│  │  · paper_trades        · language                         │  │
│  │  · candle_cache_4h     · api_health (stub)                │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────┘
                              ↕ HTTP / HTTPS
┌─────────────────────────────┴────────────────────────────────────┐
│                      外部 API 层 (Browser直连)                    │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │  Twelve Data API │   │   SimDataService  │                    │
│  │  /price          │   │   (本地生成,无网)  │                    │
│  │  /time_series    │   │   永久兜底         │                    │
│  └──────────────────┘   └──────────────────┘                    │
│                                                                  │
│  Phase 6 追加:                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  FRED    │ │ Finnhub  │ │ CFTC COT │ │ ForexFactory RSS │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐                                                    │
│  │Claude API│ (宏观报告生成 ZH+EN)                               │
│  └──────────┘                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   Supabase 云数据库 (Phase 5+)                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (17张表)                         │    │
│  │  signals  signal_results  committee_votes               │    │
│  │  market_snapshots  paper_trades  account_profiles       │    │
│  │  cot_history  central_bank_memory  news_memory          │    │
│  │  market_regime_history  macro_reports                   │    │
│  │  api_health  signal_audit_log  committee_weights        │    │
│  │  learning_snapshots  news_events  economic_events       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌───────────────────┐   ┌───────────────────────────────────┐  │
│  │  Row-Level Security│   │ Triggers (自动执行):              │  │
│  │  per user_id隔离  │   │ · was_correct更新                 │  │
│  │                   │   │ · 单一活跃权重配置                 │  │
│  │                   │   │ · 审计日志不可变                   │  │
│  └───────────────────┘   └───────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════
Phase 1–4: 纯浏览器端 (无服务器, 无Supabase)
Phase 5+:  浏览器 + Supabase (localStorage作为离线兜底)
════════════════════════════════════════════════════

四、数据库连接关系图
════════════════════════════════════════════════════════════════════
              数据库层连接关系（Phase 5 激活，Phase 1–4 localStorage）
════════════════════════════════════════════════════════════════════

应用层模块                     Repository层                  Supabase表
─────────────────────────────────────────────────────────────────

DecisionEngine.js ──────────► signalsRepo.js ─────────────► signals
                                                          ► market_snapshots
                                                          ► committee_votes
                                                          ► signal_audit_log

RiskManager.js ─────────────► signalsRepo.js ─────────────► signals (UPDATE)

CommitteeOrchestrator.js ───► committeeRepo.js ────────────► committee_votes

MacroAnalyst.js ────────────► memoryRepo.js ───────────────► central_bank_memory (READ)
                                                          ► macro_reports (WRITE)

PositioningAnalyst.js ──────► cotRepo.js ──────────────────► cot_history (READ)

NewsAnalyst.js ─────────────► memoryRepo.js ───────────────► news_memory (READ)
                                                          ► news_events (READ)

RegimeEngine.js ────────────► regimeRepo.js ───────────────► market_regime_history

PaperTradePanel.js ─────────► paperTradeRepo.js ───────────► paper_trades
                              signalsRepo.js ─────────────► signal_results (on close)

AccountState.js ────────────► (直接Supabase client) ────────► account_profiles

LearningEngine.js ──────────► learningRepo.js ─────────────► learning_snapshots
                              signalsRepo.js ─────────────► signal_results (READ)
                              committeeRepo.js ────────────► committee_votes (READ)

TwelveDataService.js ───────► (直接写api_health) ────────────► api_health

─────────────────────────────────────────────────────────────────
数据库触发器（自动）：
─────────────────────────────────────────────────────────────────

signal_results INSERT
    └──► TRIGGER: UPDATE committee_votes.was_correct
         WHERE signal_id = NEW.signal_id
         SET was_correct = (vote = direction)

committee_weights UPDATE is_active=true
    └──► TRIGGER: UPDATE all other rows
         SET is_active=false, deactivated_at=NOW()

signal_audit_log UPDATE/DELETE
    └──► TRIGGER: RAISE EXCEPTION '不可变审计日志'

─────────────────────────────────────────────────────────────────
Phase 1–4 数据流向（localStorage替代Supabase）：
─────────────────────────────────────────────────────────────────

AppState.js          → localStorage('candle_cache_4h')
AccountState.js      → localStorage('account_profile')
PaperTradePanel.js   → localStorage('paper_trades')
TwelveDataService.js → localStorage('td_api_key_eurusd')
i18n.js              → localStorage('language')
api_health (stub)    → localStorage('api_health_stub')

Phase 5 迁移：
    localStorage → Supabase （localStorage保留为离线兜底）

─────────────────────────────────────────────────────────────────
连接安全层：
─────────────────────────────────────────────────────────────────

所有表 → Row-Level Security: user_id = auth.uid()
signal_audit_log → INSERT only (RLS)
committee_weights → 权重合计必须等于1.00（触发器校验）
account_profiles  → is_default每用户只能有一行（触发器校验）

五、每个模块职责说明
5.1 i18n 层
文件职责输入输出en.json英文字符串 source of truth。所有key在此定义。—字符串键值对zh.json中文字符串 display layer。完整镜像en.json所有key。—字符串键值对i18n.js运行时语言模块。提供全局t(key)函数。语言切换触发自定义DOM事件，无需刷新页面。key字符串本地化字符串
核心约束： 任何组件/引擎/代理文件中，禁止出现硬编码中英文字符串。所有用户可见文字必须经由t('key')获取。

5.2 Utilities 层
文件职责纯函数indicators.js所有技术指标数学计算。MA/EMA/RSI/MACD/BB/ATR/ADX。无副作用，无import。可在Node/浏览器/测试环境中运行。✅formatters.js所有数字显示格式化。价格(5位小数)、点数、百分比、手数、美元、日期时间。依赖i18n进行本地化单位后缀。✅validators.js输入校验和信号校验。返回{valid:boolean, errors:string[]}。不修改任何状态。✅

5.3 Services 层
文件职责兜底SimDataService.js随机游走K线生成器。永远可用，无网络依赖。是所有数据服务的最终兜底。无需兜底TwelveDataService.jsTwelve Data API客户端。获取实时EUR/USD价格和OHLCV数据。带缓存（价格30秒，K线4分钟）。失败时有序降级：缓存→SimDataService。SimDataServiceFREDService.js美联储经济数据API客户端。获取GDP/CPI/PCE/利率数据。缓存24小时（数据为月度/周度更新）。CB Memory手动值NewsAPIService.js金融新闻标题抓取。每4小时批量获取（每日仅6次请求，免费层内）。或使用Finnhub替代。news_memory缓存COTService.jsCFTC COT CSV解析器。每周五3:30PM EST触发。解析非商业多空净头寸，计算z_score。上周COT缓存CalendarService.js经济日历获取（ForexFactory RSS或FMP）。提取未来7天高/中影响事件。手动日历条目DataNormalizer.js统一格式转换层。确保所有服务返回相同内部格式，隔离外部API格式变化的影响。—

5.4 State 层
文件职责存储AccountState.js用户账户配置管理。资金规模、风险档位、最大回撤限制、连亏追踪、每日已用风险。Phase 1–4用localStorage，Phase 5+同步Supabase。localStorage → SupabaseAppState.js全局运行时状态中心。维护当前K线数据（1H/4H/1D）、实时价格、最新信号、当前状态机、活跃权重配置。通过CustomEvent总线通知组件状态变化，无需组件直接耦合。内存（不持久化）

5.5 Core 引擎层
文件职责关键规则MTFEngine.js多周期对齐引擎。分别计算1D/4H/1H的方向偏差分，加权合并为MTF分数，判定对齐状态。NOT_ALIGNED时返回gate_pass:false，决策引擎立即输出NO_TRADE终止流程。永不抛异常RegimeEngine.js市场状态分类。基于ADX/ATR/BB宽度/均线排列识别6种状态。输出权重调整JSON和仓位乘数，供委员会和风险管理器使用。优先判断VOLATILEDecisionEngine.js8状态信号生成引擎。汇总委员会5票，应用状态调整权重，计算方向得分和置信度，通过6道门控过滤，映射到8态输出。永不抛异常RiskManager.js仓位计算引擎。基于账户规模和止损点数计算基础手数，依次应用4个乘数（状态×连亏×绩效×风险分），执行最小0.01/最大余额/2000的硬限制。永不抛异常LearningEngine.js历史学习引擎（Phase 7）。每10笔平仓交易运行一次。计算5维绩效指标和每代理准确率。生成权重优化建议，必须等待人工审核批准后才能应用。余弦相似度历史匹配置信度修正。仅建议,不自动应用

5.6 Agents 层
文件权重职责Phase 1–4 数据源Phase 6+ 数据源TechnicalAnalyst.js35%技术面评分。MA排列、RSI动能、MACD死金叉、布林带位置、ADX趋势强度。得分0–100，>50偏空。实时OHLCVTwelve DataMacroAnalyst.js20%宏观面评分。美联储/欧央行立场、利差方向、GDP、通胀趋势。生成AI宏观报告（ZH+EN）。硬编码存根FRED + CB MemoryPositioningAnalyst.js10%机构持仓评分。COT净头寸趋势、极端持仓反转信号、DXY相关性、美德利差。硬编码存根COT MemoryNewsAnalyst.js20%新闻情绪评分。24h/7d新闻情绪窗口、指数衰减加权、叙事转变检测。高影响新闻±20分覆盖。硬编码存根News MemoryRiskAnalyst.js15%风险评估评分。ATR波动率、即将发布的经济数据接近度、市场状态风险、VIX。大多数情况下投NEUTRAL票——影响仓位大小而非方向。ATR实时计算VIX + 日历CommitteeOrchestrator.js—委员会调度器。并行运行5个代理，收集投票，加权汇总，整合MTF结果，返回委员会最终裁定。任何代理失败时使用中性兜底（不传播错误）。——

5.7 Memory 层（Phase 6）
文件职责CentralBankMemory.js读写central_bank_memory表。计算最近3次立场变化的政策动量(-3到+3)。为宏观代理提供无需每次查询的立场状态。NewsMemory.js计算并更新24h/7d/30d滚动情绪窗口。应用指数衰减权重。检测叙事转变（情绪30天内变化超过40分）。EconomicMemory.js存储历史经济数据的实际值、共识值和惊喜分数。为风险代理提供"同类事件历史冲击幅度"上下文。COTMemory.js管理52周COT历史。计算z_score（与52周均值的标准差偏离）。标记极端持仓（z>±2）触发反转信号。

5.8 Components 层（Phase 4）
文件职责语言支持HeroPanel.js渲染价格+信号方向箭头+置信度环+决策引擎迷你评分面板。监听stateUpdated事件自动刷新。✅ t()CommitteePanel.js渲染5个代理卡片（评分、投票、理由、权重进度条）+加权投票结果。✅ t()DecisionPanel.js渲染5节点决策流程图+MTF三周期偏差可视化+为什么产生此信号（4类解释）+风险过滤器状态。✅ t()RiskManagerPanel.js渲染深色渐变卡片。输入项（账户规模/止损点数/风险档位）实时更新计算结果（手数/最大亏损/预期盈利/盈亏比/风险等级）。✅ t()KLinePanel.js集成TradingView Lightweight Charts v4（携带v3.2已验证修复：createMainChart一次性初始化+updateMainChart仅更新数据）。MACD/RSI子图使用Chart.js。✅ t()PaperTradePanel.js模拟交易提交表单+交易日志列表+四阶段验证进度条（100/300/500/1000笔）。✅ t()SettingsPanel.jsAPI Key配置+账户参数编辑器+决策引擎参数+语言切换按钮。✅ t()

5.9 Database 层（Phase 5）
文件职责supabaseClient.jsSupabase JS客户端初始化。从localStorage读取URL和anon key。单例模式。signalsRepo.jssignals和signal_results的CRUD操作。封装所有原始SQL/Supabase查询，业务逻辑不接触原始SQL。committeeRepo.jscommittee_votes读写。批量写入5票，查询代理准确率统计。memoryRepo.jscentral_bank_memory/news_memory/economic_events读写。cotRepo.jscot_history读写。查询最近8周数据供持仓代理使用。regimeRepo.jsmarket_regime_history读写。每次状态变化写入一行，每4小时定时快照。macroReportRepo.jsmacro_reports读写。每次决策周期写入一份报告（含中英文摘要）。paperTradeRepo.jspaper_trades全CRUD。平仓时触发signal_results写入。learningRepo.jslearning_snapshots读写。建议变更写入后changes_approved=false，等待用户批准。

六、ZH/EN 国际化架构方案
6.1 总体原则
英文(EN) = 数据层 Source of Truth
中文(ZH) = 显示层 Display Layer
其他语言  = 扩展层 Extension Layer（未来加法国语等）

规则：先写EN，立刻补ZH，两者永远同步
6.2 字符串分层架构
┌────────────────────────────────────────────────────────────────┐
│                       STRING PIPELINE                          │
│                                                                │
│  业务逻辑层                    显示层                          │
│  (engines, agents)            (components)                     │
│                                                                │
│  DecisionEngine.js             HeroPanel.js                   │
│  ┌─────────────────┐          ┌───────────────────────────┐   │
│  │ direction:'SELL'│ ──────► │ t('signal.sell')          │   │
│  │ (内部常量,不显示)│          │ → ZH: "做空 SELL"         │   │
│  └─────────────────┘          │ → EN: "SELL"              │   │
│                                └───────────────────────────┘   │
│                                                                │
│  RiskManager.js                RiskManagerPanel.js            │
│  ┌─────────────────┐          ┌───────────────────────────┐   │
│  │ level:'LOW'     │ ──────► │ t('risk.level.low')       │   │
│  │ (内部枚举)       │          │ → ZH: "低风险 · 建议执行" │   │
│  └─────────────────┘          │ → EN: "LOW RISK · Execute" │  │
│                                └───────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
6.3 en.json 键命名空间设计
json{
  "nav": {
    "dashboard":   "Dashboard",
    "committee":   "AI Committee",
    "decision":    "Decision Engine",
    "risk":        "Risk Manager",
    "kline":       "K-Line Chart",
    "news":        "News Impact",
    "calendar":    "Economic Calendar",
    "backtest":    "Backtest",
    "paper":       "Paper Trading",
    "learning":    "Learning Engine",
    "api":         "API Report",
    "settings":    "Settings"
  },
  "signal": {
    "sell":        "SELL",
    "buy":         "BUY",
    "strength": {
      "STRONG_SELL":  "STRONG SELL",
      "SELL":         "SELL",
      "WEAK_SELL":    "WEAK SELL",
      "NEUTRAL":      "NEUTRAL",
      "WEAK_BUY":     "WEAK BUY",
      "BUY":          "BUY",
      "STRONG_BUY":   "STRONG BUY",
      "NO_TRADE":     "NO TRADE"
    },
    "confidence":  "Confidence",
    "entry":       "Entry Price",
    "sl":          "Stop Loss",
    "tp":          "Take Profit",
    "rr":          "Risk/Reward"
  },
  "risk": {
    "title":         "Risk Manager",
    "balance":       "Account Size",
    "profile":       "Risk Profile",
    "lot":           "Position Size",
    "maxLoss":       "Max Loss",
    "expectedProfit":"Expected Profit",
    "level": {
      "LOW":       "LOW RISK · Proceed",
      "STANDARD":  "STANDARD RISK · Proceed",
      "ELEVATED":  "ELEVATED RISK · Caution",
      "HIGH":      "HIGH RISK · Warning"
    }
  },
  "agents": {
    "technical": {
      "name": "Technical Analyst",
      "role": "MA · RSI · MACD · BB"
    },
    "macro": {
      "name": "Macro Analyst",
      "role": "FED · ECB · GDP · CPI"
    },
    "positioning": {
      "name": "Positioning Analyst",
      "role": "COT · DXY · Yield Spread"
    },
    "news": {
      "name": "News Analyst",
      "role": "Reuters · Bloomberg · ECB"
    },
    "risk": {
      "name": "Risk Analyst",
      "role": "ATR · Volatility · Events"
    }
  },
  "regime": {
    "trending_bull":  "Trending Bull",
    "trending_bear":  "Trending Bear",
    "ranging":        "Ranging",
    "volatile":       "Volatile",
    "breakout_up":    "Breakout Up",
    "breakout_down":  "Breakout Down"
  },
  "mtf": {
    "title":               "Multi-Timeframe Alignment",
    "fully_aligned":       "3TF CONFIRMED",
    "partially_aligned":   "2TF CONFIRMED",
    "primary_only":        "COUNTER-TREND ⚠️",
    "not_aligned":         "NOT ALIGNED — Signal Suppressed"
  },
  "common": {
    "loading":    "Loading...",
    "save":       "Save",
    "cancel":     "Cancel",
    "apply":      "Apply",
    "approve":    "Approve",
    "refresh":    "Refresh",
    "connect":    "Connect",
    "live":       "LIVE",
    "simulated":  "SIMULATED",
    "stale":      "STALE DATA ⚠️"
  },
  "errors": {
    "no_api_key":        "Please configure your API Key in Settings",
    "api_failed":        "API connection failed — using fallback data",
    "invalid_sl":        "Invalid stop loss distance",
    "drawdown_halt":     "System halted — drawdown limit reached",
    "insufficient_data": "Insufficient data for analysis"
  }
}
6.4 语言切换运行流程
用户点击 [ZH | EN] 按钮
         ↓
SettingsPanel.js 调用 setLang('zh')
         ↓
i18n.js:
  1. localStorage.setItem('language', 'zh')
  2. window.dispatchEvent(new CustomEvent('languagechange'))
         ↓
所有已挂载组件监听 'languagechange' 事件
         ↓
每个组件调用自身 render() 方法
         ↓
render() 内部所有 t('key') 重新求值
         ↓
DOM 更新（不刷新页面，不重新请求数据）

注：K线数据不重新获取，AI报告从数据库读取
    对应语言字段（summary_en / summary_zh）
6.5 AI报告双语存储方案
数据库 macro_reports 表：
┌─────────────────────────────────────────┐
│ summary_en  | summary_zh                │
│─────────────┼──────────────────────────│
│ "Fed remains│ "美联储维持鹰派立场，      │
│  hawkish as │  随着利差走阔，欧元区     │
│  rate diff  │  经济数据持续疲软，       │
│  widens..." │  EUR/USD面临下行压力..."  │
└─────────────┴──────────────────────────┘

Phase 1–4: 规则引擎生成（模板替换）
Phase 6+:  Claude API生成（自然语言）

显示规则：
  UI语言 = 'zh' → 显示 summary_zh
  UI语言 = 'en' → 显示 summary_en
  ZH为空时 → 回退显示 summary_en + 标注"(English)"
6.6 未来语言扩展方案
添加法语支持（加蓬法语用户）：

STEP 1: 创建 src/i18n/fr.json
        复制 en.json 结构，翻译所有值

STEP 2: i18n.js 中添加 'fr' 到支持语言数组
        const SUPPORTED = ['en', 'zh', 'fr']

STEP 3: 数据库 macro_reports 添加列
        ALTER TABLE macro_reports ADD COLUMN summary_fr TEXT;

STEP 4: SettingsPanel.js 添加 [FR] 按钮

所需改动：
  ✅ 无需修改任何引擎文件
  ✅ 无需修改任何代理文件
  ✅ 无需修改任何组件逻辑
  仅需：1个JSON + 1行数组 + 1个DB列 + 1个按钮
6.7 i18n 质量保障规则
规则 1: en.json 是唯一权威来源
  zh.json 中存在的 key 必须全部来自 en.json
  zh.json 中不能有 en.json 没有的 key

规则 2: 缺失ZH翻译时静默降级到EN
  t('key') → zh['key'] ?? en['key'] ?? key本身

规则 3: 禁止硬编码检查
  代码审查时：grep -r '"做' src/  → 结果应为空
  代码审查时：grep -r '"SELL' src/  → 结果应为空
  （除 i18n/zh.json 和 i18n/en.json 外）

规则 4: 每次新增UI文字时
  先写 en.json key
  立刻写 zh.json 对应 key
  然后在组件中使用 t('新key')
  三步缺一不可

七、Phase 1 实施建议总结
════════════════════════════════════════════════════════
Phase 1 编码范围（仅以下10个文件，其余所有Phase禁止触碰）
════════════════════════════════════════════════════════

src/i18n/en.json                 ← 全部UI字符串（约120个key）
src/i18n/zh.json                 ← 完整中文镜像
src/i18n/i18n.js                 ← t() / setLang() / formatters
src/utils/indicators.js          ← MA/EMA/RSI/MACD/BB/ATR/ADX
src/utils/formatters.js          ← 价格/点数/百分比格式化
src/utils/validators.js          ← 信号校验/输入校验
src/services/SimDataService.js   ← 模拟K线生成器
src/services/TwelveDataService.js ← API客户端+缓存+降级
src/state/AccountState.js        ← 账户配置+localStorage
src/state/AppState.js            ← 全局状态+事件总线

════════════════════════════════════════════════════════
构建顺序（严格执行依赖层级）：
════════════════════════════════════════════════════════

Step 1: en.json → zh.json → validators.js → indicators.js
Step 2: i18n.js → formatters.js → SimDataService.js
Step 3: TwelveDataService.js → AccountState.js
Step 4: AppState.js

════════════════════════════════════════════════════════
Phase 1 完成验收标准（编码后）：
════════════════════════════════════════════════════════

□ t('signal.sell') = "SELL"(EN) / "做空"(ZH)
□ setLang('en') → getLang() = 'en' → 语言切换事件触发
□ indicators.calcRSI(prices) 返回 0-100 间正确值
□ SimDataService.getCandles(80) 返回80根有效K线
□ TwelveDataService 无API Key时返回模拟数据（不报错）
□ TwelveDataService 有效Key时返回真实价格
□ AccountState.getDefault() 返回含 account_balance:1000 的对象
□ AppState.getCandles('4H') 返回Candle数组
□ AppState.refreshAll() 触发 'stateUpdated' 事件
