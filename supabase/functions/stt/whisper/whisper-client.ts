// Whisper API client for speech-to-text processing

export interface WhisperTranscription {
  text: string
  detected_language: string
  confidence: number
  duration: number
  provider: string
  model: string
  cost?: number
}

export async function processAudioWithWhisper(
  audioFile: File,
  language: string = 'auto'
): Promise<WhisperTranscription> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Prepare form data for Whisper API
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')
  
  if (language !== 'auto') {
    formData.append('language', language)
  }
  
  // Request response format with timestamps and confidence
  formData.append('response_format', 'verbose_json')

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Whisper API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.text) {
      throw new Error('No transcription returned from Whisper API')
    }

    // Calculate approximate cost based on audio duration
    // Whisper pricing: $0.006 per minute
    const durationMinutes = data.duration / 60
    const cost = durationMinutes * 0.006

    // Estimate confidence based on Whisper's internal scoring
    // This is approximate since Whisper doesn't always return confidence scores
    let confidence = 0.8 // Default confidence
    
    if (data.segments && data.segments.length > 0) {
      // Calculate average confidence from segments if available
      const confidenceScores = data.segments
        .map((segment: any) => segment.avg_logprob || 0)
        .filter((score: number) => score !== 0)
      
      if (confidenceScores.length > 0) {
        const avgLogProb = confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length
        // Convert log probability to confidence (rough approximation)
        confidence = Math.max(0.1, Math.min(1.0, Math.exp(avgLogProb)))
      }
    }

    // Clean up the transcription text
    const cleanText = data.text.trim()
    
    if (cleanText.length === 0) {
      throw new Error('Empty transcription result')
    }

    return {
      text: cleanText,
      detected_language: data.language || language,
      confidence,
      duration: data.duration || 0,
      provider: 'openai',
      model: 'whisper-1',
      cost,
    }
  } catch (error) {
    console.error('Whisper processing error:', error)
    throw new Error(`Whisper transcription failed: ${error.message}`)
  }
}

// Validate audio format for Whisper compatibility
export function validateAudioForWhisper(file: File): { valid: boolean; error?: string } {
  const supportedFormats = [
    'audio/flac',
    'audio/mp3', 
    'audio/mpeg',
    'audio/mp4',
    'audio/mpeg',
    'audio/mpga',
    'audio/m4a',
    'audio/ogg',
    'audio/wav',
    'audio/webm'
  ]

  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported audio format: ${file.type}. Supported formats: ${supportedFormats.join(', ')}`
    }
  }

  // Check file size (Whisper has a 25MB limit)
  const maxSize = 25 * 1024 * 1024 // 25MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 25MB`
    }
  }

  return { valid: true }
}

// Convert audio duration to cost estimate
export function estimateWhisperCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  return minutes * 0.006 // $0.006 per minute
}
