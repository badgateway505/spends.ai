import { useState, useEffect } from 'react';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { formatAudioDuration, formatAudioSize } from '../utils/audioConversion';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptComplete: (transcript: string) => void;
  language?: 'en-US' | 'ru-RU';
}

export function VoiceOverlay({ 
  isOpen, 
  onClose, 
  onTranscriptComplete,
  language = 'en-US' 
}: VoiceOverlayProps) {
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  const {
    currentMethod,
    isVoiceSupported,
    isCapturing,
    transcript,
    finalTranscript,
    confidence,
    error,
    uploadProgress,
    isProcessing,
    startCapture,
    stopCapture,
    resetCapture,
    switchToMethod,
    fallbackToNextMethod,
    getMethodDisplayName,
    getMethodDescription,
    getAvailableMethods,
    getBrowserCompatibility
  } = useVoiceCapture({
    language,
    autoStopTimeout: 3000,
    enableFallbacks: true,
    onTranscriptComplete: (transcriptText, method) => {
      console.log('Transcript completed via:', method, transcriptText);
      onTranscriptComplete(transcriptText);
      handleClose();
    },
    onMethodChange: (newMethod, reason) => {
      console.log('Voice method changed to:', newMethod, 'Reason:', reason);
    },
    onError: (errorMsg, method) => {
      console.error('Voice capture error:', errorMsg, 'Method:', method);
    },
    onStart: (method) => {
      console.log('Voice capture started with method:', method);
    },
    onStop: (method) => {
      console.log('Voice capture stopped with method:', method);
    }
  });

  // Start capture when overlay opens
  useEffect(() => {
    if (isOpen && currentMethod !== 'manual' && currentMethod !== 'none') {
      resetCapture();
      startCapture();
    }
  }, [isOpen, currentMethod, startCapture, resetCapture]);

  // Handle close
  const handleClose = () => {
    if (isCapturing) {
      stopCapture();
    }
    resetCapture();
    setShowMethodSelector(false);
    onClose();
  };

  // Handle stop recording
  const handleStopRecording = () => {
    stopCapture();
  };

  // Handle method switch
  const handleMethodSwitch = async (method: typeof currentMethod) => {
    await switchToMethod(method);
    setShowMethodSelector(false);
    if (method !== 'manual' && method !== 'none') {
      setTimeout(() => {
        startCapture();
      }, 500);
    }
  };

  // Handle fallback
  const handleTryFallback = async () => {
    const success = await fallbackToNextMethod();
    if (success && currentMethod !== 'manual' && currentMethod !== 'none') {
      setTimeout(() => {
        startCapture();
      }, 500);
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Show no voice support state
  if (!isVoiceSupported || currentMethod === 'none') {
    const browserInfo = getBrowserCompatibility();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Voice Input Not Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your browser ({browserInfo.browser}) doesn't support voice recognition or audio recording. 
            {browserInfo.recommendedBrowsers.length > 0 && (
              <> Try using {browserInfo.recommendedBrowsers.join(', ')} for the best experience.</>
            )}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Browser Support:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Web Speech: {browserInfo.webSpeechSupport}</li>
              <li>• Audio Recording: {browserInfo.audioRecordingSupport}</li>
            </ul>
          </div>
          <button
            onClick={handleClose}
            className="btn-primary w-full"
          >
            Continue with Manual Entry
          </button>
        </div>
      </div>
    );
  }

  // Show manual entry mode
  if (currentMethod === 'manual') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Manual Entry Mode
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Voice input is not available. Please continue with manual text entry.
          </p>
          <div className="flex gap-3">
            {getAvailableMethods().filter(m => m !== 'manual').length > 0 && (
              <button
                onClick={() => setShowMethodSelector(true)}
                className="btn-secondary flex-1"
              >
                Try Voice Input
              </button>
            )}
            <button
              onClick={handleClose}
              className="btn-primary flex-1"
            >
              Continue Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const availableMethods = getAvailableMethods().filter(m => m !== currentMethod && m !== 'manual');
    const canTryFallback = availableMethods.length > 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {getMethodDisplayName()} Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="flex gap-3">
            {canTryFallback && (
              <button
                onClick={handleTryFallback}
                className="btn-secondary flex-1"
              >
                Try {getMethodDisplayName(availableMethods[0])}
              </button>
            )}
            <button
              onClick={() => {
                resetCapture();
                startCapture();
              }}
              className="btn-secondary flex-1"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="btn-primary flex-1"
            >
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Method selector modal
  if (showMethodSelector) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Voice Input Method
          </h3>
          <div className="space-y-3">
            {getAvailableMethods().map(method => (
              <button
                key={method}
                onClick={() => handleMethodSwitch(method)}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  method === currentMethod
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {getMethodDisplayName(method)}
                  {method === currentMethod && (
                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">(Current)</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getMethodDescription(method)}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMethodSelector(false)}
            className="mt-4 w-full btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Get display transcript
  const getDisplayTranscript = () => {
    if (transcript || finalTranscript) {
      return `${finalTranscript}${transcript ? ' ' + transcript : ''}`.trim();
    }
    
    switch (currentMethod) {
      case 'web-speech':
        if (isCapturing) {
          return 'Listening... Say something like "Coffee 150 baht at Starbucks"';
        }
        return 'Say something like "Coffee 150 baht at Starbucks"';
      case 'audio-upload':
        if (isCapturing) {
          return 'Recording audio... Speak clearly and tap to stop when finished';
        } else if (isProcessing) {
          return 'Processing audio and transcribing with AI...';
        }
        return 'Tap to start recording your expense';
      default:
        return 'Say something like "Coffee 150 baht at Starbucks"';
    }
  };

  // Helper function for recording label
  const getCurrentRecordingLabel = () => {
    if (!isCapturing && !isProcessing) {
      return 'Ready';
    }
    
    switch (currentMethod) {
      case 'web-speech':
        return isCapturing ? 'Listening...' : 'Processing...';
      case 'audio-upload':
        if (isCapturing) return 'Recording...';
        if (isProcessing) return uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Processing...';
        return 'Ready';
      default:
        return 'Ready';
    }
  };

  const displayTranscript = getDisplayTranscript();
  const hasContent = (finalTranscript + transcript).trim().length > 0;
  
  // Recording state
  const isActivelyRecording = isCapturing;
  const recordingLabel = getCurrentRecordingLabel();

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 dark:bg-gray-900 dark:bg-opacity-95 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isActivelyRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {recordingLabel}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {getMethodDisplayName()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {getAvailableMethods().length > 1 && (
            <button
              onClick={() => setShowMethodSelector(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Switch input method"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Microphone button */}
        <div className="relative mb-8">
          <button
            onClick={handleStopRecording}
            disabled={!isActivelyRecording && !isProcessing}
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${
              isActivelyRecording 
                ? 'bg-red-500 border-red-600 hover:bg-red-600 shadow-lg scale-110' 
                : isProcessing
                ? 'bg-blue-500 border-blue-600 cursor-not-allowed animate-pulse'
                : 'bg-gray-300 border-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0Z"/>
              <path d="M12 18.5a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1H8a1 1 0 0 1 0-2h8Z"/>
            </svg>
          </button>
          
          {/* Pulsing ring animation */}
          {isActivelyRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-4">
          {isActivelyRecording 
            ? 'Tap to stop recording' 
            : isProcessing 
            ? 'Processing and transcribing...' 
            : 'Starting...'
          }
        </p>

        {/* Transcript display */}
        <div className="w-full max-w-2xl">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 min-h-[120px] border-2 border-gray-200 dark:border-gray-700">
            <p className={`text-lg leading-relaxed ${
              hasContent 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 italic'
            }`}>
              {displayTranscript}
            </p>
            
            {/* Typing indicator for interim results or processing */}
            {((currentMethod === 'web-speech' && isCapturing && transcript) || (currentMethod === 'audio-upload' && isProcessing)) && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {currentMethod === 'web-speech' 
                    ? 'Processing...' 
                    : 'Uploading and transcribing...'
                  }
                </span>
              </div>
            )}
          </div>
          
          {/* Confidence indicator - only show for Web Speech API */}
          {currentMethod === 'web-speech' && confidence > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Confidence:</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {/* Upload progress indicator - only show for audio upload */}
          {currentMethod === 'audio-upload' && isProcessing && uploadProgress > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Upload Progress:</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploadProgress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {getMethodDescription()}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Using {getMethodDisplayName()}
          {currentMethod === 'audio-upload' && (
            <> • Max {formatAudioDuration(120000)} • Max {formatAudioSize(25 * 1024 * 1024)}</>
          )}
        </p>
      </div>
    </div>
  );
}
