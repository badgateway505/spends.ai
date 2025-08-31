import { useState, useEffect } from 'react';
import type { ClassificationResult } from '../../services/classificationService';
import type { NewExpenseForm } from '../../types/expense.types';
import { groupService, type Group } from '../../../categories/services/groupService';
import { GroupBadge } from '../../../ui/components/data-display/GroupBadge';

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
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
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

  // Load available groups when component mounts or editing starts
  useEffect(() => {
    if (isEditing && groups.length === 0) {
      loadGroups();
    }
  }, [isEditing, groups.length]);

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const availableGroups = await groupService.getGroups();
      setGroups(availableGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Helper function to get group name by ID (currently unused but may be needed for future features)
  // const getGroupName = (groupId?: string): string => {
  //   if (!groupId) return 'No category';
  //   const group = groups.find(g => g.id === groupId);
  //   return group?.name || 'Unknown category';
  // };

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
      <div className="card p-6 border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Looks Perfect!</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">AI analysis found no improvements needed</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {Math.round(classification.confidence * 100)}% confident
                </span>
              </div>
            </div>
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
        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Enhanced Your Expense
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${classification.confidence >= 0.8 ? 'bg-green-500' : classification.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${getConfidenceColor(classification.confidence)}`}>
                  {getConfidenceText(classification.confidence)} ({Math.round(classification.confidence * 100)}%)
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              by {classification.model || 'AI'}
            </div>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors duration-200 px-3 py-1 rounded-md border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
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

          {/* Group/Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category (Optional)
            </label>
            
            {/* Selected Group Display */}
            {editData.group_id && !groupsLoading && (
              <div className="mb-2">
                {(() => {
                  const selectedGroup = groups.find(g => g.id === editData.group_id);
                  return selectedGroup ? (
                    <GroupBadge
                      name={selectedGroup.name}
                      icon={selectedGroup.icon}
                      color={selectedGroup.color}
                      size="sm"
                      variant="filled"
                    />
                  ) : null;
                })()}
              </div>
            )}
            
            <select
              value={editData.group_id || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, group_id: e.target.value || undefined }))}
              className="form-input"
              disabled={groupsLoading}
            >
              <option value="">No category</option>
              {groupsLoading ? (
                <option disabled>Loading categories...</option>
              ) : (
                groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.icon ? `${group.icon} ` : ''}
                    {group.name}
                  </option>
                ))
              )}
            </select>
            {groupsLoading && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading categories...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {/* AI Changes Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">AI Improvements</h4>
            </div>
            
            <div className="grid gap-3">
              {/* Item Description Changes */}
              {classification.item !== originalData.item && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Enhanced Description</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Original:</span>
                      <span className="line-through bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">{originalData.item}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-500 dark:text-gray-400">AI Improved:</span>
                      <span className="bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded font-medium text-green-800 dark:text-green-200">{classification.item}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Merchant Detection */}
              {classification.merchant && classification.merchant !== originalData.merchant && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Merchant Detected</span>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 px-3 py-2 rounded font-medium text-green-800 dark:text-green-200">
                    {classification.merchant}
                  </div>
                </div>
              )}

              {/* Amount/Currency Changes */}
              {classification.amount && classification.amount.toString() !== originalData.amount && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Amount Corrected</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Original:</span>
                      <span className="line-through bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">{originalData.currency} {originalData.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-500 dark:text-gray-400">AI Corrected:</span>
                      <span className="bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded font-medium text-green-800 dark:text-green-200">{classification.currency} {classification.amount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Assignment */}
              {classification.group && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Smart Category</span>
                  </div>
                  {originalData.group_id && originalData.group_id !== classification.group.id ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">AI Suggested:</div>
                      <GroupBadge
                        name={classification.group.name}
                        icon={classification.group.icon}
                        color={classification.group.color}
                        size="sm"
                        variant="filled"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <GroupBadge
                        name={classification.group.name}
                        icon={classification.group.icon}
                        color={classification.group.color}
                        size="sm"
                        variant="filled"
                      />
                      {classification.group.description && (
                        <div className="text-xs text-purple-600 dark:text-purple-300">{classification.group.description}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          {classification.reasoning && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">AI Analysis</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 italic">"{classification.reasoning}"</div>
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
              className="btn-primary flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-75"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Enhanced Expense...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept AI Suggestions
                </>
              )}
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="btn-secondary px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors duration-200"
            >
              Use Original Instead
            </button>
          </>
        )}
      </div>
    </div>
  );
}
