import { supabase } from '../../lib/supabase';
import type { GroupIcon, GroupColor } from '../../categories/types/category.types';

export interface ClassificationRequest {
  text: string;
  user_timezone?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: GroupIcon;
  color?: GroupColor;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
}

export interface ClassificationResult {
  item: string;
  amount?: number;
  currency?: 'THB' | 'USD';
  merchant?: string;
  group?: Group;
  tag?: Tag;
  confidence: number;
  provider: string;
  model: string;
  cost?: number;
  reasoning?: string;
}

export interface ClassificationResponse {
  success: boolean;
  data: ClassificationResult;
}

export type ClassificationErrorCode = 
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR';

export class ClassificationServiceError extends Error {
  public code: ClassificationErrorCode;
  public details?: unknown;
  public isRetryable: boolean;

  constructor(code: ClassificationErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ClassificationServiceError';
    this.code = code;
    this.details = details;
    
    // Determine if this error is retryable
    this.isRetryable = ['NETWORK_ERROR', 'API_ERROR', 'UNKNOWN_ERROR'].includes(code);
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return 'Please sign in to use AI classification';
      case 'VALIDATION_ERROR':
        return this.message;
      case 'NETWORK_ERROR':
        return 'Network error. AI classification unavailable';
      case 'API_ERROR':
        return 'AI service temporarily unavailable';
      default:
        return 'AI classification failed. You can still add the expense manually';
    }
  }
}

class ClassificationServiceClass {
  /**
   * Classify expense text using AI
   */
  async classifyExpense(text: string, userTimezone = 'UTC'): Promise<ClassificationResult> {
    try {
      console.log('🤖 [ClassificationService] Starting AI classification');
      console.log('📝 [ClassificationService] Input text:', text);
      console.log('🌍 [ClassificationService] User timezone:', userTimezone);



      // Get current session
      console.log('🔐 [ClassificationService] Getting auth session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ [ClassificationService] No active session');
        throw new ClassificationServiceError('AUTH_ERROR', 'User not authenticated');
      }
      
      const accessToken = session.access_token;
      
      if (!accessToken) {
        console.error('❌ [ClassificationService] No access token in session');
        throw new ClassificationServiceError('AUTH_ERROR', 'Authentication required for AI classification');
      }

      console.log('✅ [ClassificationService] Auth token obtained');

      // Call the classify Edge Function
      console.log('🚀 [ClassificationService] Calling Edge Function...');
      const { data, error } = await supabase.functions.invoke('classify', {
        body: {
          text,
          user_timezone: userTimezone
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      console.log('📨 [ClassificationService] Edge Function response received');

      if (error) {
        console.error('❌ [ClassificationService] Edge Function error:', error);
        console.error('❌ [ClassificationService] Error details:', {
          message: error.message,
          context: error.context,
          details: error.details
        });
        throw new ClassificationServiceError(
          'API_ERROR',
          `Classification service error: ${error.message}`,
          error
        );
      }

      if (!data || !data.success) {
        console.error('❌ [ClassificationService] Invalid response from service:', data);
        throw new ClassificationServiceError(
          'API_ERROR',
          'Invalid response from classification service'
        );
      }

      console.log('✅ [ClassificationService] Classification successful:', data.data);
      return data.data;

    } catch (error) {
      if (error instanceof ClassificationServiceError) {
        throw error;
      }

      console.error('Unexpected classification error:', error);
      
      // Check for network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ClassificationServiceError(
          'NETWORK_ERROR',
          'Network error during classification',
          error
        );
      }

      throw new ClassificationServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred during classification',
        error
      );
    }
  }


}

// Export singleton instance
export const classificationService = new ClassificationServiceClass();
