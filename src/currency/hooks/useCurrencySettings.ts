import { useState, useEffect, useCallback } from 'react';
import { UserSettingsService } from '../services/userSettingsService';
import type { UserSettings, UpdateUserSettingsRequest, Currency } from '../types/currency.types';
import { DEFAULT_CURRENCY } from '../types/currency.types';

interface UseCurrencySettingsReturn {
  settings: UserSettings | null;
  defaultCurrency: Currency;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: UpdateUserSettingsRequest) => Promise<void>;
  updateDefaultCurrency: (currency: Currency) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCurrencySettings(): UseCurrencySettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userSettings = await UserSettingsService.getUserSettings();
      setSettings(userSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      console.error('Error fetching currency settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: UpdateUserSettingsRequest) => {
    try {
      setError(null);
      const updatedSettings = await UserSettingsService.updateUserSettings(updates);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err; // Re-throw so components can handle the error
    }
  }, []);

  const updateDefaultCurrency = useCallback(async (currency: Currency) => {
    await updateSettings({ main_currency: currency });
  }, [updateSettings]);

  const refresh = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const defaultCurrency = settings?.main_currency || DEFAULT_CURRENCY;

  return {
    settings,
    defaultCurrency,
    loading,
    error,
    updateSettings,
    updateDefaultCurrency,
    refresh
  };
}
