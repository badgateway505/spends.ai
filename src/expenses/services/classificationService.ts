import { supabase } from '../../lib/supabase';
import { isDevelopment } from '../../utils/env';

export interface ClassificationRequest {
  text: string;
  user_timezone?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
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
      console.log('Classifying expense:', text);

      // For development, return mock classification
      if (isDevelopment) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Mock classification based on text content
        const mockResult: ClassificationResult = {
          item: text,
          amount: this.extractMockAmount(text),
          currency: this.extractMockCurrency(text),
          merchant: this.extractMockMerchant(text),
          group: this.getMockGroup(text),
          tag: this.getMockTag(text),
          confidence: 0.85,
          provider: 'mock',
          model: 'mock-classifier',
          reasoning: `Analyzed "${text}" and categorized based on common expense patterns`
        };
        
        console.log('Mock classification result:', mockResult);
        return mockResult;
      }

      // Get current session (with mock support)
      const { data: { session } } = await supabase.auth.getSession();
      
      let accessToken: string | null = null;
      
      if (session) {
        accessToken = session.access_token;
      } else if (isDevelopment) {
        // Try to get mock session data
        const mockSessionData = localStorage.getItem('mock-debug-session');
        if (mockSessionData) {
          const mockSession = JSON.parse(mockSessionData);
          accessToken = mockSession.access_token;
          console.log('Using mock session for classification');
        }
      }
      
      if (!accessToken) {
        throw new ClassificationServiceError('AUTH_ERROR', 'Authentication required for AI classification');
      }

      // Call the classify Edge Function
      const { data, error } = await supabase.functions.invoke('classify', {
        body: {
          text,
          user_timezone: userTimezone
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new ClassificationServiceError(
          'API_ERROR',
          `Classification service error: ${error.message}`,
          error
        );
      }

      if (!data || !data.success) {
        throw new ClassificationServiceError(
          'API_ERROR',
          'Invalid response from classification service'
        );
      }

      console.log('Classification result:', data.data);
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

  /**
   * Mock helper functions for development
   */
  private extractMockAmount(text: string): number | undefined {
    const amountMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
    return amountMatch ? parseFloat(amountMatch[1]) : undefined;
  }

  private extractMockCurrency(text: string): 'THB' | 'USD' | undefined {
    if (text.toLowerCase().includes('usd') || text.includes('$')) {
      return 'USD';
    }
    if (text.toLowerCase().includes('thb') || text.includes('฿') || text.toLowerCase().includes('baht')) {
      return 'THB';
    }
    return 'THB'; // Default to THB
  }

  private extractMockMerchant(text: string): string | undefined {
    const merchants = ['starbucks', 'mcdonalds', '7-eleven', 'big c', 'lotus', 'central', 'grab', 'uber'];
    const lowerText = text.toLowerCase();
    
    for (const merchant of merchants) {
      if (lowerText.includes(merchant)) {
        return merchant.charAt(0).toUpperCase() + merchant.slice(1);
      }
    }
    
    return undefined;
  }

  private getMockGroup(text: string): Group | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('coffee') || lowerText.includes('lunch') || lowerText.includes('dinner') || 
        lowerText.includes('food') || lowerText.includes('restaurant') || lowerText.includes('eat')) {
      return { id: 'mock-group-food', name: 'Food & Dining' };
    }
    
    if (lowerText.includes('taxi') || lowerText.includes('grab') || lowerText.includes('uber') || 
        lowerText.includes('transport') || lowerText.includes('bus') || lowerText.includes('train')) {
      return { id: 'mock-group-transport', name: 'Transportation' };
    }
    
    if (lowerText.includes('shop') || lowerText.includes('buy') || lowerText.includes('purchase') ||
        lowerText.includes('store') || lowerText.includes('mall')) {
      return { id: 'mock-group-shopping', name: 'Shopping' };
    }
    
    if (lowerText.includes('bill') || lowerText.includes('electric') || lowerText.includes('water') ||
        lowerText.includes('internet') || lowerText.includes('phone')) {
      return { id: 'mock-group-bills', name: 'Bills & Utilities' };
    }
    
    return { id: 'mock-group-other', name: 'Other' };
  }

  private getMockTag(text: string): Tag | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('emergency')) {
      return { id: 'mock-tag-urgent', name: 'Urgent' };
    }
    
    if (lowerText.includes('business') || lowerText.includes('work')) {
      return { id: 'mock-tag-business', name: 'Business' };
    }
    
    return undefined;
  }
}

// Export singleton instance
export const classificationService = new ClassificationServiceClass();
