// CORS utilities for Edge Functions

export interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
  ],
  credentials: true,
}

export function setCorsHeaders(options: CorsOptions = {}): Headers {
  const mergedOptions = { ...DEFAULT_CORS_OPTIONS, ...options }
  const headers = new Headers()

  // Handle origin
  if (mergedOptions.origin === true) {
    headers.set('Access-Control-Allow-Origin', '*')
  } else if (typeof mergedOptions.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', mergedOptions.origin)
  } else if (Array.isArray(mergedOptions.origin)) {
    // For multiple origins, you'd need to check the request origin
    // For now, we'll default to the first one or all
    headers.set('Access-Control-Allow-Origin', mergedOptions.origin[0] || '*')
  }

  // Set other CORS headers
  if (mergedOptions.methods) {
    headers.set('Access-Control-Allow-Methods', mergedOptions.methods.join(', '))
  }
  
  if (mergedOptions.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', mergedOptions.allowedHeaders.join(', '))
  }
  
  if (mergedOptions.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return headers
}

export function handleCors(request: Request, options?: CorsOptions): Response | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: setCorsHeaders(options),
    })
  }
  
  return null
}

export function createCorsResponse(
  body: BodyInit | null,
  init: ResponseInit = {},
  corsOptions?: CorsOptions
): Response {
  const corsHeaders = setCorsHeaders(corsOptions)
  
  // Merge CORS headers with any existing headers
  const headers = new Headers(init.headers)
  for (const [key, value] of corsHeaders.entries()) {
    headers.set(key, value)
  }
  
  return new Response(body, {
    ...init,
    headers,
  })
}

// Helper for JSON responses with CORS
export function jsonResponse(
  data: any,
  init: ResponseInit = {},
  corsOptions?: CorsOptions
): Response {
  return createCorsResponse(
    JSON.stringify(data),
    {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    },
    corsOptions
  )
}

// Helper for error responses with CORS
export function errorResponse(
  message: string,
  status: number = 400,
  corsOptions?: CorsOptions
): Response {
  return jsonResponse(
    { error: message },
    { status },
    corsOptions
  )
}
