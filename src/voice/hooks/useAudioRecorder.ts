import { useState, useEffect, useCallback, useRef } from 'react';
import { audioRecorderService } from '../services/audioRecorderService';
import type {
  AudioRecordingCapabilities,
  AudioRecordingConfig,
  AudioRecordingResult,
  AudioRecordingError
} from '../types/audio.types';

export interface UseAudioRecorderOptions {
  maxDuration?: number; // in milliseconds
  maxFileSize?: number; // in bytes
  audioBitsPerSecond?: number;
  onRecordingComplete?: (result: AudioRecordingResult) => void;
  onError?: (error: AudioRecordingError) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export interface UseAudioRecorderReturn {
  // State
  isSupported: boolean;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedSize: number;
  error: AudioRecordingError | null;
  capabilities: AudioRecordingCapabilities;
  
  // Actions
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<AudioRecordingResult | null>;
  pauseRecording: () => boolean;
  resumeRecording: () => boolean;
  resetRecorder: () => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const {
    maxDuration = 120000, // 2 minutes
    maxFileSize = 25 * 1024 * 1024, // 25MB
    audioBitsPerSecond = 128000, // 128kbps
    onRecordingComplete,
    onError,
    onStart,
    onStop
  } = options;

  // State
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedSize, setRecordedSize] = useState(0);
  const [error, setError] = useState<AudioRecordingError | null>(null);
  const [capabilities, setCapabilities] = useState<AudioRecordingCapabilities>({
    isSupported: false,
    supportedMimeTypes: [],
    maxFileSize: 0
  });

  // Refs for callbacks to avoid dependency issues
  const callbacksRef = useRef({
    onRecordingComplete,
    onError,
    onStart,
    onStop
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onRecordingComplete,
      onError,
      onStart,
      onStop
    };
  }, [onRecordingComplete, onError, onStart, onStop]);

  // Timer for updating duration
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio recorder
  useEffect(() => {
    const caps = audioRecorderService.getCapabilities();
    setCapabilities(caps);
    setIsSupported(caps.isSupported);

    if (caps.isSupported) {
      const config: Partial<AudioRecordingConfig> = {
        maxDuration,
        maxFileSize,
        audioBitsPerSecond,
      };

      audioRecorderService.initialize(config).then(initialized => {
        if (!initialized) {
          setError({
            code: 'NOT_SUPPORTED',
            message: 'Failed to initialize audio recorder'
          });
          setIsSupported(false);
        }
      });
    }
  }, [maxDuration, maxFileSize, audioBitsPerSecond]);

  // Update state from recorder
  const updateRecorderState = useCallback(() => {
    const state = audioRecorderService.getRecordingState();
    setIsRecording(state.isRecording);
    setIsPaused(state.isPaused);
    setDuration(state.duration);
    setRecordedSize(state.recordedSize);
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!isSupported) return;

    const handleStart = () => {
      setError(null);
      callbacksRef.current.onStart?.();
      
      // Start duration timer
      durationTimerRef.current = setInterval(updateRecorderState, 100);
    };

    const handleStop = () => {
      callbacksRef.current.onStop?.();
      
      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      updateRecorderState();
    };

    const handleData = (event: any) => {
      const result = event.data as AudioRecordingResult;
      callbacksRef.current.onRecordingComplete?.(result);
      updateRecorderState();
    };

    const handleError = (event: any) => {
      const error = event.data as AudioRecordingError;
      setError(error);
      callbacksRef.current.onError?.(error);
      
      // Clear duration timer on error
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      updateRecorderState();
    };

    const handlePause = () => {
      updateRecorderState();
    };

    const handleResume = () => {
      updateRecorderState();
    };

    // Add event listeners
    audioRecorderService.on('start', handleStart);
    audioRecorderService.on('stop', handleStop);
    audioRecorderService.on('data', handleData);
    audioRecorderService.on('error', handleError);
    audioRecorderService.on('pause', handlePause);
    audioRecorderService.on('resume', handleResume);

    // Cleanup
    return () => {
      audioRecorderService.off('start', handleStart);
      audioRecorderService.off('stop', handleStop);
      audioRecorderService.off('data', handleData);
      audioRecorderService.off('error', handleError);
      audioRecorderService.off('pause', handlePause);
      audioRecorderService.off('resume', handleResume);
      
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [isSupported, updateRecorderState]);

  // Actions
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      const errorData: AudioRecordingError = {
        code: 'NOT_SUPPORTED',
        message: 'Audio recording not supported in this browser'
      };
      setError(errorData);
      callbacksRef.current.onError?.(errorData);
      return false;
    }

    try {
      setError(null);
      const started = await audioRecorderService.startRecording();
      return started;
    } catch (error) {
      const errorData: AudioRecordingError = {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Failed to start recording'
      };
      setError(errorData);
      callbacksRef.current.onError?.(errorData);
      return false;
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    try {
      const result = await audioRecorderService.stopRecording();
      return result;
    } catch (error) {
      const errorData: AudioRecordingError = {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Failed to stop recording'
      };
      setError(errorData);
      callbacksRef.current.onError?.(errorData);
      return null;
    }
  }, []);

  const pauseRecording = useCallback((): boolean => {
    return audioRecorderService.pauseRecording();
  }, []);

  const resumeRecording = useCallback((): boolean => {
    return audioRecorderService.resumeRecording();
  }, []);

  const resetRecorder = useCallback(() => {
    setError(null);
    setDuration(0);
    setRecordedSize(0);
    
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    updateRecorderState();
  }, [updateRecorderState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        audioRecorderService.stopRecording();
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRecording]);

  return {
    // State
    isSupported,
    isRecording,
    isPaused,
    duration,
    recordedSize,
    error,
    capabilities,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecorder,
  };
}
