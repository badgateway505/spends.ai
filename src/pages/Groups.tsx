import { GroupManager } from '../categories/components/GroupManager';

export function Groups() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <GroupManager />
      </div>
    </div>
  );
}