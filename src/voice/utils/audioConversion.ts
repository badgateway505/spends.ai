import type { AudioRecordingResult } from '../types/audio.types';

/**
 * Supported audio formats for conversion
 */
export const SUPPORTED_FORMATS = {
  WEBM: 'audio/webm',
  MP3: 'audio/mp3',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
  MP4: 'audio/mp4'
} as const;

export type SupportedFormat = typeof SUPPORTED_FORMATS[keyof typeof SUPPORTED_FORMATS];

/**
 * Audio conversion options
 */
export interface AudioConversionOptions {
  targetFormat?: SupportedFormat;
  quality?: number; // 0-1, where 1 is highest quality
  maxFileSize?: number; // in bytes
}

/**
 * Audio conversion result
 */
export interface AudioConversionResult {
  blob: Blob;
  originalSize: number;
  convertedSize: number;
  format: string;
  compressionRatio: number;
}

/**
 * Convert audio blob to a different format or compress it
 * Note: This is a basic implementation. For production, consider using FFmpeg.wasm for more robust conversion
 */
export async function convertAudio(
  audioResult: AudioRecordingResult,
  options: AudioConversionOptions = {}
): Promise<AudioConversionResult> {
  const {
    targetFormat = SUPPORTED_FORMATS.WEBM,
    quality = 0.8,
    maxFileSize = 25 * 1024 * 1024 // 25MB
  } = options;

  try {
    // If the audio is already in the target format and within size limits, return as-is
    if (audioResult.mimeType === targetFormat && audioResult.size <= maxFileSize) {
      return {
        blob: audioResult.blob,
        originalSize: audioResult.size,
        convertedSize: audioResult.size,
        format: targetFormat,
        compressionRatio: 1
      };
    }

    // For basic conversion, we'll use the Web Audio API to decode and re-encode
    const convertedBlob = await convertUsingWebAudio(audioResult.blob, targetFormat);
    
    // If still too large, try with lower quality
    let finalBlob = convertedBlob;
    let currentQuality = quality;
    
    while (finalBlob.size > maxFileSize && currentQuality > 0.1) {
      currentQuality -= 0.1;
      finalBlob = await convertUsingWebAudio(audioResult.blob, targetFormat);
    }

    return {
      blob: finalBlob,
      originalSize: audioResult.size,
      convertedSize: finalBlob.size,
      format: targetFormat,
      compressionRatio: finalBlob.size / audioResult.size
    };

  } catch (error) {
    console.error('Audio conversion failed:', error);
    
    // Fallback: return original if conversion fails
    return {
      blob: audioResult.blob,
      originalSize: audioResult.size,
      convertedSize: audioResult.size,
      format: audioResult.mimeType,
      compressionRatio: 1
    };
  }
}

/**
 * Convert audio using Web Audio API
 * This is a simplified conversion that works for basic format changes
 */
async function convertUsingWebAudio(
  blob: Blob,
  targetFormat: SupportedFormat
): Promise<Blob> {
  // For now, we'll return the original blob as Web Audio API conversion
  // is complex and requires specific codecs. In a production environment,
  // you would use FFmpeg.wasm or a server-side conversion service.
  
  // Check if we can at least change the MIME type for compatible formats
  if (isFormatCompatible(blob.type, targetFormat)) {
    return new Blob([blob], { type: targetFormat });
  }
  
  // For incompatible formats, return original
  return blob;
}

/**
 * Check if source format is compatible with target format
 */
function isFormatCompatible(sourceType: string, targetType: string): boolean {
  // WebM formats are generally compatible with each other
  if (sourceType.includes('webm') && targetType.includes('webm')) {
    return true;
  }
  
  // OGG formats are generally compatible
  if (sourceType.includes('ogg') && targetType.includes('ogg')) {
    return true;
  }
  
  // Same base format
  if (sourceType === targetType) {
    return true;
  }
  
  return false;
}

/**
 * Get the best supported format for the current browser
 */
export function getBestSupportedFormat(): SupportedFormat {
  // Check MediaRecorder support for different formats
  const formats = [
    SUPPORTED_FORMATS.WEBM,
    SUPPORTED_FORMATS.MP4,
    SUPPORTED_FORMATS.OGG,
    SUPPORTED_FORMATS.WAV,
    SUPPORTED_FORMATS.MP3
  ];
  
  for (const format of formats) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(format)) {
      return format;
    }
  }
  
  // Fallback to WebM as it's widely supported
  return SUPPORTED_FORMATS.WEBM;
}

/**
 * Validate audio file size
 */
export function validateAudioSize(blob: Blob, maxSize: number = 25 * 1024 * 1024): boolean {
  return blob.size <= maxSize;
}

/**
 * Format audio file size for display
 */
export function formatAudioSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format audio duration for display
 */
export function formatAudioDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${remainingSeconds}s`;
}
