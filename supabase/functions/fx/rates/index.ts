import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { withAuth, withOptionalAuth } from '../../_shared/auth.ts'
import { withErrorHandling } from '../../_shared/errors.ts'
import { createSupabaseClient } from '../../_shared/supabase.ts'

const handler = withErrorHandling(async (request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  const url = new URL(request.url)
  const method = request.method

  if (method === 'GET') {
    // Get FX rates - no auth required for reading rates
    return await getRates(url)
  } else if (method === 'POST' || method === 'PUT') {
    // Set/update FX rates - requires auth
    return await withAuth(setRates)(request)
  }

  return errorResponse('Method not allowed', 405)
})

async function getRates(url: URL): Promise<Response> {
  const supabase = createSupabaseClient()
  
  // Get query parameters
  const dateParam = url.searchParams.get('date')
  const limitParam = url.searchParams.get('limit')
  
  let query = supabase
    .from('fx_rates')
    .select('*')
    .order('rate_date', { ascending: false })

  // Filter by date if provided
  if (dateParam) {
    try {
      const date = new Date(dateParam)
      if (isNaN(date.getTime())) {
        return errorResponse('Invalid date format')
      }
      query = query.eq('rate_date', dateParam)
    } catch (error) {
      return errorResponse('Invalid date format')
    }
  }

  // Limit results if provided
  if (limitParam) {
    const limit = parseInt(limitParam)
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('Limit must be between 1 and 100')
    }
    query = query.limit(limit)
  } else {
    query = query.limit(30) // Default limit
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching FX rates:', error)
    return errorResponse('Failed to fetch FX rates', 500)
  }

  return jsonResponse({
    success: true,
    data: data || [],
  })
}

async function setRates(request: Request, authContext: any): Promise<Response> {
  // Only allow service role to set rates
  if (authContext.user.role !== 'service_role') {
    return errorResponse('Insufficient permissions', 403)
  }

  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return errorResponse('Invalid JSON body')
  }

  const { rate_date, usd_per_thb, thb_per_usd, manual = false } = body

  // Validate required fields
  if (!rate_date || !usd_per_thb || !thb_per_usd) {
    return errorResponse('Missing required fields: rate_date, usd_per_thb, thb_per_usd')
  }

  // Validate date format
  const date = new Date(rate_date)
  if (isNaN(date.getTime())) {
    return errorResponse('Invalid date format for rate_date')
  }

  // Validate rates
  const usdRate = parseFloat(usd_per_thb)
  const thbRate = parseFloat(thb_per_usd)
  
  if (isNaN(usdRate) || isNaN(thbRate) || usdRate <= 0 || thbRate <= 0) {
    return errorResponse('Rates must be positive numbers')
  }

  // Basic sanity check - rates should be roughly inverse
  const expectedThbRate = 1 / usdRate
  const rateDifference = Math.abs(thbRate - expectedThbRate) / expectedThbRate
  
  if (rateDifference > 0.1) { // Allow 10% variance for fees, etc.
    return errorResponse('Rates appear inconsistent - check calculations')
  }

  const supabase = createSupabaseClient()

  // Upsert the rate
  const { data, error } = await supabase
    .from('fx_rates')
    .upsert({
      rate_date,
      usd_per_thb: usdRate,
      thb_per_usd: thbRate,
      manual: Boolean(manual),
      fetched_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting FX rate:', error)
    return errorResponse('Failed to save FX rate', 500)
  }

  return jsonResponse({
    success: true,
    data,
  })
}

serve(handler)
