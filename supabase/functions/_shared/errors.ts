// Standardized error handling for Edge Functions

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: string
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

// Predefined error creators
export const createError = {
  unauthorized: (message = 'Unauthorized access') =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),
    
  forbidden: (message = 'Access forbidden') =>
    new AppError(ErrorCode.FORBIDDEN, message, 403),
    
  invalidInput: (message = 'Invalid input provided', details?: any) =>
    new AppError(ErrorCode.INVALID_INPUT, message, 400, details),
    
  notFound: (resource = 'Resource', id?: string) =>
    new AppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      404
    ),
    
  duplicate: (resource = 'Resource') =>
    new AppError(
      ErrorCode.DUPLICATE_RESOURCE,
      `${resource} already exists`,
      409
    ),
    
  internal: (message = 'Internal server error', details?: any) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details),
    
  externalService: (service: string, message?: string) =>
    new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error (${service})${message ? `: ${message}` : ''}`,
      502
    ),
    
  rateLimit: (message = 'Rate limit exceeded') =>
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),
}

// Convert error to API response format
export function formatError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      timestamp: new Date().toISOString(),
    }
  }
  
  // Handle unknown errors
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unknown error occurred',
    details: error,
    timestamp: new Date().toISOString(),
  }
}

// Create error response
export function createErrorResponse(error: unknown): Response {
  const apiError = formatError(error)
  const statusCode = error instanceof AppError ? error.statusCode : 500
  
  return new Response(
    JSON.stringify(apiError),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

// Error handler wrapper for edge functions
export function withErrorHandling(
  handler: (request: Request) => Promise<Response> | Response
) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('Edge function error:', error)
      return createErrorResponse(error)
    }
  }
}

// Validation helper
export function validateRequired(obj: any, fields: string[]): void {
  const missing = fields.filter(field => {
    const value = obj[field]
    return value === undefined || value === null || value === ''
  })
  
  if (missing.length > 0) {
    throw createError.invalidInput(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    )
  }
}
