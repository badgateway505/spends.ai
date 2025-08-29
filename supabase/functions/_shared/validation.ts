// Request validation utilities for Edge Functions

import { createError } from './errors.ts'

// Basic type validators
export const validators = {
  string: (value: any, field: string): string => {
    if (typeof value !== 'string') {
      throw createError.invalidInput(`${field} must be a string`)
    }
    return value
  },

  number: (value: any, field: string): number => {
    const num = Number(value)
    if (isNaN(num)) {
      throw createError.invalidInput(`${field} must be a valid number`)
    }
    return num
  },

  integer: (value: any, field: string): number => {
    const num = validators.number(value, field)
    if (!Number.isInteger(num)) {
      throw createError.invalidInput(`${field} must be an integer`)
    }
    return num
  },

  boolean: (value: any, field: string): boolean => {
    if (typeof value === 'boolean') return value
    if (value === 'true') return true
    if (value === 'false') return false
    throw createError.invalidInput(`${field} must be a boolean`)
  },

  email: (value: any, field: string): string => {
    const str = validators.string(value, field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(str)) {
      throw createError.invalidInput(`${field} must be a valid email address`)
    }
    return str
  },

  uuid: (value: any, field: string): string => {
    const str = validators.string(value, field)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(str)) {
      throw createError.invalidInput(`${field} must be a valid UUID`)
    }
    return str
  },

  currency: (value: any, field: string): 'THB' | 'USD' => {
    const str = validators.string(value, field).toUpperCase()
    if (str !== 'THB' && str !== 'USD') {
      throw createError.invalidInput(`${field} must be either 'THB' or 'USD'`)
    }
    return str as 'THB' | 'USD'
  },

  positiveInteger: (value: any, field: string): number => {
    const num = validators.integer(value, field)
    if (num <= 0) {
      throw createError.invalidInput(`${field} must be a positive integer`)
    }
    return num
  },

  dateString: (value: any, field: string): string => {
    const str = validators.string(value, field)
    const date = new Date(str)
    if (isNaN(date.getTime())) {
      throw createError.invalidInput(`${field} must be a valid date string`)
    }
    return str
  },
}

// Schema validation interface
export interface ValidationSchema {
  [key: string]: {
    validator: (value: any, field: string) => any
    required?: boolean
    default?: any
  }
}

// Validate object against schema
export function validateSchema<T = any>(
  data: any,
  schema: ValidationSchema
): T {
  if (!data || typeof data !== 'object') {
    throw createError.invalidInput('Request body must be a valid object')
  }

  const result: any = {}

  // Validate each field in schema
  for (const [field, config] of Object.entries(schema)) {
    const value = data[field]

    // Check required fields
    if (config.required && (value === undefined || value === null)) {
      throw createError.invalidInput(`Field '${field}' is required`)
    }

    // Use default if value is undefined
    if (value === undefined && config.default !== undefined) {
      result[field] = config.default
      continue
    }

    // Skip validation if value is undefined and not required
    if (value === undefined) {
      continue
    }

    // Validate the value
    try {
      result[field] = config.validator(value, field)
    } catch (error) {
      // Re-throw with field context
      throw error
    }
  }

  return result as T
}

// Parse and validate JSON request body
export async function parseAndValidate<T = any>(
  request: Request,
  schema: ValidationSchema
): Promise<T> {
  let body: any

  try {
    body = await request.json()
  } catch (error) {
    throw createError.invalidInput('Invalid JSON in request body')
  }

  return validateSchema<T>(body, schema)
}

// Validate URL search params
export function validateSearchParams(
  url: URL,
  schema: ValidationSchema
): any {
  const data: any = {}
  
  // Convert URLSearchParams to plain object
  for (const [key, value] of url.searchParams) {
    data[key] = value
  }

  return validateSchema(data, schema)
}

// Common validation schemas
export const commonSchemas = {
  // Pagination parameters
  pagination: {
    limit: {
      validator: validators.positiveInteger,
      default: 20,
    },
    offset: {
      validator: (value: any) => Math.max(0, validators.integer(value, 'offset')),
      default: 0,
    },
  },

  // Date range parameters
  dateRange: {
    start_date: {
      validator: validators.dateString,
      required: true,
    },
    end_date: {
      validator: validators.dateString,
      required: true,
    },
    include_archived: {
      validator: validators.boolean,
      default: false,
    },
  },

  // Expense data
  expense: {
    item: {
      validator: validators.string,
      required: true,
    },
    amount: {
      validator: validators.positiveInteger,
      required: true,
    },
    currency: {
      validator: validators.currency,
      required: true,
    },
    merchant: {
      validator: validators.string,
      required: false,
    },
    group_id: {
      validator: validators.uuid,
      required: false,
    },
    tag_id: {
      validator: validators.uuid,
      required: false,
    },
  },

  // Group/Tag creation
  category: {
    name: {
      validator: validators.string,
      required: true,
    },
    description: {
      validator: validators.string,
      required: false,
    },
  },
}
