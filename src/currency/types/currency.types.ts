export type Currency = 'THB' | 'USD';

export interface UserSettings {
  user_id: string;
  main_currency: Currency;
  include_archived_analytics: boolean;
  updated_at: string;
}

export interface UpdateUserSettingsRequest {
  main_currency?: Currency;
  include_archived_analytics?: boolean;
}

export interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$'
  }
];

export const DEFAULT_CURRENCY: Currency = 'THB';
