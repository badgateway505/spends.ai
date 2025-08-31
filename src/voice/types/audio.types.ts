export interface AudioRecordingCapabilities {
  isSupported: boolean;
  supportedMimeTypes: string[];
  maxFileSize: number; // in bytes
}

export interface AudioRecordingConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
  maxDuration?: number; // in milliseconds
  maxFileSize?: number; // in bytes (25MB default)
}

export interface AudioRecordingResult {
  blob: Blob;
  duration: number;
  size: number;
  mimeType: string;
}

export interface AudioRecordingError {
  code: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'FILE_TOO_LARGE' | 'DURATION_EXCEEDED' | 'UNKNOWN';
  message: string;
}

export type AudioRecordingEventType = 'start' | 'stop' | 'data' | 'error' | 'pause' | 'resume';

export interface AudioRecordingEvent {
  type: AudioRecordingEventType;
  data?: AudioRecordingResult | AudioRecordingError;
}

export type AudioRecordingEventHandler = (event: AudioRecordingEvent) => void;
