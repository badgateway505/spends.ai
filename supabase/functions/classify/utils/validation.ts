// Validation utilities for classification results

import { ClassificationResult } from '../providers/provider.interface.ts'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateClassificationResult(result: ClassificationResult): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required field validation
  if (!result.item || typeof result.item !== 'string') {
    errors.push('Item is required and must be a string')
  } else if (result.item.trim().length === 0) {
    errors.push('Item cannot be empty')
  } else if (result.item.length > 200) {
    warnings.push('Item description is very long')
  }

  if (typeof result.amount !== 'number') {
    errors.push('Amount must be a number')
  } else if (result.amount <= 0) {
    errors.push('Amount must be positive')
  } else if (result.amount > 1000000) { // 10,000 USD/THB in cents/satang
    warnings.push('Amount is unusually large')
  }

  if (!result.currency || (result.currency !== 'THB' && result.currency !== 'USD')) {
    errors.push('Currency must be either THB or USD')
  }

  if (typeof result.confidence !== 'number') {
    errors.push('Confidence must be a number')
  } else if (result.confidence < 0 || result.confidence > 1) {
    errors.push('Confidence must be between 0 and 1')
  } else if (result.confidence < 0.5) {
    warnings.push('Low confidence score')
  }

  // Optional field validation
  if (result.merchant !== undefined && result.merchant !== null) {
    if (typeof result.merchant !== 'string') {
      errors.push('Merchant must be a string if provided')
    } else if (result.merchant.length > 100) {
      warnings.push('Merchant name is very long')
    }
  }

  if (result.group_id !== undefined && result.group_id !== null) {
    if (typeof result.group_id !== 'string') {
      errors.push('Group ID must be a string if provided')
    } else if (!isValidUUID(result.group_id)) {
      errors.push('Group ID must be a valid UUID')
    }
  }

  if (result.tag_id !== undefined && result.tag_id !== null) {
    if (typeof result.tag_id !== 'string') {
      errors.push('Tag ID must be a string if provided')
    } else if (!isValidUUID(result.tag_id)) {
      errors.push('Tag ID must be a valid UUID')
    }
  }

  if (result.reasoning !== undefined && result.reasoning !== null) {
    if (typeof result.reasoning !== 'string') {
      errors.push('Reasoning must be a string if provided')
    } else if (result.reasoning.length > 500) {
      warnings.push('Reasoning text is very long')
    }
  }

  if (typeof result.provider !== 'string' || result.provider.length === 0) {
    errors.push('Provider must be a non-empty string')
  }

  if (typeof result.model !== 'string' || result.model.length === 0) {
    errors.push('Model must be a non-empty string')
  }

  if (result.cost !== undefined && result.cost !== null) {
    if (typeof result.cost !== 'number' || result.cost < 0) {
      errors.push('Cost must be a non-negative number if provided')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeClassificationResult(result: ClassificationResult): ClassificationResult {
  return {
    item: result.item?.trim() || '',
    amount: Math.abs(Math.round(result.amount || 0)),
    currency: result.currency === 'USD' ? 'USD' : 'THB',
    merchant: result.merchant?.trim() || undefined,
    group_id: result.group_id?.trim() || undefined,
    tag_id: result.tag_id?.trim() || undefined,
    confidence: Math.max(0, Math.min(1, result.confidence || 0)),
    reasoning: result.reasoning?.trim() || undefined,
    provider: result.provider?.trim() || 'unknown',
    model: result.model?.trim() || 'unknown',
    cost: result.cost && result.cost >= 0 ? result.cost : undefined,
  }
}

export function createValidationError(validation: ValidationResult): Error {
  const message = `Classification validation failed:\n${validation.errors.join('\n')}`
  if (validation.warnings.length > 0) {
    return new Error(`${message}\nWarnings:\n${validation.warnings.join('\n')}`)
  }
  return new Error(message)
}
