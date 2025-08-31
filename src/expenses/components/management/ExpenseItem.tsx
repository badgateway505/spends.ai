import { format, formatDistanceToNow } from 'date-fns';

import { useState, useEffect } from 'react';
import type { ExpenseWithConversions, NewExpenseForm } from '../../types/expense.types';
import { expenseService } from '../../services/expenseService';
import { groupService, type Group } from '../../../categories/services/groupService';
import { useToast } from '../../../ui/hooks/useToast';
import { GroupBadge } from '../../../ui/components/data-display/GroupBadge';

interface ExpenseItemProps {
  expense: ExpenseWithConversions;
  showDate?: boolean;
  preferredCurrency?: 'THB' | 'USD';
  onExpenseUpdated?: (updatedExpense: ExpenseWithConversions) => void;
  onExpenseDeleted?: (expenseId: string) => void;
}

export function ExpenseItem({ 
  expense, 
  showDate = true, 
  preferredCurrency = 'THB',
  onExpenseUpdated,
  onExpenseDeleted
}: ExpenseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<NewExpenseForm>({
    item: expense.item,
    amount: (expense.amount / 100).toString(), // Convert from cents back to normal amount
    currency: expense.currency,
    merchant: expense.merchant || '',
    group_id: expense.group_id || undefined,
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error } = useToast();

  // Load groups when editing starts
  useEffect(() => {
    if (isEditing && groups.length === 0) {
      loadGroups();
    }
  }, [isEditing, groups.length]);

  const loadGroups = async () => {
    try {
      const availableGroups = await groupService.getGroups();
      setGroups(availableGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to original values
    setEditData({
      item: expense.item,
      amount: (expense.amount / 100).toString(),
      currency: expense.currency,
      merchant: expense.merchant || '',
      group_id: expense.group_id || undefined,
    });
  };

  const handleSave = async () => {
    if (!editData.item.trim()) {
      error('Item name is required');
      return;
    }

    const amount = parseFloat(editData.amount);
    if (isNaN(amount) || amount <= 0) {
      error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await expenseService.updateExpense(expense.id, {
        item: editData.item.trim(),
        amount: amount,
        currency: editData.currency,
        merchant: editData.merchant?.trim() || undefined,
        group_id: editData.group_id || undefined,
      });

      // Create updated expense object for optimistic update
      const updatedExpense: ExpenseWithConversions = {
        ...expense,
        item: editData.item.trim(),
        amount: Math.round(amount * 100), // Convert back to cents
        currency: editData.currency,
        merchant: editData.merchant?.trim() || null,
        group_id: editData.group_id || null,
        // Update group name if group changed
        group_name: editData.group_id 
          ? groups.find(g => g.id === editData.group_id)?.name || expense.group_name
          : null,
      };

      setIsEditing(false);
      onExpenseUpdated?.(updatedExpense);
      success('Expense updated successfully');
    } catch (err) {
      console.error('Failed to update expense:', err);
      error('Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await expenseService.deleteExpense(expense.id);
      onExpenseDeleted?.(expense.id);
      success('Expense deleted successfully');
    } catch (err) {
      console.error('Failed to delete expense:', err);
      error('Failed to delete expense');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };
  // Format amount based on preferred currency
  const formatAmount = () => {
    const amount = preferredCurrency === 'THB' ? expense.amount_thb : expense.amount_usd;
    const currency = preferredCurrency;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'THB' ? 0 : 2,
      maximumFractionDigits: currency === 'THB' ? 0 : 2,
    }).format(amount);
  };

  // Format time display
  const formatTime = () => {
    const date = new Date(expense.user_local_datetime);
    
    if (showDate) {
      return format(date, 'MMM d, HH:mm');
    } else {
      return format(date, 'HH:mm');
    }
  };

  // Get relative time for tooltip
  const getRelativeTime = () => {
    const date = new Date(expense.user_local_datetime);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isEditing) {
    return (
      <div className="card-hoverable p-4 space-y-4">
        {/* Edit Form */}
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item
            </label>
            <input
              type="text"
              value={editData.item}
              onChange={(e) => setEditData({ ...editData, item: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter item name"
            />
          </div>

          {/* Amount and Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={editData.currency}
                onChange={(e) => setEditData({ ...editData, currency: e.target.value as 'THB' | 'USD' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="THB">THB</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Merchant (optional)
            </label>
            <input
              type="text"
              value={editData.merchant}
              onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter merchant name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category (optional)
            </label>
            <select
              value={editData.group_id || ''}
              onChange={(e) => setEditData({ ...editData, group_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">No category</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving || deleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card-hoverable p-4 group cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      onClick={handleEdit}
    >
      <div className="flex items-start gap-4">
        {/* Left side: Item and details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
              {expense.item}
            </h3>
          </div>
          
          {/* Categories/Tags Row */}
          {(expense.group_name || expense.tag_name) && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              {expense.group_name && (
                <GroupBadge
                  name={expense.group_name}
                  icon={expense.group_icon || undefined}
                  color={expense.group_color || undefined}
                  size="sm"
                  variant="filled"
                />
              )}
              {expense.tag_name && (
                <span className="badge-secondary flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {expense.tag_name}
                </span>
              )}
            </div>
          )}
          
          {/* Metadata Row */}
          <div className="flex items-center gap-2 mt-1">
            <time 
              className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1" 
              title={getRelativeTime()}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime()}
            </time>
            
            {expense.merchant && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {expense.merchant}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Amount */}
        <div className="flex flex-col items-end">
          <span className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {formatAmount()}
          </span>
          
          {/* Show conversion if different from preferred currency */}
          {expense.currency !== preferredCurrency && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {expense.currency === 'THB' 
                ? `₿${expense.amount_thb.toLocaleString()}` 
                : `$${expense.amount_usd.toFixed(2)}`
              } {expense.currency}
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={handleDeleteCancel}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete expense?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Are you sure you want to delete "{expense.item}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
