import { createSupabaseClientWithAuth, getUserFromToken } from './supabase.ts'

export interface AuthContext {
  user: {
    id: string
    email?: string
    aud: string
    role?: string
  }
  token: string
}

// Extract auth token from request headers
export function extractAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  // Handle "Bearer TOKEN" format
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : authHeader
}

// Validate auth token and return user context
export async function validateAuth(request: Request): Promise<AuthContext> {
  const token = extractAuthToken(request)
  
  if (!token) {
    throw new Error('Missing authorization token')
  }
  
  try {
    const user = await getUserFromToken(token)
    
    return {
      user: {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
      },
      token,
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// Wrapper for authenticated edge functions
export function withAuth<T = any>(
  handler: (request: Request, context: AuthContext) => Promise<Response> | Response
) {
  return async (request: Request): Promise<Response> => {
    try {
      const authContext = await validateAuth(request)
      return await handler(request, authContext)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  }
}

// Optional auth wrapper (doesn't fail if no auth provided)
export function withOptionalAuth<T = any>(
  handler: (request: Request, context?: AuthContext) => Promise<Response> | Response
) {
  return async (request: Request): Promise<Response> => {
    try {
      const authContext = await validateAuth(request)
      return await handler(request, authContext)
    } catch (error) {
      // If auth fails, continue without auth context
      return await handler(request)
    }
  }
}

// Helper to check if user has required permissions
export function hasPermission(context: AuthContext, requiredRole: string): boolean {
  return context.user.role === requiredRole || context.user.role === 'service_role'
}

// Get user's Supabase client
export function getUserSupabaseClient(context: AuthContext) {
  return createSupabaseClientWithAuth(context.token)
}
