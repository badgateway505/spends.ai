import { supabase } from '../../lib/supabase';
import type { UserSettings, UpdateUserSettingsRequest } from '../types/currency.types';

export class UserSettingsService {
  /**
   * Get current user's settings
   */
  static async getUserSettings(): Promise<UserSettings> {
    const { data, error } = await supabase
      .rpc('get_user_settings');

    if (error) {
      console.error('Error fetching user settings:', error);
      throw new Error('Failed to fetch user settings');
    }

    if (!data) {
      throw new Error('No user settings found');
    }

    return data;
  }

  /**
   * Update current user's settings
   */
  static async updateUserSettings(updates: UpdateUserSettingsRequest): Promise<UserSettings> {
    const { data, error } = await supabase
      .rpc('update_user_settings', {
        new_main_currency: updates.main_currency || null,
        new_include_archived: updates.include_archived_analytics !== undefined 
          ? updates.include_archived_analytics 
          : null
      });

    if (error) {
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }

    if (!data) {
      throw new Error('No user settings returned after update');
    }

    return data;
  }

  /**
   * Initialize user settings with defaults (called during signup)
   */
  static async initializeUserSettings(): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        main_currency: 'THB',
        include_archived_analytics: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error initializing user settings:', error);
      throw new Error('Failed to initialize user settings');
    }

    return data;
  }
}
