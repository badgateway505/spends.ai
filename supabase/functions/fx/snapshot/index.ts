import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { withErrorHandling } from '../../_shared/errors.ts'
import { createSupabaseClient } from '../../_shared/supabase.ts'
import { fetchExchangeRates } from '../providers/exchangerate-host.ts'

const handler = withErrorHandling(async (request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  // This function is typically called by a cron job
  // Verify the request has proper authorization
  const authHeader = request.headers.get('Authorization')
  const expectedToken = Deno.env.get('CRON_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!authHeader || !authHeader.includes(expectedToken)) {
    return errorResponse('Unauthorized', 401)
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  try {
    // Check if we already have a rate for today
    const supabase = createSupabaseClient()
    
    const { data: existingRate } = await supabase
      .from('fx_rates')
      .select('rate_date, manual')
      .eq('rate_date', today)
      .single()

    // If we have a manual rate for today, don't override it
    if (existingRate && existingRate.manual) {
      return jsonResponse({
        success: true,
        message: 'Manual rate exists for today, skipping auto-fetch',
        data: { rate_date: today, skipped: true },
      })
    }

    // Fetch current rates
    const rates = await fetchExchangeRates()
    
    // Upsert the rate for today
    const { data, error } = await supabase
      .from('fx_rates')
      .upsert({
        rate_date: today,
        usd_per_thb: rates.usd_per_thb,
        thb_per_usd: rates.thb_per_usd,
        manual: false,
        fetched_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving FX rate:', error)
      return errorResponse('Failed to save FX rate', 500)
    }

    return jsonResponse({
      success: true,
      message: 'FX rates updated successfully',
      data,
    })
  } catch (error) {
    console.error('Error in FX snapshot:', error)
    return errorResponse(`Failed to fetch FX rates: ${error.message}`, 500)
  }
})

serve(handler)
