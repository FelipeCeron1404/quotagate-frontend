export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE'

export interface ConsumerSummary {
  id: string
  displayName: string
  plan: SubscriptionPlan
}

export interface QuotaStatus {
  consumerId: string
  displayName: string
  plan: SubscriptionPlan
  unlimited: boolean
  tokensUsed: number
  tokensRemaining: number | null
  monthlyTokenLimit: number | null
  resetDate: string
  requestsUsedThisMinute: number
  requestsPerMinuteLimit: number | null
  rateLimitResetAt: string
  secondsUntilRateLimitReset: number
  expectedCompletionTokens: number
}

export interface DailyUsagePoint {
  date: string
  tokens: number
  requests: number
}

export interface GenerationResult {
  text: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  generatedAt: string
}

export interface ApiErrorBody {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  details: Record<string, unknown>
}
