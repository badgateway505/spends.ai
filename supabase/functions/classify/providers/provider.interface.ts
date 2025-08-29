// Interface for AI classification providers

export interface Group {
  id: string
  name: string
  description?: string
}

export interface Tag {
  id: string
  name: string
  description?: string
}

export interface ClassificationContext {
  groups: Group[]
  tags: Tag[]
  userTimezone: string
}

export interface ClassificationResult {
  item: string
  amount: number
  currency: 'THB' | 'USD'
  merchant?: string
  group_id?: string
  tag_id?: string
  confidence: number
  reasoning?: string
  provider: string
  model: string
  cost?: number
}

export interface ClassificationProvider {
  classify(text: string, context: ClassificationContext): Promise<ClassificationResult>
  readonly name: string
  readonly models: string[]
}
