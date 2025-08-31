import { DEFAULT_GROUPS } from '../services/groupService';
import { GroupBadge } from '../../ui/components/data-display/GroupBadge';

export function GroupShowcase() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Default Categories with Icons & Colors
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {DEFAULT_GROUPS.map((group, index) => (
          <GroupBadge
            key={index}
            name={group.name}
            icon={group.icon}
            color={group.color}
            size="md"
            variant="filled"
            className="justify-center"
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          ✅ MVP-4.2.5 Implementation Complete
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Added icon and color fields to groups database schema</li>
          <li>• Created comprehensive icon system with 25+ icons</li>
          <li>• Implemented color palette with 18 color options</li>
          <li>• Built icon and color picker components</li>
          <li>• Updated group displays throughout the app with visual badges</li>
          <li>• Enhanced expense items to show categorized expenses with icons</li>
          <li>• Created analytics components for category spending visualization</li>
        </ul>
      </div>
    </div>
  );
}
