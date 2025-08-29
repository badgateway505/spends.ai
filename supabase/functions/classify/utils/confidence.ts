// Confidence scoring utilities for classification results

export interface ConfidenceFactors {
  hasAmount: boolean
  hasCurrency: boolean
  hasMerchant: boolean
  hasGroup: boolean
  hasTag: boolean
  textLength: number
  ambiguity: number // 0-1, higher = more ambiguous
}

export function calculateConfidence(factors: ConfidenceFactors): number {
  let score = 0.5 // Base confidence

  // Amount presence and clarity
  if (factors.hasAmount) {
    score += 0.3
  } else {
    score -= 0.4 // No amount is a major issue
  }

  // Currency presence
  if (factors.hasCurrency) {
    score += 0.1
  }

  // Merchant information
  if (factors.hasMerchant) {
    score += 0.1
  }

  // Categorization
  if (factors.hasGroup) {
    score += 0.1
  }
  
  if (factors.hasTag) {
    score += 0.05
  }

  // Text quality factors
  const optimalLength = 50 // Characters
  const lengthFactor = Math.min(factors.textLength / optimalLength, 1)
  score += lengthFactor * 0.1

  // Ambiguity penalty
  score -= factors.ambiguity * 0.2

  // Clamp to valid range
  return Math.max(0.1, Math.min(1.0, score))
}

export function assessTextAmbiguity(text: string): number {
  const lowerText = text.toLowerCase()
  
  // Factors that increase ambiguity
  let ambiguity = 0

  // Very short text
  if (text.length < 10) {
    ambiguity += 0.3
  }

  // Vague terms
  const vague = ['thing', 'stuff', 'something', 'misc', 'various', 'some']
  if (vague.some(term => lowerText.includes(term))) {
    ambiguity += 0.2
  }

  // Multiple possible interpretations
  if (lowerText.includes(' and ') || lowerText.includes(' or ')) {
    ambiguity += 0.15
  }

  // No clear item description
  if (!/\b(bought|purchased|paid|got|ordered|coffee|food|gas|taxi|uber|grab)\b/.test(lowerText)) {
    ambiguity += 0.1
  }

  return Math.min(1.0, ambiguity)
}

export function validateConfidenceThreshold(confidence: number, threshold: number = 0.7): {
  isValid: boolean
  shouldReview: boolean
  message?: string
} {
  if (confidence < 0.3) {
    return {
      isValid: false,
      shouldReview: true,
      message: 'Classification confidence too low - manual review required'
    }
  }
  
  if (confidence < threshold) {
    return {
      isValid: true,
      shouldReview: true,
      message: 'Low confidence - consider manual review'
    }
  }
  
  return {
    isValid: true,
    shouldReview: false
  }
}
