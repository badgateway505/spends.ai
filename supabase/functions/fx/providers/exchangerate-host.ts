// Exchange rate provider using exchangerate.host API

export interface ExchangeRates {
  usd_per_thb: number
  thb_per_usd: number
  source: string
  timestamp: string
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const baseUrl = 'https://api.exchangerate.host'
  
  try {
    // Fetch USD to THB rate
    const usdToThbResponse = await fetch(`${baseUrl}/convert?from=USD&to=THB&amount=1`)
    if (!usdToThbResponse.ok) {
      throw new Error(`HTTP ${usdToThbResponse.status}: ${usdToThbResponse.statusText}`)
    }
    
    const usdToThbData = await usdToThbResponse.json()
    
    if (!usdToThbData.success || !usdToThbData.result) {
      throw new Error('Invalid response format from exchange rate API')
    }
    
    const thbPerUsd = usdToThbData.result
    const usdPerThb = 1 / thbPerUsd
    
    // Validate the rates make sense
    if (thbPerUsd <= 0 || usdPerThb <= 0) {
      throw new Error('Invalid exchange rates received')
    }
    
    // Basic sanity check for THB/USD rates (should be around 30-40 range typically)
    if (thbPerUsd < 20 || thbPerUsd > 50) {
      console.warn(`Exchange rate seems unusual: 1 USD = ${thbPerUsd} THB`)
    }
    
    return {
      usd_per_thb: parseFloat(usdPerThb.toFixed(6)),
      thb_per_usd: parseFloat(thbPerUsd.toFixed(2)),
      source: 'exchangerate.host',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    throw new Error(`Failed to fetch exchange rates: ${error.message}`)
  }
}

// Fallback function with multiple attempts
export async function fetchExchangeRatesWithRetry(maxRetries = 3): Promise<ExchangeRates> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching exchange rates (attempt ${attempt}/${maxRetries})`)
      return await fetchExchangeRates()
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// Validate exchange rate data
export function validateExchangeRates(rates: ExchangeRates): boolean {
  if (!rates.usd_per_thb || !rates.thb_per_usd) {
    return false
  }
  
  if (rates.usd_per_thb <= 0 || rates.thb_per_usd <= 0) {
    return false
  }
  
  // Check if rates are roughly inverse
  const expectedUsdPerThb = 1 / rates.thb_per_usd
  const difference = Math.abs(rates.usd_per_thb - expectedUsdPerThb) / expectedUsdPerThb
  
  // Allow up to 1% difference for rounding/fees
  return difference < 0.01
}
