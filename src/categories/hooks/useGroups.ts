import { useState, useEffect } from 'react';
import { groupService } from '../services/groupService';
import type { Group, CreateGroupRequest } from '../types/category.types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGroups = await groupService.getGroups();
      setGroups(fetchedGroups);
    } catch (err: any) {
      console.error('Error loading groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: CreateGroupRequest): Promise<Group> => {
    try {
      const newGroup = await groupService.createGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err: any) {
      console.error('Error creating group:', err);
      throw err;
    }
  };

  const updateGroup = async (id: string, updates: Partial<CreateGroupRequest>): Promise<Group> => {
    try {
      const updatedGroup = await groupService.updateGroup(id, updates);
      setGroups(prev => prev.map(group => 
        group.id === id ? updatedGroup : group
      ));
      return updatedGroup;
    } catch (err: any) {
      console.error('Error updating group:', err);
      throw err;
    }
  };

  const archiveGroup = async (id: string): Promise<void> => {
    try {
      await groupService.archiveGroup(id);
      setGroups(prev => prev.map(group => 
        group.id === id ? { ...group, archived: true } : group
      ));
    } catch (err: any) {
      console.error('Error archiving group:', err);
      throw err;
    }
  };

  const unarchiveGroup = async (id: string): Promise<void> => {
    try {
      await groupService.unarchiveGroup(id);
      setGroups(prev => prev.map(group => 
        group.id === id ? { ...group, archived: false } : group
      ));
    } catch (err: any) {
      console.error('Error unarchiving group:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    refresh: loadGroups,
    createGroup,
    updateGroup,
    archiveGroup,
    unarchiveGroup,
  };
}