import { useState } from 'react';
import { useCurrencySettings } from '../hooks/useCurrencySettings';
import { CURRENCY_OPTIONS } from '../types/currency.types';
import type { Currency } from '../types/currency.types';
import { useToast } from '../../ui/hooks/useToast';

export function CurrencySettings() {
  const { settings, defaultCurrency, loading, error, updateDefaultCurrency } = useCurrencySettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleCurrencyChange = async (newCurrency: Currency) => {
    if (newCurrency === defaultCurrency) return;

    try {
      setIsUpdating(true);
      await updateDefaultCurrency(newCurrency);
      toast.success(`Default currency updated to ${newCurrency}`);
    } catch (err) {
      console.error('Failed to update currency:', err);
      toast.error('Failed to update currency settings');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Currency Settings
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Currency Settings
        </h3>
        <div className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Currency Settings
      </h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Default Currency
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose your preferred currency for new expenses
        </p>
        
        <div className="space-y-2">
          {CURRENCY_OPTIONS.map((option) => (
            <label
              key={option.code}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="defaultCurrency"
                value={option.code}
                checked={defaultCurrency === option.code}
                onChange={() => handleCurrencyChange(option.code)}
                disabled={isUpdating}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <div className="flex items-center space-x-2">
                <span className="text-lg">{option.symbol}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.code}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  - {option.name}
                </span>
              </div>
            </label>
          ))}
        </div>
        
        {isUpdating && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Updating currency settings...
          </div>
        )}
      </div>

      {settings && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Current Settings
          </h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Default Currency:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">
                {defaultCurrency} ({CURRENCY_OPTIONS.find(c => c.code === defaultCurrency)?.symbol})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Last Updated:</dt>
              <dd className="text-gray-900 dark:text-white">
                {new Date(settings.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
