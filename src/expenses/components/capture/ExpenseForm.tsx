import { useState, useEffect } from 'react';
import { useCurrencySettings } from '../../../currency/hooks/useCurrencySettings';
import type { NewExpenseForm } from '../../types/expense.types';

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
  
  const [formData, setFormData] = useState<NewExpenseForm>({
    item: '',
    amount: '',
    currency: defaultCurrency,
  });

  // Update currency when default currency changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      currency: defaultCurrency
    }));
  }, [defaultCurrency]);

  const [errors, setErrors] = useState<Partial<Record<keyof NewExpenseForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewExpenseForm, string>> = {};

    // Validate item description
    const itemTrimmed = formData.item.trim();
    if (!itemTrimmed) {
      newErrors.item = 'Item description is required';
    } else if (itemTrimmed.length < 2) {
      newErrors.item = 'Item description must be at least 2 characters';
    } else if (itemTrimmed.length > 255) {
      newErrors.item = 'Item description must be less than 255 characters';
    }

    // Validate amount
    const amountTrimmed = formData.amount.trim();
    if (!amountTrimmed) {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(amountTrimmed);
      if (isNaN(numAmount)) {
        newErrors.amount = 'Amount must be a valid number';
      } else if (numAmount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (numAmount > 1000000) {
        newErrors.amount = 'Amount must be less than 1,000,000';
      } else if (!/^\d+(\.\d{1,2})?$/.test(amountTrimmed)) {
        newErrors.amount = 'Amount can have at most 2 decimal places';
      }
    }

    // Validate currency (should always be valid due to select, but defensive)
    if (!formData.currency || !['THB', 'USD'].includes(formData.currency)) {
      newErrors.currency = 'Please select a valid currency';
    }

    // Validate merchant if provided
    if (formData.merchant && formData.merchant.trim().length > 255) {
      newErrors.merchant = 'Merchant name must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    
    // Clear any previous submit errors
    if (submitError) {
      setSubmitError(null);
    }
    
    if (!validateForm()) {
      onError?.({
        type: 'validation',
        message: 'Please fix the errors above before submitting.'
      });
      return;
    }

    try {
      await onSubmit(formData);
      
      // Reset form on successful submission
      setFormData({
        item: '',
        amount: '',
        currency: 'THB',
      });
      setErrors({});
      setSubmitAttempted(false);
      setSubmitError(null);
      
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      
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

  const handleInputChange = (field: keyof NewExpenseForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Expense</h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Description */}
        <div>
          <label htmlFor="item" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Item Description
          </label>
          <input
            type="text"
            id="item"
            value={formData.item}
            onChange={(e) => handleInputChange('item', e.target.value)}
            placeholder="e.g., Coffee at Starbucks"
            className={`form-input ${errors.item ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={loading}
            autoComplete="off"
          />
          {errors.item && (
            <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.item}</p>
          )}
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`form-input ${errors.amount ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
              disabled={loading}
              autoComplete="off"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value as 'THB' | 'USD')}
              className="form-input"
              disabled={loading}
            >
              <option value="THB">THB (฿)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Expense...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
