import type { GroupIcon as GroupIconType, GroupColor } from '../../../categories/types/category.types';
import { getGroupColorClasses } from '../../../categories/types/category.types';
import { GroupIcon } from './GroupIcon';

interface GroupBadgeProps {
  name: string;
  icon?: GroupIconType;
  color?: GroupColor;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'minimal';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GroupBadge({
  name,
  icon = 'tag',
  color = 'gray',
  size = 'md',
  variant = 'filled',
  showIcon = true,
  className = '',
  onClick
}: GroupBadgeProps) {
  const colorClasses = getGroupColorClasses(color);
  const isClickable = !!onClick;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'sm' as const,
    md: 'sm' as const,
    lg: 'md' as const
  };

  // Extract specific classes from the color classes string
  const classes = colorClasses.split(' ');
  const textClass = classes.find(cls => cls.startsWith('text-')) || 'text-gray-600';
  const bgClass = classes.find(cls => cls.startsWith('bg-')) || 'bg-gray-100';
  const borderClass = classes.find(cls => cls.startsWith('border-')) || 'border-gray-200';

  const variantClasses = {
    filled: `${bgClass} ${textClass} border ${borderClass}`,
    outlined: `border-2 ${borderClass} ${textClass} bg-transparent`,
    minimal: `${textClass} bg-transparent`
  };

  const baseClasses = `
    inline-flex items-center gap-1.5 rounded-full font-medium
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      {showIcon && (
        <GroupIcon 
          icon={icon} 
          color={color} 
          size={iconSizes[size]}
          className="flex-shrink-0"
        />
      )}
      <span className="truncate">{name}</span>
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={baseClasses}
        title={`Category: ${name}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={baseClasses} title={`Category: ${name}`}>
      {content}
    </span>
  );
}

// Simplified version for just displaying the group name with icon
interface GroupLabelProps {
  name: string;
  icon?: GroupIconType;
  color?: GroupColor;
  className?: string;
}

export function GroupLabel({ name, icon = 'tag', color = 'gray', className = '' }: GroupLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GroupIcon icon={icon} color={color} size="sm" />
      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
    </div>
  );
}
