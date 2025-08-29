import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { withErrorHandling } from '../../_shared/errors.ts'
import { createSupabaseClient } from '../../_shared/supabase.ts'
import { fetchExchangeRatesWithRetry } from '../../fx/providers/exchangerate-host.ts'

const handler = withErrorHandling(async (request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  // Verify this is a legitimate cron call
  const authHeader = request.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  
  if (!authHeader || !cronSecret || !authHeader.includes(cronSecret)) {
    return errorResponse('Unauthorized - invalid cron secret', 401)
  }

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const supabase = createSupabaseClient()

    console.log(`Running daily FX sync for ${today}`)

    // Check if we already have a rate for today
    const { data: existingRate } = await supabase
      .from('fx_rates')
      .select('rate_date, manual, fetched_at')
      .eq('rate_date', today)
      .single()

    // If we have a manual rate, don't override it
    if (existingRate && existingRate.manual) {
      console.log('Manual rate exists for today, skipping auto-fetch')
      return jsonResponse({
        success: true,
        message: 'Manual rate exists, skipped auto-fetch',
        data: {
          rate_date: today,
          skipped: true,
          reason: 'manual_rate_exists',
        },
      })
    }

    // If we already fetched today (and it's not manual), check if we should refresh
    if (existingRate && !existingRate.manual) {
      const fetchedAt = new Date(existingRate.fetched_at)
      const hoursAgo = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60)
      
      // Only fetch again if it's been more than 6 hours
      if (hoursAgo < 6) {
        console.log(`Rate already fetched ${hoursAgo.toFixed(1)} hours ago, skipping`)
        return jsonResponse({
          success: true,
          message: 'Rate recently fetched, skipped',
          data: {
            rate_date: today,
            skipped: true,
            reason: 'recently_fetched',
            hours_ago: hoursAgo,
          },
        })
      }
    }

    // Fetch current exchange rates
    console.log('Fetching exchange rates...')
    const rates = await fetchExchangeRatesWithRetry(3)

    console.log(`Fetched rates: 1 USD = ${rates.thb_per_usd} THB, 1 THB = ${rates.usd_per_thb} USD`)

    // Upsert the rate
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
      return errorResponse('Failed to save exchange rate', 500)
    }

    console.log('FX rates updated successfully')

    return jsonResponse({
      success: true,
      message: 'Daily FX rates updated successfully',
      data: {
        ...data,
        source: rates.source,
      },
    })
  } catch (error) {
    console.error('Daily FX sync error:', error)
    return errorResponse(`Daily FX sync failed: ${error.message}`, 500)
  }
})

serve(handler)
