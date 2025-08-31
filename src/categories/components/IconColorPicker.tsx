import { useState } from 'react';
import type { GroupIcon as GroupIconType, GroupColor } from '../types/category.types';
import { 
  GROUP_ICONS, 
  GROUP_COLORS, 
  getGroupColorClasses 
} from '../types/category.types';
import { GroupIcon } from '../../ui/components/data-display/GroupIcon';

interface IconColorPickerProps {
  selectedIcon: GroupIconType;
  selectedColor: GroupColor;
  onIconChange: (icon: GroupIconType) => void;
  onColorChange: (color: GroupColor) => void;
  className?: string;
}

export function IconColorPicker({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
  className = ''
}: IconColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'icon' | 'color'>('icon');

  // Group icons by category for better organization
  const iconsByCategory = GROUP_ICONS.reduce((acc, iconData) => {
    if (!acc[iconData.category]) {
      acc[iconData.category] = [];
    }
    acc[iconData.category].push(iconData);
    return acc;
  }, {} as Record<string, typeof GROUP_ICONS>);

  const categoryLabels = {
    essentials: 'Essentials',
    lifestyle: 'Lifestyle',
    entertainment: 'Entertainment', 
    work: 'Work & Education',
    travel: 'Travel',
    family: 'Family',
    services: 'Services',
    special: 'Special',
    default: 'Other'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('icon')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'icon'
              ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <GroupIcon icon={selectedIcon} color={selectedColor} size="sm" />
            Icon
          </div>
        </button>
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'color'
              ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <div className={`w-4 h-4 rounded-full border ${getGroupColorClasses(selectedColor).split(' ').slice(1, 3).join(' ')}`} />
            Color
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'icon' ? (
          <div className="space-y-6">
            {Object.entries(iconsByCategory).map(([category, icons]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map((iconData) => (
                    <button
                      key={iconData.icon}
                      onClick={() => onIconChange(iconData.icon)}
                      className={`p-3 rounded-lg border transition-all hover:scale-105 ${
                        selectedIcon === iconData.icon
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      title={iconData.label}
                    >
                      <GroupIcon 
                        icon={iconData.icon} 
                        color={selectedIcon === iconData.icon ? selectedColor : 'gray'} 
                        size="md" 
                        className="mx-auto"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose a Color
            </h4>
            <div className="grid grid-cols-6 gap-3">
              {GROUP_COLORS.map((colorData) => {
                const colorClasses = colorData.cssClass.split(' ');
                const bgClass = colorClasses.find(cls => cls.startsWith('bg-')) || 'bg-gray-100';
                const borderClass = colorClasses.find(cls => cls.startsWith('border-')) || 'border-gray-200';
                
                return (
                  <button
                    key={colorData.color}
                    onClick={() => onColorChange(colorData.color)}
                    className={`p-3 rounded-lg transition-all hover:scale-105 ${
                      selectedColor === colorData.color
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                        : ''
                    }`}
                    title={colorData.label}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 ${bgClass} ${borderClass} mx-auto flex items-center justify-center`}>
                      {selectedColor === colorData.color && (
                        <GroupIcon icon={selectedIcon} color={colorData.color} size="sm" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
