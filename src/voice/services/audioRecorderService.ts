import type {
  AudioRecordingCapabilities,
  AudioRecordingConfig,
  AudioRecordingResult,
  AudioRecordingError,
  AudioRecordingEventType,
  AudioRecordingEventHandler,
  AudioRecordingEvent
} from '../types/audio.types';

/**
 * Audio recorder service using MediaRecorder API for browsers without Web Speech API support
 */
class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private isPaused = false;
  private startTime = 0;
  private config: AudioRecordingConfig = {
    maxDuration: 120000, // 2 minutes
    maxFileSize: 25 * 1024 * 1024, // 25MB
    audioBitsPerSecond: 128000, // 128kbps
  };
  private eventHandlers: Map<AudioRecordingEventType, AudioRecordingEventHandler[]> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Check audio recording capabilities
   */
  getCapabilities(): AudioRecordingCapabilities {
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window;
    const isSupported = hasMediaDevices && hasMediaRecorder;
    
    const supportedMimeTypes: string[] = [];
    
    if (isSupported) {
      // Common audio formats to check
      const formats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/mp3',
        'audio/wav',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      
      formats.forEach(format => {
        if (MediaRecorder.isTypeSupported(format)) {
          supportedMimeTypes.push(format);
        }
      });
    }

    return {
      isSupported,
      supportedMimeTypes,
      maxFileSize: this.config.maxFileSize || 25 * 1024 * 1024,
    };
  }

  /**
   * Initialize audio recorder with configuration
   */
  async initialize(config: Partial<AudioRecordingConfig> = {}): Promise<boolean> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.isSupported) {
      console.warn('Audio recording not supported in this browser');
      return false;
    }

    this.config = { ...this.config, ...config };

    // Set default mime type if not specified
    if (!this.config.mimeType && capabilities.supportedMimeTypes.length > 0) {
      // Prefer WebM with Opus, then WebM, then any supported format
      this.config.mimeType = capabilities.supportedMimeTypes.find(type => 
        type.includes('webm') && type.includes('opus')
      ) || capabilities.supportedMimeTypes.find(type => 
        type.includes('webm')
      ) || capabilities.supportedMimeTypes[0];
    }

    console.log('Audio recorder initialized with config:', this.config);
    return true;
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return false;
    }

    try {
      // Request microphone permission and get media stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create MediaRecorder
      const options: MediaRecorderOptions = {};
      
      if (this.config.mimeType) {
        options.mimeType = this.config.mimeType;
      }
      
      if (this.config.audioBitsPerSecond) {
        options.audioBitsPerSecond = this.config.audioBitsPerSecond;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.setupMediaRecorderEvents();

      // Clear previous recording
      this.recordedChunks = [];
      this.startTime = Date.now();
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.isPaused = false;

      this.emit('start', {});
      console.log('Audio recording started');
      return true;

    } catch (error) {
      const errorData: AudioRecordingError = {
        code: error instanceof Error && error.name === 'NotAllowedError' 
          ? 'PERMISSION_DENIED' 
          : 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Failed to start recording'
      };
      
      this.emit('error', errorData);
      console.error('Failed to start audio recording:', error);
      return false;
    }
  }

  /**
   * Stop audio recording
   */
  async stopRecording(): Promise<AudioRecordingResult | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('No active recording to stop');
      return null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No media recorder available'));
        return;
      }

      // Set up one-time event listener for when recording stops
      const handleDataAvailable = () => {
        const duration = Date.now() - this.startTime;
        const blob = new Blob(this.recordedChunks, { 
          type: this.config.mimeType || 'audio/webm' 
        });

        const result: AudioRecordingResult = {
          blob,
          duration,
          size: blob.size,
          mimeType: this.config.mimeType || 'audio/webm',
        };

        // Check file size limit
        if (this.config.maxFileSize && blob.size > this.config.maxFileSize) {
          const error: AudioRecordingError = {
            code: 'FILE_TOO_LARGE',
            message: `File size ${blob.size} exceeds limit of ${this.config.maxFileSize} bytes`
          };
          this.emit('error', error);
          reject(error);
          return;
        }

        this.emit('data', result);
        resolve(result);
      };

      this.mediaRecorder.addEventListener('stop', handleDataAvailable, { once: true });
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      this.emit('stop', {});
      console.log('Audio recording stopped');
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): boolean {
    if (!this.isRecording || !this.mediaRecorder || this.isPaused) {
      return false;
    }

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.emit('pause', {});
      console.log('Audio recording paused');
      return true;
    }

    return false;
  }

  /**
   * Resume recording
   */
  resumeRecording(): boolean {
    if (!this.isRecording || !this.mediaRecorder || !this.isPaused) {
      return false;
    }

    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.emit('resume', {});
      console.log('Audio recording resumed');
      return true;
    }

    return false;
  }

  /**
   * Get current recording state
   */
  getRecordingState(): {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    recordedSize: number;
  } {
    const duration = this.isRecording ? Date.now() - this.startTime : 0;
    const recordedSize = this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0);

    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration,
      recordedSize,
    };
  }

  /**
   * Add event listener
   */
  on(eventType: AudioRecordingEventType, handler: AudioRecordingEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: AudioRecordingEventType, handler: AudioRecordingEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioRecordingConfig {
    return { ...this.config };
  }

  // Private methods

  private initializeEventHandlers(): void {
    ['start', 'stop', 'data', 'error', 'pause', 'resume'].forEach(eventType => {
      this.eventHandlers.set(eventType as AudioRecordingEventType, []);
    });
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        
        // Check duration limit
        const duration = Date.now() - this.startTime;
        if (this.config.maxDuration && duration > this.config.maxDuration) {
          const error: AudioRecordingError = {
            code: 'DURATION_EXCEEDED',
            message: `Recording duration ${duration}ms exceeds limit of ${this.config.maxDuration}ms`
          };
          this.emit('error', error);
          this.stopRecording();
        }
      }
    };

    this.mediaRecorder.onerror = (event: any) => {
      const error: AudioRecordingError = {
        code: 'UNKNOWN',
        message: `MediaRecorder error: ${event.error?.name || 'Unknown error'}`
      };
      this.emit('error', error);
      console.error('MediaRecorder error:', event.error);
    };
  }

  private emit(eventType: AudioRecordingEventType, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const event: AudioRecordingEvent = { type: eventType, data };
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in ${eventType} event handler:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const audioRecorderService = new AudioRecorderService();
