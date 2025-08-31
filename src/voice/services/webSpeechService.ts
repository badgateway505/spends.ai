// Web Speech API service for real-time voice recognition
export interface WebSpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  language: string;
}

export interface WebSpeechConfig {
  language: 'en-US' | 'ru-RU';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  autoStopTimeout?: number; // Auto-stop after silence (ms)
}

export interface WebSpeechCapabilities {
  isSupported: boolean;
  supportedLanguages: string[];
  browserType: 'chrome' | 'safari' | 'edge' | 'firefox' | 'unknown';
}

export type WebSpeechEventType = 'start' | 'result' | 'end' | 'error' | 'silence';

export interface WebSpeechEvent {
  type: WebSpeechEventType;
  data?: any;
  error?: string;
}

export type WebSpeechEventHandler = (event: WebSpeechEvent) => void;

class WebSpeechService {
  private recognition: any | null = null;
  private isRecording = false;
  private eventHandlers: Map<WebSpeechEventType, WebSpeechEventHandler[]> = new Map();
  private config: WebSpeechConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    autoStopTimeout: 3000,
  };
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastSpeechTime = 0;

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Check if Web Speech API is supported
   */
  getCapabilities(): WebSpeechCapabilities {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    const isSupported = !!SpeechRecognition;
    const browserType = this.detectBrowserType();
    
    // Supported languages vary by browser, these are commonly supported
    const supportedLanguages = isSupported ? [
      'en-US', 'en-GB', 'en-AU', 'en-CA',
      'ru-RU', 'ru-BY', 'ru-KZ',
      'es-ES', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'zh-CN', 'ja-JP', 'ko-KR'
    ] : [];

    return {
      isSupported,
      supportedLanguages,
      browserType,
    };
  }

  /**
   * Initialize speech recognition with configuration
   */
  initialize(config: Partial<WebSpeechConfig> = {}): boolean {
    if (!this.getCapabilities().isSupported) {
      console.warn('Web Speech API not supported in this browser');
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.config = { ...this.config, ...config };

      // Configure recognition
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      this.setupRecognitionEvents();
      console.log('Web Speech API initialized successfully', this.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize Web Speech API:', error);
      return false;
    }
  }

  /**
   * Start voice recognition
   */
  async startRecognition(): Promise<boolean> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isRecording) {
      console.warn('Recognition already in progress');
      return false;
    }

    try {
      // Request microphone permissions
      await this.requestMicrophonePermission();
      
      this.isRecording = true;
      this.lastSpeechTime = Date.now();
      
      this.recognition.start();
      this.emit('start', {});
      
      // Start silence detection timer
      this.startSilenceDetection();
      
      console.log('Voice recognition started');
      return true;
    } catch (error) {
      this.isRecording = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', { error: errorMessage });
      console.error('Failed to start recognition:', error);
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  stopRecognition(): void {
    if (!this.recognition || !this.isRecording) {
      return;
    }

    try {
      this.isRecording = false;
      this.recognition.stop();
      this.stopSilenceDetection();
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }

  /**
   * Check if currently recording
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Add event listener
   */
  on(eventType: WebSpeechEventType, handler: WebSpeechEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: WebSpeechEventType, handler: WebSpeechEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Change language during recognition
   */
  setLanguage(language: 'en-US' | 'ru-RU'): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): WebSpeechConfig {
    return { ...this.config };
  }

  // Private methods

  private initializeEventHandlers(): void {
    ['start', 'result', 'end', 'error', 'silence'].forEach(eventType => {
      this.eventHandlers.set(eventType as WebSpeechEventType, []);
    });
  }

  private setupRecognitionEvents(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Recognition started');
    };

          this.recognition.onresult = (event: any) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.stopSilenceDetection();
      this.emit('end', {});
      console.log('Recognition ended');
    };

    this.recognition.onerror = (event: any) => {
      this.isRecording = false;
      this.stopSilenceDetection();
      this.emit('error', { error: event.error });
      console.error('Recognition error:', event.error);
    };
  }

  private handleRecognitionResult(event: any): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.8; // Fallback confidence

      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }

      const resultData: WebSpeechResult = {
        transcript: result.isFinal ? finalTranscript : interimTranscript,
        confidence,
        isFinal: result.isFinal,
        language: this.config.language,
      };

      this.emit('result', resultData);
    }

    // Update last speech time for silence detection
    if (finalTranscript || interimTranscript) {
      this.lastSpeechTime = Date.now();
    }
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Microphone permission denied or not available');
    }
  }

  private startSilenceDetection(): void {
    if (!this.config.autoStopTimeout) return;

    this.silenceTimer = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
      
      if (timeSinceLastSpeech > this.config.autoStopTimeout!) {
        this.emit('silence', { silenceDuration: timeSinceLastSpeech });
        this.stopRecognition();
      }
    }, 1000); // Check every second
  }

  private stopSilenceDetection(): void {
    if (this.silenceTimer) {
      clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private emit(eventType: WebSpeechEventType, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler({ type: eventType, data });
        } catch (error) {
          console.error(`Error in ${eventType} event handler:`, error);
        }
      });
    }
  }

  private detectBrowserType(): 'chrome' | 'safari' | 'edge' | 'firefox' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return 'chrome';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return 'safari';
    } else if (userAgent.includes('edg')) {
      return 'edge';
    } else if (userAgent.includes('firefox')) {
      return 'firefox';
    }
    
    return 'unknown';
  }

  /**
   * Create a new recognition instance for testing purposes
   */
  public createRecognitionInstance(): any | null {
    if (!this.getCapabilities().isSupported) {
      return null;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      return new SpeechRecognition();
    } catch (error) {
      console.error('Failed to create recognition instance:', error);
      return null;
    }
  }
}

// Export singleton instance
export const webSpeechService = new WebSpeechService();
