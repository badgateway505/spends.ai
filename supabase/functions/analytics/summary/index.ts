import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { withAuth } from '../../_shared/auth.ts'
import { withErrorHandling } from '../../_shared/errors.ts'
import { validateSearchParams, commonSchemas } from '../../_shared/validation.ts'
import { getUserSupabaseClient } from '../../_shared/auth.ts'

const handler = withErrorHandling(
  withAuth(async (request, authContext) => {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    if (request.method !== 'GET') {
      return errorResponse('Method not allowed', 405)
    }

    const url = new URL(request.url)
    
    try {
      // Validate query parameters
      const params = validateSearchParams(url, {
        ...commonSchemas.dateRange,
        currency: {
          validator: (value: any) => {
            if (!value) return null
            const currency = value.toUpperCase()
            if (currency !== 'THB' && currency !== 'USD') {
              throw new Error('Currency must be THB or USD')
            }
            return currency
          },
          required: false,
        },
      })

      const { start_date, end_date, include_archived, currency } = params

      // Get user's Supabase client with their auth context
      const supabase = getUserSupabaseClient(authContext)

      // Call the database function for spending summary
      const { data, error } = await supabase.rpc('get_spending_summary', {
        start_date,
        end_date,
        include_archived: include_archived || false,
      })

      if (error) {
        console.error('Error getting spending summary:', error)
        return errorResponse('Failed to get spending summary', 500)
      }

      if (!data || data.length === 0) {
        return jsonResponse({
          success: true,
          data: {
            total_transactions: 0,
            total_thb: 0,
            total_usd: 0,
            avg_thb: 0,
            avg_usd: 0,
            currency_breakdown: [],
            top_groups: [],
            daily_totals: [],
          },
        })
      }

      const summary = data[0]

      // If user requested specific currency, format accordingly
      let responseData = summary
      
      if (currency) {
        const totalKey = currency === 'THB' ? 'total_thb' : 'total_usd'
        const avgKey = currency === 'THB' ? 'avg_thb' : 'avg_usd'
        
        responseData = {
          ...summary,
          total_primary: summary[totalKey],
          avg_primary: summary[avgKey],
          primary_currency: currency,
        }
      }

      return jsonResponse({
        success: true,
        data: responseData,
      })
    } catch (error) {
      console.error('Analytics summary error:', error)
      return errorResponse(error.message, 400)
    }
  })
)

serve(handler)
