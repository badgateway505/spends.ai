import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { withAuth } from '../_shared/auth.ts'
import { withErrorHandling } from '../_shared/errors.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import { processAudioWithWhisper } from './whisper/whisper-client.ts'

const handler = withErrorHandling(
  withAuth(async (request, authContext) => {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    // Parse multipart form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'auto'
    
    if (!audioFile) {
      return errorResponse('No audio file provided')
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
    if (!allowedTypes.includes(audioFile.type)) {
      return errorResponse(`Unsupported audio type: ${audioFile.type}`)
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return errorResponse('Audio file too large (max 25MB)')
    }

    try {
      // Process audio with Whisper
      const transcription = await processAudioWithWhisper(audioFile, language)
      
      // Log the STT usage for tracking
      const supabase = createSupabaseClient()
      await supabase.from('model_runs').insert({
        user_id: authContext.user.id,
        provider: transcription.provider,
        model: transcription.model,
        input: {
          audio_duration: transcription.duration,
          language: language,
          file_size: audioFile.size,
        },
        output: {
          text: transcription.text,
          language: transcription.detected_language,
          confidence: transcription.confidence,
        },
        cost: transcription.cost || null,
      })

      return jsonResponse({
        success: true,
        data: {
          text: transcription.text,
          language: transcription.detected_language,
          confidence: transcription.confidence,
          duration: transcription.duration,
        },
      })
    } catch (error) {
      console.error('STT processing error:', error)
      return errorResponse(
        `Speech-to-text failed: ${error.message}`,
        500
      )
    }
  })
)

serve(handler)
