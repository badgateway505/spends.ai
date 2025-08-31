import { useState, useEffect, useCallback, useRef } from 'react';
import { webSpeechService, type WebSpeechResult, type WebSpeechConfig, type WebSpeechCapabilities } from '../services/webSpeechService';

export interface UseWebSpeechOptions {
  language?: 'en-US' | 'ru-RU';
  autoStopTimeout?: number;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export interface UseWebSpeechReturn {
  // State
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  capabilities: WebSpeechCapabilities;
  
  // Actions
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  resetTranscript: () => void;
  setLanguage: (language: 'en-US' | 'ru-RU') => void;
}

export function useWebSpeech(options: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const {
    language = 'en-US',
    autoStopTimeout = 3000,
    onTranscript,
    onError,
    onStart,
    onStop
  } = options;

  // State
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<WebSpeechCapabilities>({
    isSupported: false,
    supportedLanguages: [],
    browserType: 'unknown'
  });

  // Refs for callbacks to avoid dependency issues
  const callbacksRef = useRef({
    onTranscript,
    onError,
    onStart,
    onStop
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onTranscript,
      onError,
      onStart,
      onStop
    };
  }, [onTranscript, onError, onStart, onStop]);

  // Initialize Web Speech API
  useEffect(() => {
    const caps = webSpeechService.getCapabilities();
    setCapabilities(caps);
    setIsSupported(caps.isSupported);

    if (caps.isSupported) {
      const config: Partial<WebSpeechConfig> = {
        language,
        continuous: true,
        interimResults: true,
        maxAlternatives: 1,
        autoStopTimeout,
      };

      const initialized = webSpeechService.initialize(config);
      if (!initialized) {
        setError('Failed to initialize Web Speech API');
        setIsSupported(false);
      }
    }
  }, [language, autoStopTimeout]);

  // Set up event handlers
  useEffect(() => {
    if (!isSupported) return;

    const handleStart = () => {
      setIsListening(true);
      setError(null);
      callbacksRef.current.onStart?.();
    };

    const handleResult = (event: any) => {
      const result = event.data as WebSpeechResult;
      
      if (result.isFinal) {
        setFinalTranscript(prev => prev + result.transcript);
        setTranscript(''); // Clear interim transcript
        callbacksRef.current.onTranscript?.(result.transcript, true);
      } else {
        setTranscript(result.transcript);
        callbacksRef.current.onTranscript?.(result.transcript, false);
      }
      
      setConfidence(result.confidence);
    };

    const handleEnd = () => {
      setIsListening(false);
      callbacksRef.current.onStop?.();
    };

    const handleError = (event: any) => {
      const errorMessage = event.error || 'Unknown speech recognition error';
      setError(errorMessage);
      setIsListening(false);
      callbacksRef.current.onError?.(errorMessage);
    };

    const handleSilence = () => {
      // Silence detected, recording will stop automatically
      console.log('Silence detected, stopping recognition');
    };

    // Add event listeners
    webSpeechService.on('start', handleStart);
    webSpeechService.on('result', handleResult);
    webSpeechService.on('end', handleEnd);
    webSpeechService.on('error', handleError);
    webSpeechService.on('silence', handleSilence);

    // Cleanup
    return () => {
      webSpeechService.off('start', handleStart);
      webSpeechService.off('result', handleResult);
      webSpeechService.off('end', handleEnd);
      webSpeechService.off('error', handleError);
      webSpeechService.off('silence', handleSilence);
    };
  }, [isSupported]);

  // Actions
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      const errorMsg = 'Web Speech API not supported';
      setError(errorMsg);
      callbacksRef.current.onError?.(errorMsg);
      return false;
    }

    try {
      setError(null);
      const started = await webSpeechService.startRecognition();
      return started;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start speech recognition';
      setError(errorMsg);
      callbacksRef.current.onError?.(errorMsg);
      return false;
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    webSpeechService.stopRecognition();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  const setLanguage = useCallback((newLanguage: 'en-US' | 'ru-RU') => {
    webSpeechService.setLanguage(newLanguage);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        webSpeechService.stopRecognition();
      }
    };
  }, [isListening]);

  return {
    // State
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    confidence,
    error,
    capabilities,
    
    // Actions
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };
}
