// Application constants

export const CURRENCIES = {
  THB: 'THB',
  USD: 'USD',
} as const;

export const DEFAULT_CURRENCY = CURRENCIES.THB;

export const API_ENDPOINTS = {
  CLASSIFY: '/v1/classify',
  FX_SNAPSHOT: '/v1/fx/snapshot',
  SPENDS: '/v1/spends',
  GROUPS: '/v1/groups',
  TAGS: '/v1/tags',
  ANALYTICS: '/v1/analytics',
  SETTINGS: '/v1/settings',
} as const;

export const ANALYTICS_PERIODS = {
  ONE_DAY: '1d',
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  ONE_YEAR: '365d',
} as const;

export const VOICE_LANGUAGES = {
  EN: 'en-US',
  RU: 'ru-RU',
} as const;

export const VALIDATION_RULES = {
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT: 0,
  MAX_ITEM_LENGTH: 100,
  MAX_MERCHANT_LENGTH: 100,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_TAG_NAME_LENGTH: 30,
} as const;

export const PERFORMANCE_BUDGETS = {
  INITIAL_JS_SIZE: 180 * 1024, // 180KB
  TTFB_P50: 1000, // 1s
  TTFB_P95: 1800, // 1.8s
  ADD_FLOW_P95: 6000, // 6s
  VOICE_START_LATENCY_P95: 300, // 300ms
} as const;
