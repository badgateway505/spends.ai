import { ClassificationProvider, ClassificationContext, ClassificationResult } from './provider.interface.ts'
import { EXPENSE_PARSE_PROMPT } from '../prompts/expense-parse.prompt.ts'

export class OpenRouterProvider implements ClassificationProvider {
  readonly name = 'openrouter'
  readonly models = ['anthropic/claude-3.5-sonnet']
  
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  
  constructor() {
    this.apiKey = Deno.env.get('OPENROUTER_API_KEY') || ''
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required')
    }
  }

  async classify(text: string, context: ClassificationContext): Promise<ClassificationResult> {
    const model = this.models[0] // Use primary model
    
    const prompt = EXPENSE_PARSE_PROMPT
      .replace('{{USER_INPUT}}', text)
      .replace('{{AVAILABLE_GROUPS}}', JSON.stringify(context.groups, null, 2))
      .replace('{{AVAILABLE_TAGS}}', JSON.stringify(context.tags, null, 2))
      .replace('{{USER_TIMEZONE}}', context.userTimezone)

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://spends.ai',
        'X-Title': 'Spends.ai Expense Classifier',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API')
    }

    const content = data.choices[0].message.content
    
    try {
      const parsed = JSON.parse(content)
      
      // Validate required fields
      if (!parsed.item || typeof parsed.amount !== 'number' || !parsed.currency) {
        throw new Error('Invalid classification result: missing required fields')
      }

      // Validate currency
      if (parsed.currency !== 'THB' && parsed.currency !== 'USD') {
        throw new Error('Invalid currency in classification result')
      }

      // Validate group_id if provided
      if (parsed.group_id && !context.groups.find(g => g.id === parsed.group_id)) {
        console.warn('Invalid group_id in classification, removing:', parsed.group_id)
        parsed.group_id = undefined
      }

      // Validate tag_id if provided
      if (parsed.tag_id && !context.tags.find(t => t.id === parsed.tag_id)) {
        console.warn('Invalid tag_id in classification, removing:', parsed.tag_id)
        parsed.tag_id = undefined
      }

      // Calculate cost if usage data is available
      let cost = 0
      if (data.usage) {
        // Rough cost estimation for Claude 3.5 Sonnet
        // Input: ~$3/1M tokens, Output: ~$15/1M tokens
        const inputCost = (data.usage.prompt_tokens || 0) * 0.000003
        const outputCost = (data.usage.completion_tokens || 0) * 0.000015
        cost = inputCost + outputCost
      }

      return {
        item: parsed.item,
        amount: Math.round(parsed.amount * 100), // Convert to cents/satang
        currency: parsed.currency,
        merchant: parsed.merchant || undefined,
        group_id: parsed.group_id || undefined,
        tag_id: parsed.tag_id || undefined,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
        reasoning: parsed.reasoning || undefined,
        provider: this.name,
        model,
        cost,
      }
    } catch (parseError) {
      throw new Error(`Failed to parse classification result: ${parseError.message}\nContent: ${content}`)
    }
  }
}

// Export function for easy usage
export async function classifyExpense(
  text: string,
  context: ClassificationContext
): Promise<ClassificationResult> {
  const provider = new OpenRouterProvider()
  return provider.classify(text, context)
}
