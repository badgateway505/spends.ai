import { useState } from 'react';
import type { ClassificationResult } from '../../services/classificationService';
import type { NewExpenseForm } from '../../types/expense.types';

interface ExpenseReviewCardProps {
  originalData: NewExpenseForm;
  classification: ClassificationResult;
  onAccept: (finalData: NewExpenseForm) => void;
  onReject: () => void;
  onModify: (modifiedData: NewExpenseForm) => void;
  loading?: boolean;
}

export function ExpenseReviewCard({
  originalData,
  classification,
  onAccept,
  onReject,
  onModify,
  loading = false
}: ExpenseReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<NewExpenseForm>(() => {
    // Start with AI-enhanced data
    return {
      item: classification.item || originalData.item,
      amount: classification.amount?.toString() || originalData.amount,
      currency: classification.currency || originalData.currency,
      merchant: classification.merchant || originalData.merchant || '',
      group_id: classification.group?.id || originalData.group_id,
      tag_id: classification.tag?.id || originalData.tag_id,
    };
  });

  const hasChanges = () => {
    return (
      classification.item !== originalData.item ||
      classification.merchant !== originalData.merchant ||
      classification.amount?.toString() !== originalData.amount ||
      classification.currency !== originalData.currency ||
      classification.group?.id !== originalData.group_id ||
      classification.tag?.id !== originalData.tag_id
    );
  };

  const handleAccept = () => {
    onAccept(editData);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onModify(editData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to classification data
    setEditData({
      item: classification.item || originalData.item,
      amount: classification.amount?.toString() || originalData.amount,
      currency: classification.currency || originalData.currency,
      merchant: classification.merchant || originalData.merchant || '',
      group_id: classification.group?.id || originalData.group_id,
      tag_id: classification.tag?.id || originalData.tag_id,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600 dark:text-success-400';
    if (confidence >= 0.6) return 'text-warning-600 dark:text-warning-400';
    return 'text-danger-600 dark:text-danger-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!hasChanges()) {
    // If AI didn't suggest any changes, just show a simple confirmation
    return (
      <div className="card p-6 border-2 border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ready to Save</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your expense looks good as entered</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{originalData.item}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{originalData.currency} {originalData.amount}</span>
            </div>
            {originalData.merchant && (
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Merchant:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{originalData.merchant}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Expense
              </>
            )}
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 border-2 border-primary-200 dark:border-primary-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Suggestions</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
            <span className={`text-sm font-medium ${getConfidenceColor(classification.confidence)}`}>
              {getConfidenceText(classification.confidence)} ({Math.round(classification.confidence * 100)}%)
            </span>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors duration-200"
          >
            Edit
          </button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Description
            </label>
            <input
              type="text"
              value={editData.item}
              onChange={(e) => setEditData(prev => ({ ...prev, item: e.target.value }))}
              className="form-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={editData.amount}
                onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
                className="form-input"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={editData.currency}
                onChange={(e) => setEditData(prev => ({ ...prev, currency: e.target.value as 'THB' | 'USD' }))}
                className="form-input"
              >
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {editData.merchant !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Merchant (Optional)
              </label>
              <input
                type="text"
                value={editData.merchant || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, merchant: e.target.value }))}
                className="form-input"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {classification.item !== originalData.item && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">Item Description</div>
              <div className="text-xs text-blue-600 dark:text-blue-300 line-through">{originalData.item}</div>
              <div className="text-sm text-blue-900 dark:text-blue-100">{classification.item}</div>
            </div>
          )}

          {classification.merchant && classification.merchant !== originalData.merchant && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">Merchant</div>
              <div className="text-sm text-green-900 dark:text-green-100">{classification.merchant}</div>
            </div>
          )}

          {classification.amount && classification.amount.toString() !== originalData.amount && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">Amount</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300 line-through">{originalData.currency} {originalData.amount}</div>
              <div className="text-sm text-yellow-900 dark:text-yellow-100">{classification.currency} {classification.amount}</div>
            </div>
          )}

          {classification.group && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-1">Category</div>
              <div className="text-sm text-purple-900 dark:text-purple-100">{classification.group.name}</div>
              {classification.group.description && (
                <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">{classification.group.description}</div>
              )}
            </div>
          )}

          {classification.reasoning && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">AI Reasoning</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{classification.reasoning}</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="btn-primary flex-1"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="btn-secondary"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept & Save
                </>
              )}
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="btn-secondary"
            >
              Use Original
            </button>
          </>
        )}
      </div>
    </div>
  );
}
