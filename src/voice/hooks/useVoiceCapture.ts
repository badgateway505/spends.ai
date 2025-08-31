import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceManager, type VoiceCapabilities } from '../services/voiceManager';
import { useWebSpeech } from './useWebSpeech';
import { useAudioRecorder } from './useAudioRecorder';
import { useAudioUpload } from './useAudioUpload';
import type { AudioRecordingResult } from '../types/audio.types';

export interface UseVoiceCaptureOptions {
  language?: 'en-US' | 'ru-RU';
  autoStopTimeout?: number;
  enableFallbacks?: boolean;
  onTranscriptComplete?: (transcript: string, method: VoiceCapabilities['recommendedMethod']) => void;
  onMethodChange?: (newMethod: VoiceCapabilities['recommendedMethod'], reason: string) => void;
  onError?: (error: string, method: VoiceCapabilities['recommendedMethod']) => void;
  onStart?: (method: VoiceCapabilities['recommendedMethod']) => void;
  onStop?: (method: VoiceCapabilities['recommendedMethod']) => void;
}

export interface UseVoiceCaptureReturn {
  // Capabilities
  capabilities: VoiceCapabilities | null;
  currentMethod: VoiceCapabilities['recommendedMethod'];
  isVoiceSupported: boolean;
  
  // Current state
  isCapturing: boolean;
  transcript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  
  // Progress (for audio upload)
  uploadProgress: number;
  isProcessing: boolean;
  
  // Actions
  startCapture: () => Promise<boolean>;
  stopCapture: () => Promise<void>;
  resetCapture: () => void;
  switchToMethod: (method: VoiceCapabilities['recommendedMethod']) => Promise<boolean>;
  fallbackToNextMethod: () => Promise<boolean>;
  
  // Method info
  getMethodDisplayName: (method?: VoiceCapabilities['recommendedMethod']) => string;
  getMethodDescription: (method?: VoiceCapabilities['recommendedMethod']) => string;
  getAvailableMethods: () => VoiceCapabilities['recommendedMethod'][];
  getBrowserCompatibility: () => ReturnType<typeof voiceManager.getBrowserCompatibilityInfo>;
}

export function useVoiceCapture(options: UseVoiceCaptureOptions = {}): UseVoiceCaptureReturn {
  const {
    language = 'en-US',
    autoStopTimeout = 3000,
    enableFallbacks = true,
    onTranscriptComplete,
    onMethodChange,
    onError,
    onStart,
    onStop
  } = options;

  // State
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);
  const [currentMethod, setCurrentMethod] = useState<VoiceCapabilities['recommendedMethod']>('none');
  const [isCapturing, setIsCapturing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for callbacks
  const callbacksRef = useRef({
    onTranscriptComplete,
    onMethodChange,
    onError,
    onStart,
    onStop
  });

  useEffect(() => {
    callbacksRef.current = {
      onTranscriptComplete,
      onMethodChange,
      onError,
      onStart,
      onStop
    };
  }, [onTranscriptComplete, onMethodChange, onError, onStart, onStop]);

  // Web Speech hook
  const webSpeech = useWebSpeech({
    language,
    autoStopTimeout,
    onTranscript: (text, isFinal) => {
      if (currentMethod !== 'web-speech') return;
      
      if (isFinal) {
        const newFinalTranscript = finalTranscript ? `${finalTranscript} ${text}` : text;
        setFinalTranscript(newFinalTranscript);
        setTranscript('');
      } else {
        setTranscript(text);
      }
    },
    onError: (errorMsg) => {
      if (currentMethod !== 'web-speech') return;
      
      setError(errorMsg);
      callbacksRef.current.onError?.(errorMsg, 'web-speech');
      
      // Auto-fallback if enabled
      if (enableFallbacks) {
        handleAutoFallback('web-speech', errorMsg);
      }
    },
    onStart: () => {
      if (currentMethod !== 'web-speech') return;
      setIsCapturing(true);
      setError(null);
      callbacksRef.current.onStart?.('web-speech');
    },
    onStop: () => {
      if (currentMethod !== 'web-speech') return;
      setIsCapturing(false);
      
      // Send final transcript
      const fullTranscript = finalTranscript.trim();
      if (fullTranscript) {
        callbacksRef.current.onTranscriptComplete?.(fullTranscript, 'web-speech');
      }
      
      callbacksRef.current.onStop?.('web-speech');
    }
  });

  // Audio recorder hook
  const audioRecorder = useAudioRecorder({
    maxDuration: 120000, // 2 minutes
    maxFileSize: 25 * 1024 * 1024, // 25MB
    onRecordingComplete: async (result: AudioRecordingResult) => {
      if (currentMethod !== 'audio-upload') return;
      
      setIsProcessing(true);
      try {
        await audioUpload.uploadAudio(result);
      } catch (error) {
        console.error('Audio upload failed:', error);
        setIsProcessing(false);
      }
    },
    onError: (audioError) => {
      if (currentMethod !== 'audio-upload') return;
      
      const errorMsg = audioError.message;
      setError(errorMsg);
      callbacksRef.current.onError?.(errorMsg, 'audio-upload');
      
      // Auto-fallback if enabled
      if (enableFallbacks) {
        handleAutoFallback('audio-upload', errorMsg);
      }
    },
    onStart: () => {
      if (currentMethod !== 'audio-upload') return;
      setIsCapturing(true);
      setError(null);
      callbacksRef.current.onStart?.('audio-upload');
    },
    onStop: () => {
      if (currentMethod !== 'audio-upload') return;
      setIsCapturing(false);
      callbacksRef.current.onStop?.('audio-upload');
    }
  });

  // Audio upload hook
  const audioUpload = useAudioUpload({
    language: language === 'ru-RU' ? 'ru' : 'en',
    onSuccess: (result) => {
      if (currentMethod !== 'audio-upload') return;
      
      setIsProcessing(false);
      setUploadProgress(100);
      callbacksRef.current.onTranscriptComplete?.(result.text, 'audio-upload');
    },
    onError: (uploadError) => {
      if (currentMethod !== 'audio-upload') return;
      
      setIsProcessing(false);
      const errorMsg = uploadError.message;
      setError(errorMsg);
      callbacksRef.current.onError?.(errorMsg, 'audio-upload');
    },
    onProgress: (progress) => {
      if (currentMethod !== 'audio-upload') return;
      setUploadProgress(progress.percentage);
    }
  });

  // Initialize voice capabilities
  useEffect(() => {
    const initializeCapabilities = async () => {
      try {
        voiceManager.configure({
          preferredLanguage: language,
          enableFallbacks,
          autoSelectMethod: true
        });

        const caps = await voiceManager.initialize();
        setCapabilities(caps);
        
        const optimalMethod = await voiceManager.detectOptimalMethod();
        setCurrentMethod(optimalMethod);
      } catch (error) {
        console.error('Failed to initialize voice capabilities:', error);
        setCurrentMethod('manual');
      }
    };

    initializeCapabilities();
  }, [language, enableFallbacks]);

  // Auto-fallback handler
  const handleAutoFallback = useCallback(async (failedMethod: VoiceCapabilities['recommendedMethod'], reason: string) => {
    try {
      const nextMethod = await voiceManager.fallbackToNextMethod(failedMethod);
      if (nextMethod !== failedMethod) {
        setCurrentMethod(nextMethod);
        callbacksRef.current.onMethodChange?.(nextMethod, `Fallback from ${failedMethod}: ${reason}`);
        
        // Auto-start the new method if we were capturing
        if (isCapturing) {
          setTimeout(() => {
            startCaptureWithMethod(nextMethod);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Fallback failed:', error);
      setCurrentMethod('manual');
    }
  }, [isCapturing]);

  // Start capture with specific method
  const startCaptureWithMethod = useCallback(async (method: VoiceCapabilities['recommendedMethod']): Promise<boolean> => {
    setError(null);
    setTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setUploadProgress(0);
    setIsProcessing(false);

    switch (method) {
      case 'web-speech':
        if (!webSpeech.isSupported) {
          setError('Web Speech API not supported');
          return false;
        }
        return await webSpeech.startListening();

      case 'audio-upload':
        if (!audioRecorder.isSupported) {
          setError('Audio recording not supported');
          return false;
        }
        return await audioRecorder.startRecording();

      case 'manual':
        setError('Manual entry mode - voice capture not started');
        return false;

      case 'none':
        setError('No voice input methods available');
        return false;

      default:
        setError(`Unknown capture method: ${method}`);
        return false;
    }
  }, [webSpeech, audioRecorder]);

  // Actions
  const startCapture = useCallback(async (): Promise<boolean> => {
    return await startCaptureWithMethod(currentMethod);
  }, [currentMethod, startCaptureWithMethod]);

  const stopCapture = useCallback(async (): Promise<void> => {
    switch (currentMethod) {
      case 'web-speech':
        webSpeech.stopListening();
        break;
      case 'audio-upload':
        await audioRecorder.stopRecording();
        break;
    }
  }, [currentMethod, webSpeech, audioRecorder]);

  const resetCapture = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setError(null);
    setUploadProgress(0);
    setIsProcessing(false);
    
    webSpeech.resetTranscript();
    audioRecorder.resetRecorder();
    audioUpload.resetUpload();
  }, [webSpeech, audioRecorder, audioUpload]);

  const switchToMethod = useCallback(async (method: VoiceCapabilities['recommendedMethod']): Promise<boolean> => {
    if (!voiceManager.isMethodAvailable(method)) {
      setError(`Method ${method} is not available`);
      return false;
    }

    // Stop current capture if active
    if (isCapturing) {
      await stopCapture();
    }

    const previousMethod = currentMethod;
    setCurrentMethod(method);
    callbacksRef.current.onMethodChange?.(method, `Manual switch from ${previousMethod}`);
    
    return true;
  }, [currentMethod, isCapturing, stopCapture]);

  const fallbackToNextMethod = useCallback(async (): Promise<boolean> => {
    const nextMethod = await voiceManager.fallbackToNextMethod(currentMethod);
    if (nextMethod === currentMethod) {
      return false; // No fallback available
    }
    
    return await switchToMethod(nextMethod);
  }, [currentMethod, switchToMethod]);

  // Utility functions
  const getMethodDisplayName = useCallback((method?: VoiceCapabilities['recommendedMethod']) => {
    return voiceManager.getMethodDisplayName(method || currentMethod);
  }, [currentMethod]);

  const getMethodDescription = useCallback((method?: VoiceCapabilities['recommendedMethod']) => {
    return voiceManager.getMethodDescription(method || currentMethod);
  }, [currentMethod]);

  const getAvailableMethods = useCallback((): VoiceCapabilities['recommendedMethod'][] => {
    if (!capabilities) return ['manual'];
    
    const methods: VoiceCapabilities['recommendedMethod'][] = ['manual'];
    
    if (capabilities.webSpeech.isSupported) {
      methods.unshift('web-speech');
    }
    
    if (capabilities.hasServerSTT) {
      methods.splice(capabilities.webSpeech.isSupported ? 1 : 0, 0, 'audio-upload');
    }
    
    return methods;
  }, [capabilities]);

  const getBrowserCompatibility = useCallback(() => {
    return voiceManager.getBrowserCompatibilityInfo();
  }, []);

  // Update confidence for web speech
  useEffect(() => {
    if (currentMethod === 'web-speech') {
      setConfidence(webSpeech.confidence);
    }
  }, [currentMethod, webSpeech.confidence]);

  return {
    // Capabilities
    capabilities,
    currentMethod,
    isVoiceSupported: capabilities?.hasVoiceInput ?? false,
    
    // Current state
    isCapturing,
    transcript,
    finalTranscript,
    confidence,
    error,
    
    // Progress
    uploadProgress,
    isProcessing,
    
    // Actions
    startCapture,
    stopCapture,
    resetCapture,
    switchToMethod,
    fallbackToNextMethod,
    
    // Method info
    getMethodDisplayName,
    getMethodDescription,
    getAvailableMethods,
    getBrowserCompatibility,
  };
}
