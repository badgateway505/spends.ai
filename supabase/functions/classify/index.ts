import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { withAuth } from '../_shared/auth.ts'
import { withErrorHandling } from '../_shared/errors.ts'
import { parseAndValidate, commonSchemas } from '../_shared/validation.ts'
import { createSupabaseClient } from '../_shared/supabase.ts'
import { classifyExpense } from './providers/openrouter.ts'

interface ClassifyRequest {
  text: string
  user_timezone?: string
}

const classifyRequestSchema = {
  text: {
    validator: (value: any) => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('text must be a non-empty string')
      }
      return value.trim()
    },
    required: true,
  },
  user_timezone: {
    validator: (value: any) => typeof value === 'string' ? value : 'UTC',
    default: 'UTC',
  },
}

const handler = withErrorHandling(
  withAuth(async (request, authContext) => {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    // Parse and validate request
    const { text, user_timezone } = await parseAndValidate<ClassifyRequest>(
      request,
      classifyRequestSchema
    )

    // Get user's groups and tags for classification context
    const supabase = createSupabaseClient()
    
    const [groupsResult, tagsResult] = await Promise.all([
      supabase
        .from('groups')
        .select('id, name, description')
        .eq('user_id', authContext.user.id)
        .eq('archived', false),
      supabase
        .from('tags')
        .select('id, name, description')
        .eq('user_id', authContext.user.id)
    ])

    if (groupsResult.error) {
      console.error('Error fetching groups:', groupsResult.error)
      return errorResponse('Failed to fetch user groups', 500)
    }

    if (tagsResult.error) {
      console.error('Error fetching tags:', tagsResult.error)
      return errorResponse('Failed to fetch user tags', 500)
    }

    // Classify the expense
    try {
      const classification = await classifyExpense(text, {
        groups: groupsResult.data || [],
        tags: tagsResult.data || [],
        userTimezone: user_timezone,
      })

      // Log model run for tracking
      await supabase.from('model_runs').insert({
        user_id: authContext.user.id,
        provider: classification.provider,
        model: classification.model,
        input: { text, user_timezone },
        output: classification,
        cost: classification.cost || null,
      })

      return jsonResponse({
        success: true,
        data: classification,
      })
    } catch (error) {
      console.error('Classification error:', error)
      return errorResponse(
        `Classification failed: ${error.message}`,
        500
      )
    }
  })
)

serve(handler)
