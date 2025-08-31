import { webSpeechService, type WebSpeechCapabilities } from './webSpeechService';
import { audioRecorderService } from './audioRecorderService';
import { audioUploadService } from './audioUploadService';
import type { AudioRecordingCapabilities } from '../types/audio.types';

export interface VoiceCapabilities {
  webSpeech: {
    isSupported: boolean;
    capabilities: WebSpeechCapabilities;
  };
  audioRecording: {
    isSupported: boolean;
    capabilities: AudioRecordingCapabilities;
  };
  audioUpload: {
    isSupported: boolean;
  };
  // Derived capabilities
  hasVoiceInput: boolean;
  hasRealtimeVoice: boolean;
  hasServerSTT: boolean;
  recommendedMethod: 'web-speech' | 'audio-upload' | 'manual' | 'none';
}

export interface VoiceManagerConfig {
  preferredLanguage?: 'en-US' | 'ru-RU';
  enableFallbacks?: boolean;
  autoSelectMethod?: boolean;
}

export class VoiceManager {
  private static instance: VoiceManager;
  private config: Required<VoiceManagerConfig>;
  private capabilities: VoiceCapabilities | null = null;

  private constructor() {
    this.config = {
      preferredLanguage: 'en-US',
      enableFallbacks: true,
      autoSelectMethod: true
    };
  }

  public static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager();
    }
    return VoiceManager.instance;
  }

  public configure(config: Partial<VoiceManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public async initialize(): Promise<VoiceCapabilities> {
    // Get capabilities from each service
    const webSpeechCaps = webSpeechService.getCapabilities();
    const audioRecorderCaps = audioRecorderService.getCapabilities();
    const audioUploadSupported = audioUploadService.isSupported();

    // Determine derived capabilities
    const hasRealtimeVoice = webSpeechCaps.isSupported;
    const hasServerSTT = audioRecorderCaps.isSupported && audioUploadSupported;
    const hasVoiceInput = hasRealtimeVoice || hasServerSTT;

    // Determine recommended method based on capabilities and user agent
    let recommendedMethod: VoiceCapabilities['recommendedMethod'] = 'none';
    
    if (hasRealtimeVoice) {
      // Web Speech API is preferred for real-time experience
      recommendedMethod = 'web-speech';
    } else if (hasServerSTT) {
      // Fallback to server-side STT
      recommendedMethod = 'audio-upload';
    } else {
      // No voice capabilities, fall back to manual entry
      recommendedMethod = 'manual';
    }

    this.capabilities = {
      webSpeech: {
        isSupported: webSpeechCaps.isSupported,
        capabilities: webSpeechCaps
      },
      audioRecording: {
        isSupported: audioRecorderCaps.isSupported,
        capabilities: audioRecorderCaps
      },
      audioUpload: {
        isSupported: audioUploadSupported
      },
      hasVoiceInput,
      hasRealtimeVoice,
      hasServerSTT,
      recommendedMethod
    };

    return this.capabilities;
  }

  public getCapabilities(): VoiceCapabilities | null {
    return this.capabilities;
  }

  public async detectOptimalMethod(): Promise<VoiceCapabilities['recommendedMethod']> {
    if (!this.capabilities) {
      await this.initialize();
    }

    if (!this.capabilities) {
      return 'manual';
    }

    // If auto-selection is disabled, return the pre-determined method
    if (!this.config.autoSelectMethod) {
      return this.capabilities.recommendedMethod;
    }

    // Dynamic detection based on current conditions
    const { webSpeech, audioRecording, audioUpload } = this.capabilities;

    // Check if Web Speech API is available and working
    if (webSpeech.isSupported) {
      try {
        // Test if we can create a recognition instance
        const testRecognition = webSpeechService.createRecognitionInstance();
        if (testRecognition) {
          return 'web-speech';
        }
      } catch (error) {
        console.warn('Web Speech API test failed:', error);
      }
    }

    // Fallback to audio recording + server STT
    if (audioRecording.isSupported && audioUpload.isSupported) {
      try {
        // Test if we can request microphone access
        const hasPermission = await this.testMicrophonePermission();
        if (hasPermission) {
          return 'audio-upload';
        }
      } catch (error) {
        console.warn('Microphone permission test failed:', error);
      }
    }

    // Final fallback to manual entry
    return 'manual';
  }

  public async fallbackToNextMethod(currentMethod: VoiceCapabilities['recommendedMethod']): Promise<VoiceCapabilities['recommendedMethod']> {
    if (!this.config.enableFallbacks) {
      return 'manual';
    }

    if (!this.capabilities) {
      await this.initialize();
    }

    if (!this.capabilities) {
      return 'manual';
    }

    switch (currentMethod) {
      case 'web-speech':
        // Try audio recording fallback
        if (this.capabilities.hasServerSTT) {
          return 'audio-upload';
        }
        return 'manual';
      
      case 'audio-upload':
        // No more voice fallbacks, go to manual
        return 'manual';
      
      case 'manual':
      case 'none':
      default:
        return 'manual';
    }
  }

  public getMethodDisplayName(method: VoiceCapabilities['recommendedMethod']): string {
    switch (method) {
      case 'web-speech':
        return 'Voice Recognition (Real-time)';
      case 'audio-upload':
        return 'Voice Recording (Server)';
      case 'manual':
        return 'Manual Entry';
      case 'none':
        return 'Not Available';
      default:
        return 'Unknown';
    }
  }

  public getMethodDescription(method: VoiceCapabilities['recommendedMethod']): string {
    switch (method) {
      case 'web-speech':
        return 'Speak naturally and see your words appear in real-time';
      case 'audio-upload':
        return 'Record your voice and we\'ll transcribe it for you';
      case 'manual':
        return 'Type your expense manually';
      case 'none':
        return 'Voice input is not available on this device';
      default:
        return '';
    }
  }

  public isMethodAvailable(method: VoiceCapabilities['recommendedMethod']): boolean {
    if (!this.capabilities) {
      return false;
    }

    switch (method) {
      case 'web-speech':
        return this.capabilities.webSpeech.isSupported;
      case 'audio-upload':
        return this.capabilities.hasServerSTT;
      case 'manual':
        return true; // Manual entry is always available
      case 'none':
        return false;
      default:
        return false;
    }
  }

  private async testMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  public getBrowserCompatibilityInfo(): {
    browser: string;
    webSpeechSupport: 'full' | 'partial' | 'none';
    audioRecordingSupport: 'full' | 'partial' | 'none';
    recommendedBrowsers: string[];
  } {
    const userAgent = navigator.userAgent.toLowerCase();
    let browser = 'unknown';
    let webSpeechSupport: 'full' | 'partial' | 'none' = 'none';
    let audioRecordingSupport: 'full' | 'partial' | 'none' = 'none';

    // Detect browser
    if (userAgent.includes('chrome')) {
      browser = 'Chrome';
      webSpeechSupport = 'full';
      audioRecordingSupport = 'full';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browser = 'Safari';
      webSpeechSupport = 'partial'; // Limited language support
      audioRecordingSupport = 'full';
    } else if (userAgent.includes('firefox')) {
      browser = 'Firefox';
      webSpeechSupport = 'none'; // No Web Speech API support
      audioRecordingSupport = 'full';
    } else if (userAgent.includes('edge')) {
      browser = 'Edge';
      webSpeechSupport = 'full';
      audioRecordingSupport = 'full';
    }

    return {
      browser,
      webSpeechSupport,
      audioRecordingSupport,
      recommendedBrowsers: ['Chrome', 'Edge', 'Safari']
    };
  }
}

// Export singleton instance
export const voiceManager = VoiceManager.getInstance();
