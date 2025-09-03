import { useState, useEffect, useRef } from 'react';
import { useCurrencySettings } from '../../../currency/hooks/useCurrencySettings';
import { CURRENCY_OPTIONS } from '../../../currency/types/currency.types';
import type { NewExpenseForm } from '../../types/expense.types';
import type { Currency } from '../../../currency/types/currency.types';

export interface FormError {
  type: 'validation' | 'submission' | 'network';
  message: string;
}

interface ExpenseFormProps {
  onSubmit: (expense: NewExpenseForm) => void | Promise<void>;
  loading?: boolean;
  className?: string;
  onError?: (error: FormError) => void;
}

export function ExpenseForm({ onSubmit, loading = false, className = '', onError }: ExpenseFormProps) {
  const { defaultCurrency } = useCurrencySettings();
  
  const [spendText, setSpendText] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update currency when default currency changes
  useEffect(() => {
    setSelectedCurrency(defaultCurrency);
  }, [defaultCurrency]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [errors, setErrors] = useState<{ spendText?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const parseSpendText = (text: string): { item: string; amount: string; isValid: boolean } => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { item: '', amount: '', isValid: false };
    }

    // Check if the entire text is just a number first
    const numericPattern = /^\d+(?:\.\d{1,2})?$/;
    if (numericPattern.test(trimmed)) {
      return { item: 'Expense', amount: trimmed, isValid: true };
    }

    // Pattern to match amount anywhere in the text, optionally followed by currency name
    // This handles: "kratom 150 greenhigh", "150 baht", "coffee 25.50", "150", etc.
    const amountPattern = /(\d+(?:\.\d{1,2})?)\s*(?:baht|dollars?|usd|thb|\$|฿)?/gi;
    const matches = Array.from(trimmed.matchAll(amountPattern));

    if (matches.length > 0) {
      // Use the first amount found
      const match = matches[0];
      const amount = match[1];
      
      // Remove the matched amount (and optional currency) from the text to get the item description
      const item = trimmed.replace(match[0], '').trim().replace(/\s+/g, ' ');
      
      return { 
        item: item || 'Expense', 
        amount, 
        isValid: true 
      };
    }
    
    // No amount found, treat as invalid
    return { item: trimmed, amount: '', isValid: false };
  };

  const validateForm = (): boolean => {
    const newErrors: { spendText?: string } = {};

    const trimmed = spendText.trim();
    if (!trimmed) {
      newErrors.spendText = 'Spend description is required';
      setErrors(newErrors);
      return false;
    }

    if (trimmed.length > 255) {
      newErrors.spendText = 'Spend description must be less than 255 characters';
      setErrors(newErrors);
      return false;
    }

    const parsed = parseSpendText(trimmed);
    if (!parsed.isValid) {
      newErrors.spendText = 'Please include an amount (e.g., "Coffee 150" or just "150")';
      setErrors(newErrors);
      return false;
    }

    const numAmount = parseFloat(parsed.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.spendText = 'Amount must be greater than 0';
      setErrors(newErrors);
      return false;
    }

    if (numAmount > 1000000) {
      newErrors.spendText = 'Amount must be less than 1,000,000';
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [ExpenseForm] Starting form submission');
    console.log('📝 [ExpenseForm] Raw input:', { spendText, selectedCurrency });
    
    setSubmitAttempted(true);
    setSubmitError(null);
    
    // Clear any previous submit errors
    if (submitError) {
      setSubmitError(null);
    }
    
    console.log('✅ [ExpenseForm] Validating form...');
    if (!validateForm()) {
      console.error('❌ [ExpenseForm] Form validation failed');
      onError?.({
        type: 'validation',
        message: 'Please fix the errors above before submitting.'
      });
      return;
    }
    console.log('✅ [ExpenseForm] Form validation passed');

    // Parse the spend text to extract item and amount
    console.log('🔍 [ExpenseForm] Parsing spend text...');
    const parsed = parseSpendText(spendText);
    console.log('📊 [ExpenseForm] Parsed data:', parsed);
    
    const formData: NewExpenseForm = {
      item: parsed.item,
      amount: parsed.amount,
      currency: selectedCurrency,
    };
    
    console.log('📤 [ExpenseForm] Final form data:', formData);

    try {
      console.log('🎯 [ExpenseForm] Calling onSubmit handler...');
      await onSubmit(formData);
      
      console.log('✅ [ExpenseForm] Expense submitted successfully!');
      
      // Reset form on successful submission
      setSpendText('');
      setSelectedCurrency(defaultCurrency);
      setErrors({});
      setSubmitAttempted(false);
      setSubmitError(null);
      
      console.log('🔄 [ExpenseForm] Form reset completed');
      
    } catch (error: any) {
      console.error('❌ [ExpenseForm] Error submitting expense:', error);
      console.error('❌ [ExpenseForm] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to save expense. Please try again.';
      let errorType: FormError['type'] = 'submission';
      
      // Handle specific error types
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        errorType = 'network';
      } else if (error?.message?.includes('auth')) {
        errorMessage = 'Authentication error. Please log in and try again.';
        errorType = 'submission';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      onError?.({
        type: errorType,
        message: errorMessage
      });
    }
  };

  const handleSpendTextChange = (value: string) => {
    setSpendText(value);
    
    // Clear field error when user starts typing
    if (errors.spendText) {
      setErrors({});
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
    
    // Validate field in real-time after first submit attempt
    if (submitAttempted) {
      setTimeout(() => {
        validateForm();
      }, 300); // Debounce validation
    }
  };

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDropdownOpen(false);
  };

  const getSelectedCurrencyOption = () => {
    return CURRENCY_OPTIONS.find(option => option.code === selectedCurrency) || CURRENCY_OPTIONS[0];
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Add New Spend</h2>
      </div>

      {/* Submit Error Display */}
      {submitError && (
        <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-danger-600 dark:text-danger-400">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modern Input Field */}
        <div className="relative group">
          {/* Input Container */}
          <div className={`relative flex items-center bg-white dark:bg-gray-900 border-2 rounded-2xl transition-all duration-300 ease-in-out ${
            errors.spendText 
              ? 'border-red-300 dark:border-red-600 shadow-sm' 
              : 'border-gray-200 dark:border-gray-700 group-focus-within:border-primary-400 dark:group-focus-within:border-primary-500 group-focus-within:shadow-lg group-focus-within:shadow-primary-500/10'
          } ${loading ? 'opacity-60' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}>
            
            {/* Currency Selector */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-4 text-gray-600 dark:text-gray-300 transition-all duration-200 ${
                  isDropdownOpen ? 'text-primary-600 dark:text-primary-400' : 'hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                disabled={loading}
                aria-label="Select currency"
              >
                <span className="text-xl font-bold">{getSelectedCurrencyOption().symbol}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Enhanced Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden backdrop-blur-sm">
                  {CURRENCY_OPTIONS.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => handleCurrencySelect(currency.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                        selectedCurrency === currency.code 
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="text-lg font-bold">{currency.symbol}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{currency.code}</div>
                        <div className="text-xs opacity-70">{currency.name}</div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>



            {/* Text Input */}
            <input
              type="text"
              id="spend"
              value={spendText}
              onChange={(e) => handleSpendTextChange(e.target.value)}
              className="flex-1 px-4 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 border-0 text-lg font-semibold tracking-tight"
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {errors.spendText && (
            <div className="flex items-center gap-2 mt-3 px-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{errors.spendText}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !spendText.trim()}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none tracking-tight"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Adding...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Spend
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
