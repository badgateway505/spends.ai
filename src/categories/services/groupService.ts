import { supabase } from '../../lib/supabase';
import { isDevelopment } from '../../utils/env';
import type { PostgrestError } from '@supabase/supabase-js';

export interface Group {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export type GroupErrorCode = 
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_ERROR'
  | 'DATABASE_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class GroupServiceError extends Error {
  public code: GroupErrorCode;
  public details?: unknown;
  public isRetryable: boolean;

  constructor(code: GroupErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'GroupServiceError';
    this.code = code;
    this.details = details;
    
    this.isRetryable = ['NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(code);
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return 'Please sign in to manage categories';
      case 'VALIDATION_ERROR':
        return this.message;
      case 'DUPLICATE_ERROR':
        return 'A category with this name already exists';
      case 'NOT_FOUND':
        return 'Category not found';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again';
      case 'DATABASE_ERROR':
        return 'Database error. Please try again later';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }
}

// Default expense groups that are created for new users
export const DEFAULT_GROUPS: Omit<CreateGroupRequest, 'user_id'>[] = [
  {
    name: 'Food & Dining',
    description: 'Restaurants, cafes, groceries, and food delivery'
  },
  {
    name: 'Transportation',
    description: 'Taxi, Grab, public transport, fuel, and parking'
  },
  {
    name: 'Shopping',
    description: 'Clothes, electronics, books, and general purchases'
  },
  {
    name: 'Bills & Utilities',
    description: 'Electricity, water, internet, phone, and rent'
  },
  {
    name: 'Entertainment',
    description: 'Movies, concerts, games, and recreational activities'
  },
  {
    name: 'Health & Fitness',
    description: 'Healthcare, gym, sports, and wellness'
  },
  {
    name: 'Education',
    description: 'Courses, books, training, and educational materials'
  },
  {
    name: 'Travel',
    description: 'Hotels, flights, and travel-related expenses'
  }
];

class GroupServiceClass {
  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error && !isDevelopment) {
        throw new GroupServiceError('AUTH_ERROR', 'Authentication failed');
      }
      
      if (user) {
        return user.id;
      }
      
      // Development mock user fallback
      if (isDevelopment) {
        const mockUserData = localStorage.getItem('mock-admin-user');
        if (mockUserData) {
          const mockUser = JSON.parse(mockUserData);
          return mockUser.id;
        }
      }
      
      throw new GroupServiceError('AUTH_ERROR', 'User not authenticated');
    } catch (error) {
      if (error instanceof GroupServiceError) {
        throw error;
      }
      throw new GroupServiceError('AUTH_ERROR', 'Authentication system error');
    }
  }

  /**
   * Handle Supabase errors
   */
  private handleSupabaseError(error: PostgrestError, operation: string): GroupServiceError {
    console.error(`Supabase error during ${operation}:`, error);
    
    if (error.code === '23505') {
      return new GroupServiceError('DUPLICATE_ERROR', 'Group name already exists', error);
    }
    
    if (error.code === 'PGRST116') {
      return new GroupServiceError('NOT_FOUND', 'Group not found', error);
    }
    
    return new GroupServiceError('DATABASE_ERROR', `Failed to ${operation}`, error);
  }

  /**
   * Get all groups for the current user
   */
  async getGroups(includeArchived = false): Promise<Group[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // For development with mock user, return mock groups
      if (isDevelopment && userId === 'admin-user-id-12345') {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const mockGroups: Group[] = DEFAULT_GROUPS.map((group, index) => ({
          id: `mock-group-${index + 1}`,
          user_id: userId,
          name: group.name,
          description: group.description || '',
          archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        return mockGroups;
      }

      let query = supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!includeArchived) {
        query = query.eq('archived', false);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error, 'fetch groups');
      }

      return data || [];

    } catch (error) {
      if (error instanceof GroupServiceError) {
        throw error;
      }
      
      throw new GroupServiceError('UNKNOWN_ERROR', 'Failed to fetch groups');
    }
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    try {
      const userId = await this.getCurrentUserId();

      // Validate input
      if (!groupData.name || groupData.name.trim().length === 0) {
        throw new GroupServiceError('VALIDATION_ERROR', 'Group name is required');
      }

      if (groupData.name.trim().length > 100) {
        throw new GroupServiceError('VALIDATION_ERROR', 'Group name must be less than 100 characters');
      }

      const createData = {
        user_id: userId,
        name: groupData.name.trim(),
        description: groupData.description?.trim() || null,
      };

      // For development with mock user
      if (isDevelopment && userId === 'admin-user-id-12345') {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockGroup: Group = {
          id: `mock-group-${Date.now()}`,
          user_id: userId,
          name: createData.name,
          description: createData.description || '',
          archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return mockGroup;
      }

      const { data, error } = await supabase
        .from('groups')
        .insert(createData)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error, 'create group');
      }

      return data;

    } catch (error) {
      if (error instanceof GroupServiceError) {
        throw error;
      }
      
      throw new GroupServiceError('UNKNOWN_ERROR', 'Failed to create group');
    }
  }

  /**
   * Create default groups for a new user
   */
  async createDefaultGroups(): Promise<Group[]> {
    try {
      console.log('Creating default groups...');
      const createdGroups: Group[] = [];

      for (const groupData of DEFAULT_GROUPS) {
        try {
          const group = await this.createGroup(groupData);
          createdGroups.push(group);
        } catch (error) {
          // Continue creating other groups even if one fails
          console.warn(`Failed to create default group "${groupData.name}":`, error);
        }
      }

      console.log(`Created ${createdGroups.length} default groups`);
      return createdGroups;

    } catch (error) {
      console.error('Error creating default groups:', error);
      throw new GroupServiceError('UNKNOWN_ERROR', 'Failed to create default groups');
    }
  }

  /**
   * Update an existing group
   */
  async updateGroup(id: string, updates: Partial<CreateGroupRequest>): Promise<Group> {
    try {
      const userId = await this.getCurrentUserId();

      const updateData: Record<string, any> = {};

      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          throw new GroupServiceError('VALIDATION_ERROR', 'Group name cannot be empty');
        }
        updateData.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }

      const { data, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error, 'update group');
      }

      return data;

    } catch (error) {
      if (error instanceof GroupServiceError) {
        throw error;
      }
      
      throw new GroupServiceError('UNKNOWN_ERROR', 'Failed to update group');
    }
  }

  /**
   * Archive a group (soft delete)
   */
  async archiveGroup(id: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();

      const { error } = await supabase
        .from('groups')
        .update({ archived: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw this.handleSupabaseError(error, 'archive group');
      }

    } catch (error) {
      if (error instanceof GroupServiceError) {
        throw error;
      }
      
      throw new GroupServiceError('UNKNOWN_ERROR', 'Failed to archive group');
    }
  }

  /**
   * Check if user has any groups (to determine if we need to create defaults)
   */
  async hasGroups(): Promise<boolean> {
    try {
      const groups = await this.getGroups();
      return groups.length > 0;
    } catch (error) {
      console.warn('Error checking if user has groups:', error);
      return false;
    }
  }
}

// Export singleton instance
export const groupService = new GroupServiceClass();
