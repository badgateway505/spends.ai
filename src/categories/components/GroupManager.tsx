import { useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import type { CreateGroupRequest } from '../types/category.types';

export function GroupManager() {
  const { groups, loading, error, createGroup, updateGroup, archiveGroup, unarchiveGroup } = useGroups();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGroupRequest>({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeGroups = groups.filter(group => !group.archived);
  const archivedGroups = groups.filter(group => group.archived);
  const displayGroups = showArchived ? groups : activeGroups;

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setFormErrors(null);
    setShowCreateForm(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    if (!formData.name.trim()) {
      setFormErrors('Group name is required');
      return;
    }

    try {
      if (editingGroup) {
        await updateGroup(editingGroup, formData);
      } else {
        await createGroup(formData);
      }
      resetForm();
    } catch (err: any) {
      setFormErrors(err.message || 'Failed to save group');
    }
  };

  const handleEdit = (group: any) => {
    setFormData({ name: group.name, description: group.description || '' });
    setEditingGroup(group.id);
    setShowCreateForm(true);
  };

  const handleArchive = async (groupId: string) => {
    try {
      await archiveGroup(groupId);
    } catch (err: any) {
      console.error('Error archiving group:', err);
    }
  };

  const handleUnarchive = async (groupId: string) => {
    try {
      await unarchiveGroup(groupId);
    } catch (err: any) {
      console.error('Error unarchiving group:', err);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading groups...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-danger-200 dark:border-danger-800">
        <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Groups</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize your expenses into categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              showArchived 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'} ({archivedGroups.length})
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Group
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card p-6 border-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h3>
          </div>

          {formErrors && (
            <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-600 dark:text-danger-400">{formErrors}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Food, Transport"
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                className="form-input"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups List */}
      <div className="card">
        {displayGroups.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              {showArchived ? 'No archived groups' : 'No groups yet'}
            </p>
            {!showArchived && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              >
                Create your first group
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayGroups.map((group) => (
              <div key={group.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${group.archived ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {group.name}
                    </h3>
                    {group.archived && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        Archived
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{group.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Edit
                  </button>
                  {group.archived ? (
                    <button
                      onClick={() => handleUnarchive(group.id)}
                      className="text-sm text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-300"
                    >
                      Unarchive
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(group.id)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-danger-600 dark:hover:text-danger-400"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}