import { useState } from 'react';
import type { GroupIcon as GroupIconType, GroupColor } from '../types/category.types';
import { CreateGroupRequest, Group } from '../services/groupService';
import { GroupIcon } from '../../ui/components/data-display/GroupIcon';
import { IconColorPicker } from './IconColorPicker';

interface GroupFormProps {
  initialData?: Partial<Group>;
  onSubmit: (data: CreateGroupRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  title?: string;
}

export function GroupForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Create Group',
  title = 'Create New Group'
}: GroupFormProps) {
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    icon: initialData?.icon || 'tag',
    color: initialData?.color || 'gray'
  });

  const [showIconColorPicker, setShowIconColorPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        icon: formData.icon,
        color: formData.color
      });
    } catch (error) {
      // Handle error if needed
      console.error('Failed to submit group form:', error);
    }
  };

  const handleIconChange = (icon: GroupIconType) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorChange = (color: GroupColor) => {
    setFormData(prev => ({ ...prev, color }));
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <GroupIcon 
            icon={formData.icon} 
            color={formData.color} 
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize your expense category
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`form-input ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g., Food & Dining"
              disabled={loading}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`form-input ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g., Restaurants, cafes, groceries, and food delivery"
              rows={3}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Icon & Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icon & Color
            </label>
            <button
              type="button"
              onClick={() => setShowIconColorPicker(!showIconColorPicker)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <div className="flex items-center gap-3">
                <GroupIcon 
                  icon={formData.icon} 
                  color={formData.color} 
                  size="md"
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formData.icon} • {formData.color}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Click to customize appearance
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${showIconColorPicker ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showIconColorPicker && (
              <div className="mt-2">
                <IconColorPicker
                  selectedIcon={formData.icon}
                  selectedColor={formData.color}
                  onIconChange={handleIconChange}
                  onColorChange={handleColorChange}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
