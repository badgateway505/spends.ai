import React, { useState, useCallback, useRef } from 'react';
import { audioUploadService, type AudioUploadProgress, type AudioUploadError, type AudioTranscriptionResult, type AudioUploadOptions } from '../services/audioUploadService';
import type { AudioRecordingResult } from '../types/audio.types';

export interface UseAudioUploadOptions {
  language?: string;
  timeout?: number;
  onSuccess?: (result: AudioTranscriptionResult) => void;
  onError?: (error: AudioUploadError) => void;
  onProgress?: (progress: AudioUploadProgress) => void;
}

export interface UseAudioUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: AudioUploadProgress | null;
  uploadError: AudioUploadError | null;
  transcriptionResult: AudioTranscriptionResult | null;
  isSupported: boolean;
  
  // Actions
  uploadAudio: (audioResult: AudioRecordingResult) => Promise<AudioTranscriptionResult | null>;
  resetUpload: () => void;
  
  // Utilities
  estimateUploadTime: (fileSize: number) => number;
  getConnectionQuality: () => Promise<'fast' | 'medium' | 'slow'>;
}

export function useAudioUpload(options: UseAudioUploadOptions = {}): UseAudioUploadReturn {
  const {
    language = 'auto',
    timeout = 30000,
    onSuccess,
    onError,
    onProgress
  } = options;

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<AudioUploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<AudioUploadError | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<AudioTranscriptionResult | null>(null);
  const [isSupported] = useState(audioUploadService.isSupported());

  // Refs for callbacks to avoid dependency issues
  const callbacksRef = useRef({
    onSuccess,
    onError,
    onProgress
  });

  // Update callbacks ref when they change
  React.useEffect(() => {
    callbacksRef.current = {
      onSuccess,
      onError,
      onProgress
    };
  }, [onSuccess, onError, onProgress]);

  // Progress handler
  const handleProgress = useCallback((progress: AudioUploadProgress) => {
    setUploadProgress(progress);
    callbacksRef.current.onProgress?.(progress);
  }, []);

  // Error handler
  const handleError = useCallback((error: AudioUploadError) => {
    setUploadError(error);
    setIsUploading(false);
    setUploadProgress(null);
    callbacksRef.current.onError?.(error);
  }, []);

  // Upload audio
  const uploadAudio = useCallback(async (audioResult: AudioRecordingResult): Promise<AudioTranscriptionResult | null> => {
    if (!isSupported) {
      const error: AudioUploadError = {
        code: 'UNKNOWN',
        message: 'Audio upload not supported in this browser'
      };
      handleError(error);
      return null;
    }

    if (isUploading) {
      console.warn('Upload already in progress');
      return null;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(null);
      setTranscriptionResult(null);

      const uploadOptions: AudioUploadOptions = {
        language,
        timeout,
        onProgress: handleProgress,
        onError: handleError
      };

      const result = await audioUploadService.uploadAndTranscribe(audioResult, uploadOptions);
      
      setTranscriptionResult(result);
      setIsUploading(false);
      setUploadProgress({ loaded: 100, total: 100, percentage: 100 }); // Show 100% completion
      
      callbacksRef.current.onSuccess?.(result);
      return result;

    } catch (error) {
      // Error handling is done in handleError callback
      return null;
    }
  }, [isSupported, isUploading, language, timeout, handleProgress, handleError]);

  // Reset upload state
  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(null);
    setUploadError(null);
    setTranscriptionResult(null);
  }, []);

  // Estimate upload time
  const estimateUploadTime = useCallback((fileSize: number): number => {
    return audioUploadService.estimateUploadTime(fileSize);
  }, []);

  // Get connection quality
  const getConnectionQuality = useCallback(async (): Promise<'fast' | 'medium' | 'slow'> => {
    return audioUploadService.checkConnectionQuality();
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadError,
    transcriptionResult,
    isSupported,
    
    // Actions
    uploadAudio,
    resetUpload,
    
    // Utilities
    estimateUploadTime,
    getConnectionQuality,
  };
}


