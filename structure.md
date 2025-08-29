# spends.ai - Project Structure

<!-- CTX_ANCHOR: PROJECT_OVERVIEW -->
> **Living Document**: This structure evolves as we build the application. Use this to quickly navigate to features, components, and understand the codebase organization.

<!-- CTX_ANCHOR: TABLE_OF_CONTENTS -->
## 📋 CTX Navigation Index

**Frontend Structure:**
- [Core Application](#core-application) - `CTX_ANCHOR: CORE_APPLICATION`
- [Auth Module](#auth-module) - `CTX_ANCHOR: AUTH_MODULE`
- [Expenses Module](#expenses-module) - `CTX_ANCHOR: EXPENSES_MODULE`
- [Categories Module](#categories-module) - `CTX_ANCHOR: CATEGORIES_MODULE`
- [Analytics Module](#analytics-module) - `CTX_ANCHOR: ANALYTICS_MODULE`
- [Currency Module](#currency-module) - `CTX_ANCHOR: CURRENCY_MODULE`
- [Voice Module](#voice-module) - `CTX_ANCHOR: VOICE_MODULE`
- [UI Module](#ui-module) - `CTX_ANCHOR: UI_MODULE`
- [Three Module](#three-module) - `CTX_ANCHOR: THREE_MODULE`
- [PWA Module](#pwa-module) - `CTX_ANCHOR: PWA_MODULE`

**Backend Structure:**
- [Database Schema](#database-schema) - `CTX_ANCHOR: DATABASE_SCHEMA`
- [Edge Functions](#edge-functions) - `CTX_ANCHOR: EDGE_FUNCTIONS`
- [Database Tables](#database-tables) - `CTX_ANCHOR: DATABASE_TABLES`

**Development Guides:**
- [Feature Mapping](#feature-mapping) - `CTX_ANCHOR: FEATURE_MAPPING`
- [Navigation Guide](#navigation-guide) - `CTX_ANCHOR: NAVIGATION_GUIDE`
- [Debugging Guide](#debugging-guide) - `CTX_ANCHOR: DEBUGGING_GUIDE`

---

<!-- CTX_ANCHOR: HIGH_LEVEL_ARCHITECTURE -->
## 🏗️ High-Level Architecture

```
spends.ai/
├── 🎨 Frontend (React PWA)          # /src
├── 🔧 Backend (Supabase)            # /supabase
├── 🤖 AI Services (Edge Functions)   # /supabase/functions
├── 📊 Database (PostgreSQL)         # /supabase/migrations
└── 🚀 Infrastructure & Deployment   # /deploy, /.github
```

---

<!-- CTX_ANCHOR: FRONTEND_STRUCTURE -->
## 📁 Frontend Structure (/src)

<!-- CTX_ANCHOR: CORE_APPLICATION -->
### 🎯 Core Application

```
src/
├── 📱 app/                          # Main app configuration
│   ├── App.tsx                      # Root app component
│   ├── router.tsx                   # Route configuration
│   └── providers.tsx                # Context providers
│
├── 🔐 auth/                         # Authentication system <!-- CTX_ANCHOR: AUTH_MODULE -->
│   ├── components/                  # Auth UI components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── GoogleAuthButton.tsx
│   ├── hooks/                       # Auth-related hooks
│   │   ├── useAuth.ts
│   │   └── useSession.ts
│   ├── store/                       # Auth state management
│   │   └── authStore.ts
│   └── types/                       # Auth type definitions
│       └── auth.types.ts
│
├── 💰 expenses/                     # Core expense functionality <!-- CTX_ANCHOR: EXPENSES_MODULE -->
│   ├── components/                  # Expense-related components
│   │   ├── capture/                 # Expense capture components
│   │   │   ├── ExpenseForm.tsx      # Manual text entry
│   │   │   ├── VoiceCapture.tsx     # Voice recording interface
│   │   │   ├── ReviewCard.tsx       # Review & confirm component
│   │   │   └── VoiceOverlay.tsx     # Full-screen voice interface
│   │   ├── management/              # Expense management
│   │   │   ├── ExpenseList.tsx      # History list component
│   │   │   ├── ExpenseItem.tsx      # Individual expense display
│   │   │   ├── ExpenseEditor.tsx    # Expense editing interface
│   │   │   └── BulkActions.tsx      # Bulk operations
│   │   └── shared/                  # Shared expense components
│   │       ├── AmountInput.tsx      # Currency amount input
│   │       ├── CurrencySelector.tsx # Currency selection
│   │       └── CategorySelector.tsx # Group/tag selection
│   ├── hooks/                       # Expense-related hooks
│   │   ├── useExpenseCapture.ts     # Capture flow logic
│   │   ├── useExpenseHistory.ts     # History & filtering
│   │   ├── useExpenseEdit.ts        # Expense editing
│   │   └── useVoiceRecording.ts     # Voice recording logic
│   ├── services/                    # Expense API services
│   │   ├── expenseService.ts        # CRUD operations
│   │   ├── classificationService.ts # AI classification
│   │   └── voiceService.ts          # STT integration
│   ├── store/                       # Expense state management
│   │   ├── expenseStore.ts          # Main expense store
│   │   └── captureStore.ts          # Capture flow state
│   └── types/                       # Expense type definitions
│       ├── expense.types.ts
│       ├── classification.types.ts
│       └── voice.types.ts
│
├── 🏷️ categories/                   # Groups & Tags management <!-- CTX_ANCHOR: CATEGORIES_MODULE -->
│   ├── components/
│   │   ├── GroupManager.tsx         # Group CRUD interface
│   │   ├── TagManager.tsx           # Tag CRUD interface
│   │   ├── CategoryCreator.tsx      # Inline category creation
│   │   └── ArchiveManager.tsx       # Archive management
│   ├── hooks/
│   │   ├── useGroups.ts
│   │   ├── useTags.ts
│   │   └── useArchive.ts
│   ├── services/
│   │   ├── groupService.ts
│   │   └── tagService.ts
│   ├── store/
│   │   └── categoryStore.ts
│   └── types/
│       └── category.types.ts
│
├── 📊 analytics/                    # Analytics & visualization <!-- CTX_ANCHOR: ANALYTICS_MODULE -->
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx   # Main analytics page
│   │   ├── charts/                  # Chart components
│   │   │   ├── SpendingPieChart.tsx # Group-based pie chart
│   │   │   ├── DailyBarChart.tsx    # Daily spending bars
│   │   │   └── TrendLineChart.tsx   # Spending trends
│   │   ├── filters/                 # Analytics filters
│   │   │   ├── DateRangePicker.tsx  # Date range selection
│   │   │   ├── PeriodSelector.tsx   # 1d/7d/30d/365d presets
│   │   │   └── CategoryFilter.tsx   # Group/tag filtering
│   │   └── insights/                # Analytics insights
│   │       ├── SpendingSummary.tsx  # Summary statistics
│   │       ├── TopCategories.tsx    # Top spending categories
│   │       └── SpendingTrends.tsx   # Trend insights
│   ├── hooks/
│   │   ├── useAnalytics.ts          # Analytics data fetching
│   │   ├── useChartData.ts          # Chart data processing
│   │   └── useInsights.ts           # Insights calculation
│   ├── services/
│   │   └── analyticsService.ts      # Analytics API calls
│   ├── store/
│   │   └── analyticsStore.ts        # Analytics state
│   └── types/
│       └── analytics.types.ts
│
├── 💱 currency/                     # Currency & FX management <!-- CTX_ANCHOR: CURRENCY_MODULE -->
│   ├── components/
│   │   ├── CurrencyConverter.tsx    # Currency conversion display
│   │   ├── FXRateManager.tsx        # FX rate management
│   │   └── FXRateOverride.tsx       # Manual rate override
│   ├── hooks/
│   │   ├── useCurrency.ts           # Currency utilities
│   │   ├── useFXRates.ts            # FX rate management
│   │   └── useCurrencyConversion.ts # Conversion logic
│   ├── services/
│   │   └── fxService.ts             # FX API integration
│   ├── store/
│   │   └── currencyStore.ts         # Currency state
│   ├── utils/
│   │   ├── currencyFormatter.ts     # Currency formatting
│   │   └── conversionCalculator.ts  # Conversion calculations
│   └── types/
│       └── currency.types.ts
│
├── 🎤 voice/                        # Voice & STT functionality <!-- CTX_ANCHOR: VOICE_MODULE -->
│   ├── components/
│   │   ├── VoiceTrigger.tsx         # Mic button component
│   │   ├── VoiceVisualizer.tsx      # Audio visualization
│   │   └── TranscriptDisplay.tsx    # Live transcript
│   ├── hooks/
│   │   ├── useWebSpeech.ts          # Web Speech API
│   │   ├── useFallbackSTT.ts        # Server-side STT
│   │   └── useVoicePermissions.ts   # Microphone permissions
│   ├── services/
│   │   ├── webSpeechService.ts      # Browser STT
│   │   └── fallbackSTTService.ts    # Server STT
│   ├── utils/
│   │   ├── audioProcessor.ts        # Audio processing
│   │   └── languageDetection.ts     # EN/RU detection
│   └── types/
│       └── voice.types.ts
│
├── 🎨 ui/                           # UI Components & Design System <!-- CTX_ANCHOR: UI_MODULE -->
│   ├── components/                  # Reusable UI components
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/                   # Form components
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Button.tsx
│   │   │   └── FormField.tsx
│   │   ├── feedback/                # User feedback
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── data-display/            # Data display components
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Chip.tsx
│   │   └── navigation/              # Navigation components
│   │       ├── Tabs.tsx
│   │       ├── Breadcrumbs.tsx
│   │       └── Pagination.tsx
│   ├── styles/                      # Styling system
│   │   ├── theme.ts                 # Design tokens
│   │   ├── globalStyles.ts          # Global CSS
│   │   └── breakpoints.ts           # Responsive breakpoints
│   ├── hooks/                       # UI-related hooks
│   │   ├── useTheme.ts
│   │   ├── useBreakpoint.ts
│   │   └── useLocalStorage.ts
│   └── utils/                       # UI utilities
│       ├── cn.ts                    # Class name utilities
│       └── formatters.ts            # Display formatters
│
├── 🎭 three/                        # React Three Fiber & 3D <!-- CTX_ANCHOR: THREE_MODULE -->
│   ├── components/
│   │   ├── Scene.tsx                # Main 3D scene
│   │   ├── Background.tsx           # 3D background
│   │   └── Effects.tsx              # Visual effects
│   ├── hooks/
│   │   ├── useThreeScene.ts         # 3D scene management
│   │   └── usePerformanceMode.ts    # Performance optimization
│   ├── utils/
│   │   └── threeHelpers.ts          # Three.js utilities
│   └── types/
│       └── three.types.ts
│
├── 📱 pwa/                          # PWA & Offline functionality <!-- CTX_ANCHOR: PWA_MODULE -->
│   ├── components/
│   │   ├── InstallPrompt.tsx        # PWA install prompt
│   │   ├── OfflineIndicator.tsx     # Network status
│   │   └── UpdateNotification.tsx   # App update notification
│   ├── hooks/
│   │   ├── useNetworkStatus.ts      # Network detection
│   │   ├── useOfflineQueue.ts       # Offline operations
│   │   └── usePWAInstall.ts         # Installation logic
│   ├── services/
│   │   ├── serviceWorker.ts         # SW registration
│   │   ├── syncService.ts           # Background sync
│   │   └── cacheService.ts          # Cache management
│   └── utils/
│       └── offlineQueue.ts          # Offline queue utilities
│
├── 📄 pages/                        # Page components <!-- CTX_ANCHOR: PAGES_MODULE -->
│   ├── Dashboard.tsx                # Main dashboard
│   ├── History.tsx                  # Expense history
│   ├── Analytics.tsx                # Analytics page
│   ├── Settings.tsx                 # User settings
│   ├── Login.tsx                    # Login page
│   └── NotFound.tsx                 # 404 page
│
├── 🔧 utils/                        # Global utilities <!-- CTX_ANCHOR: UTILS_MODULE -->
│   ├── api.ts                       # API client configuration
│   ├── constants.ts                 # App constants
│   ├── helpers.ts                   # General helpers
│   ├── validators.ts                # Validation functions
│   └── storage.ts                   # Local storage utilities
│
├── 🏪 store/                        # Global state management <!-- CTX_ANCHOR: STORE_MODULE -->
│   ├── index.ts                     # Store setup
│   ├── appStore.ts                  # Global app state
│   └── middleware/                  # Zustand middleware
│       ├── persistence.ts           # State persistence
│       └── devtools.ts              # Development tools
│
├── 📝 types/                        # Global TypeScript types <!-- CTX_ANCHOR: TYPES_MODULE -->
│   ├── global.types.ts              # Global type definitions
│   ├── api.types.ts                 # API response types
│   └── common.types.ts              # Common shared types
│
└── 🧪 __tests__/                    # Test files <!-- CTX_ANCHOR: TESTS_MODULE -->
    ├── components/                  # Component tests
    ├── hooks/                       # Hook tests
    ├── services/                    # Service tests
    ├── utils/                       # Utility tests
    └── e2e/                         # End-to-end tests
```

---

<!-- CTX_ANCHOR: BACKEND_STRUCTURE -->
## 🔧 Backend Structure (/supabase)

<!-- CTX_ANCHOR: DATABASE_SCHEMA -->
### 📊 Database Schema

```
supabase/
├── migrations/                      # Database migrations
│   ├── 001_initial_schema.sql       # Core tables (users, spends, etc.)
│   ├── 002_auth_setup.sql           # Authentication setup
│   ├── 003_rls_policies.sql         # Row Level Security
│   ├── 004_fx_rates.sql             # FX rates table
│   ├── 005_groups_tags.sql          # Categories system
│   ├── 006_analytics_views.sql      # Analytics views
│   └── 007_indexes.sql              # Performance indexes
│
├── seed/                            # Seed data
│   ├── sample_groups.sql            # Sample expense groups
│   ├── sample_tags.sql              # Sample tags
│   └── fx_rates_historical.sql      # Historical FX data
│
└── types/                           # Generated TypeScript types
    └── database.types.ts            # Auto-generated from schema
```

<!-- CTX_ANCHOR: EDGE_FUNCTIONS -->
### 🤖 Edge Functions

```
supabase/functions/
├── classify/                        # AI expense classification <!-- CTX_ANCHOR: CLASSIFY_FUNCTION -->
│   ├── index.ts                     # Main classification endpoint
│   ├── providers/                   # AI provider abstractions
│   │   ├── openrouter.ts           # OpenRouter integration
│   │   └── provider.interface.ts    # Provider interface
│   ├── prompts/                     # Classification prompts
│   │   ├── expense-parse.prompt.ts  # Expense parsing prompt
│   │   └── prompt-versions.ts       # Versioned prompts
│   └── utils/
│       ├── confidence.ts            # Confidence scoring
│       └── validation.ts            # Response validation
│
├── fx/                              # Foreign exchange services <!-- CTX_ANCHOR: FX_FUNCTION -->
│   ├── snapshot/                    # Daily FX snapshot
│   │   └── index.ts
│   ├── rates/                       # FX rate management
│   │   └── index.ts
│   └── providers/
│       ├── exchangerate-host.ts     # External FX API
│       └── manual-override.ts       # Manual rate override
│
├── analytics/                       # Analytics aggregation <!-- CTX_ANCHOR: ANALYTICS_FUNCTION -->
│   ├── summary/                     # Summary statistics
│   │   └── index.ts
│   ├── trends/                      # Trend analysis
│   │   └── index.ts
│   └── insights/                    # Spending insights
│       └── index.ts
│
├── stt/                             # Speech-to-text fallback <!-- CTX_ANCHOR: STT_FUNCTION -->
│   ├── index.ts                     # Main STT endpoint
│   ├── whisper/                     # Whisper integration
│   │   └── whisper-client.ts
│   └── utils/
│       └── audio-processing.ts
│
├── sync/                            # Background sync & cron <!-- CTX_ANCHOR: SYNC_FUNCTION -->
│   ├── fx-daily/                    # Daily FX rate fetch
│   │   └── index.ts
│   └── cleanup/                     # Data cleanup tasks
│       └── index.ts
│
└── _shared/                         # Shared function utilities <!-- CTX_ANCHOR: SHARED_FUNCTION_UTILS -->
    ├── supabase.ts                  # Supabase client
    ├── cors.ts                      # CORS handling
    ├── auth.ts                      # Authentication utilities
    ├── errors.ts                    # Error handling
    └── validation.ts                # Request validation
```

---

<!-- CTX_ANCHOR: DATABASE_TABLES -->
## 🗄️ Database Tables & Relationships

<!-- CTX_ANCHOR: CORE_TABLES -->
### Core Tables

```sql
-- Users (handled by Supabase Auth) <!-- CTX_ANCHOR: USERS_TABLE -->
auth.users
├── id (uuid, PK)
├── email
└── created_at

-- User Settings <!-- CTX_ANCHOR: USER_SETTINGS_TABLE -->
user_settings
├── user_id (uuid, FK → auth.users.id)
├── main_currency (text, 'THB'|'USD')
├── include_archived_analytics (boolean)
└── updated_at

-- Expense Groups <!-- CTX_ANCHOR: GROUPS_TABLE -->
groups
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users.id)
├── name (text, unique per user)
├── description (text)
├── archived (boolean)
├── archived_at (timestamptz)
├── created_at (timestamptz)
└── updated_at (timestamptz)

-- Expense Tags <!-- CTX_ANCHOR: TAGS_TABLE -->
tags
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users.id)
├── name (text, unique per user)
├── description (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

-- FX Rates (daily snapshots) <!-- CTX_ANCHOR: FX_RATES_TABLE -->
fx_rates
├── rate_date (date, PK)
├── usd_per_thb (numeric)
├── thb_per_usd (numeric)
├── manual (boolean)
└── fetched_at (timestamptz)

-- Expenses/Spends <!-- CTX_ANCHOR: SPENDS_TABLE -->
spends
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users.id)
├── item (text)
├── amount (numeric) -- stored as integers per memory
├── currency (text, 'THB'|'USD')
├── merchant (text, nullable)
├── group_id (uuid, FK → groups.id, nullable)
├── tag_id (uuid, FK → tags.id, nullable)
├── created_at (timestamptz)
├── user_local_datetime (timestamptz)
├── fx_rate_date (date, FK → fx_rates.rate_date)
├── archived (boolean)
└── archived_at (timestamptz)

-- AI Model Tracking <!-- CTX_ANCHOR: MODEL_RUNS_TABLE -->
model_runs
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users.id)
├── provider (text)
├── model (text)
├── input (jsonb)
├── output (jsonb)
├── cost (numeric)
└── created_at (timestamptz)
```

---

<!-- CTX_ANCHOR: INFRASTRUCTURE -->
## 🚀 Infrastructure & Deployment

<!-- CTX_ANCHOR: GITHUB_ACTIONS -->
### GitHub Actions (.github/workflows/)

```
.github/workflows/
├── ci.yml                          # Continuous Integration
├── deploy-staging.yml              # Staging deployment
├── deploy-production.yml           # Production deployment
├── performance-tests.yml           # Performance testing
└── security-scan.yml               # Security scanning
```

<!-- CTX_ANCHOR: CONFIG_FILES -->
### Configuration Files

```
├── .env.example                     # Environment variables template
├── .env.local                       # Local development config
├── supabase-config.toml             # Supabase configuration
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                   # Dependency lock file
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── vitest.config.ts                 # Test configuration
├── playwright.config.ts             # E2E test configuration
└── workbox-config.js                # PWA/Service Worker config
```

---

<!-- CTX_ANCHOR: FEATURE_MAPPING -->
## 🎯 Feature Mapping by Development Phase

<!-- CTX_ANCHOR: PHASE_0_FOUNDATION -->
### Phase 0: Foundation

- **Auth System**: `/src/auth/`
- **Database Schema**: `/supabase/migrations/001-003`
- **Basic UI Framework**: `/src/ui/components/layout`
- **Project Setup**: Root config files

<!-- CTX_ANCHOR: PHASE_1_CORE_CAPTURE -->
### Phase 1: Core Capture

- **Text Entry**: `/src/expenses/components/capture/ExpenseForm.tsx`
- **AI Classification**: `/supabase/functions/classify/`
- **Groups & Tags**: `/src/categories/`
- **Review Flow**: `/src/expenses/components/capture/ReviewCard.tsx`
- **Currency Foundation**: `/src/currency/`

<!-- CTX_ANCHOR: PHASE_2_VOICE -->
### Phase 2: Voice Integration

- **Voice Recording**: `/src/voice/components/VoiceCapture.tsx`
- **Voice Overlay**: `/src/expenses/components/capture/VoiceOverlay.tsx`
- **STT Services**: `/src/voice/services/` + `/supabase/functions/stt/`

<!-- CTX_ANCHOR: PHASE_3_DATA_MANAGEMENT -->
### Phase 3: Data Management

- **Main Dashboard**: `/src/pages/Dashboard.tsx`
- **History Management**: `/src/expenses/components/management/`
- **Filtering System**: `/src/expenses/hooks/useExpenseHistory.ts`
- **Archive System**: `/src/categories/hooks/useArchive.ts`

<!-- CTX_ANCHOR: PHASE_4_ANALYTICS -->
### Phase 4: Analytics

- **Analytics Dashboard**: `/src/analytics/components/AnalyticsDashboard.tsx`
- **Charts**: `/src/analytics/components/charts/`
- **Analytics Backend**: `/supabase/functions/analytics/`

<!-- CTX_ANCHOR: PHASE_5_POLISH -->
### Phase 5: Polish & Performance

- **PWA Features**: `/src/pwa/`
- **3D Background**: `/src/three/`
- **Performance Optimization**: Build configs, lazy loading
- **Testing Suite**: `/src/__tests__/`

---

<!-- CTX_ANCHOR: NAVIGATION_GUIDE -->
## 🔍 Quick Navigation Guide

<!-- CTX_ANCHOR: DEBUGGING_GUIDE -->
### 🐛 Finding Bugs/Issues

1. **UI Issues**: Check `/src/ui/components/` and `/src/pages/`
2. **API Issues**: Check `/supabase/functions/` and `/src/*/services/`
3. **State Issues**: Check `/src/*/store/` and `/src/*/hooks/`
4. **Database Issues**: Check `/supabase/migrations/`

<!-- CTX_ANCHOR: FEATURE_DEVELOPMENT_GUIDE -->
### ✨ Adding New Features

1. **New Page**: Add to `/src/pages/` and update `/src/app/router.tsx`
2. **New Component**: Add to appropriate feature folder `/src/[feature]/components/`
3. **New API**: Add to `/supabase/functions/` and update `/src/*/services/`
4. **New Database Table**: Add migration to `/supabase/migrations/`

<!-- CTX_ANCHOR: CONFIG_CHANGES_GUIDE -->
### 🔧 Configuration Changes

1. **Environment Variables**: Update `.env.example` and deployment configs
2. **Database Schema**: Create new migration in `/supabase/migrations/`
3. **Build Configuration**: Update `vite.config.ts` or `package.json`
4. **Styling**: Update `/src/ui/styles/theme.ts`

---

<!-- CTX_ANCHOR: MAINTENANCE_CHECKLIST -->
## 📋 Maintenance Checklist

- [ ] Update this structure when adding new features
- [ ] Keep feature folders organized and consistent
- [ ] Maintain clear separation between UI, business logic, and services
- [ ] Document major architectural decisions
- [ ] Keep the dependency graph clean and avoid circular dependencies
- [ ] Regular cleanup of unused components and utilities

---

<!-- CTX_ANCHOR: LLM_NAVIGATION_GUIDE -->
## 🤖 LLM Navigation Guide

This document uses CTX anchors (HTML comments) to help AI assistants navigate the codebase structure efficiently. 

### How to Use CTX Anchors:

**For LLMs/AI Assistants:**
1. Search for `CTX_ANCHOR:` followed by the topic you need
2. Use anchors to jump to relevant sections without reading the entire document
3. Reference anchors when explaining code location to users

**Common CTX Anchor Patterns:**
- `CTX_ANCHOR: [MODULE]_MODULE` - Feature modules (e.g., `AUTH_MODULE`, `EXPENSES_MODULE`)
- `CTX_ANCHOR: [FUNCTION]_FUNCTION` - Backend functions (e.g., `CLASSIFY_FUNCTION`, `FX_FUNCTION`)
- `CTX_ANCHOR: [TABLE]_TABLE` - Database tables (e.g., `SPENDS_TABLE`, `USERS_TABLE`)
- `CTX_ANCHOR: PHASE_[N]_[NAME]` - Development phases (e.g., `PHASE_1_CORE_CAPTURE`)

**Quick Reference Commands:**
- Find auth code: Search `CTX_ANCHOR: AUTH_MODULE`
- Find expense logic: Search `CTX_ANCHOR: EXPENSES_MODULE`
- Find database schema: Search `CTX_ANCHOR: DATABASE_SCHEMA`
- Find debugging guide: Search `CTX_ANCHOR: DEBUGGING_GUIDE`

---

_Last Updated: Initial Version with CTX Anchors - [Date]_
_Next Review: After each major feature addition_
