import { supabase as supabaseClient } from '../../lib/supabase';
import { env } from '../../utils/env';
import type { AudioRecordingResult } from '../types/audio.types';

export interface AudioUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface AudioTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
}

export interface AudioUploadError {
  code: 'NETWORK_ERROR' | 'UPLOAD_FAILED' | 'TRANSCRIPTION_FAILED' | 'INVALID_AUDIO' | 'UNKNOWN';
  message: string;
}

export interface AudioUploadOptions {
  language?: string;
  onProgress?: (progress: AudioUploadProgress) => void;
  onError?: (error: AudioUploadError) => void;
  timeout?: number; // in milliseconds
}

/**
 * Service for uploading audio files to Supabase STT function
 */
class AudioUploadService {
  private supabase = supabaseClient;
  private readonly STT_FUNCTION_URL = `${env.supabaseUrl}/functions/v1/stt`;

  /**
   * Upload audio recording and get transcription
   */
  async uploadAndTranscribe(
    audioResult: AudioRecordingResult,
    options: AudioUploadOptions = {}
  ): Promise<AudioTranscriptionResult> {
    const {
      language = 'auto',
      onProgress,
      onError,
      timeout = 30000, // 30 seconds default
    } = options;

    try {
      // Validate audio file
      this.validateAudioFile(audioResult);

      // Prepare form data
      const formData = new FormData();
      
      // Convert blob to file with proper name and type
      const audioFile = new File(
        [audioResult.blob],
        `recording.${this.getFileExtension(audioResult.mimeType)}`,
        { type: audioResult.mimeType }
      );
      
      formData.append('audio', audioFile);
      formData.append('language', language);

      // Get auth headers
      const session = await this.supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('User not authenticated');
      }

      // Create upload promise with progress tracking
      const uploadPromise = this.uploadWithProgress(formData, session.data.session.access_token, onProgress);

      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timeout'));
        }, timeout);
      });

      // Race between upload and timeout
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        const error: AudioUploadError = {
          code: 'UPLOAD_FAILED',
          message: `Upload failed: ${response.status} ${errorText}`
        };
        onError?.(error);
        throw new Error(error.message);
      }

      const result = await response.json();

      if (!result.success) {
        const error: AudioUploadError = {
          code: 'TRANSCRIPTION_FAILED',
          message: result.error || 'Transcription failed'
        };
        onError?.(error);
        throw new Error(error.message);
      }

      return {
        text: result.data.text,
        language: result.data.language,
        confidence: result.data.confidence,
        duration: result.data.duration
      };

    } catch (error) {
      const uploadError: AudioUploadError = {
        code: error instanceof Error && error.message.includes('timeout') 
          ? 'NETWORK_ERROR' 
          : 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown upload error'
      };
      
      onError?.(uploadError);
      console.error('Audio upload error:', error);
      throw uploadError;
    }
  }

  /**
   * Check if audio upload is supported
   */
  isSupported(): boolean {
    return !!(
      typeof FormData !== 'undefined' &&
      typeof File !== 'undefined' &&
      typeof fetch !== 'undefined'
    );
  }

  /**
   * Validate audio file before upload
   */
  private validateAudioFile(audioResult: AudioRecordingResult): void {
    const supportedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg',
      'audio/ogg'
    ];

    if (!supportedTypes.includes(audioResult.mimeType)) {
      throw new Error(`Unsupported audio type: ${audioResult.mimeType}`);
    }

    // Check file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioResult.size > maxSize) {
      throw new Error(`File too large: ${(audioResult.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 25MB`);
    }

    // Check minimum duration (at least 1 second)
    if (audioResult.duration < 1000) {
      throw new Error('Audio too short (minimum 1 second)');
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg'
    };

    return extensions[mimeType] || 'webm';
  }

  /**
   * Upload with progress tracking
   */
  private async uploadWithProgress(
    formData: FormData,
    accessToken: string,
    onProgress?: (progress: AudioUploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress: AudioUploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        };
      }

      // Set up response handling
      xhr.onload = () => {
        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(
            xhr.getAllResponseHeaders()
              .split('\r\n')
              .filter(line => line.trim())
              .reduce((headers, line) => {
                const [key, value] = line.split(': ');
                if (key && value) {
                  headers[key] = value;
                }
                return headers;
              }, {} as Record<string, string>)
          )
        });
        resolve(response);
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timeout'));
      };

      // Configure request
      xhr.open('POST', this.STT_FUNCTION_URL);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      
      // Send the request
      xhr.send(formData);
    });
  }

  /**
   * Estimate upload time based on file size and connection speed
   */
  estimateUploadTime(fileSize: number, connectionSpeed: number = 1024 * 1024): number {
    // Rough estimate in seconds, accounting for overhead
    return Math.ceil((fileSize * 1.2) / connectionSpeed);
  }

  /**
   * Check connection quality
   */
  async checkConnectionQuality(): Promise<'fast' | 'medium' | 'slow'> {
    if (!(navigator as any).connection) {
      return 'medium'; // Default if not supported
    }

    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType;

    switch (effectiveType) {
      case '4g':
        return 'fast';
      case '3g':
        return 'medium';
      case '2g':
      case 'slow-2g':
        return 'slow';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const audioUploadService = new AudioUploadService();
