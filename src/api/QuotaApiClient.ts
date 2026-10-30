import { ApiRequestError } from './ApiRequestError'
import type {
  ApiErrorBody,
  ConsumerSummary,
  DailyUsagePoint,
  GenerationResult,
  QuotaStatus,
  SubscriptionPlan,
} from './types'

const CONSUMER_HEADER = 'X-User-Id'

export class QuotaApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  listConsumers(): Promise<ConsumerSummary[]> {
    return this.request<ConsumerSummary[]>('/api/consumers', { method: 'GET' })
  }

  getStatus(consumerId: string): Promise<QuotaStatus> {
    return this.request<QuotaStatus>('/api/quota/status', { method: 'GET' }, consumerId)
  }

  getHistory(consumerId: string): Promise<DailyUsagePoint[]> {
    return this.request<DailyUsagePoint[]>('/api/quota/history', { method: 'GET' }, consumerId)
  }

  generate(consumerId: string, prompt: string): Promise<GenerationResult> {
    return this.request<GenerationResult>(
      '/api/ai/generate',
      { method: 'POST', body: JSON.stringify({ prompt }) },
      consumerId,
    )
  }

  upgrade(consumerId: string, targetPlan: SubscriptionPlan, paymentReference: string): Promise<QuotaStatus> {
    return this.request<QuotaStatus>(
      '/api/quota/upgrade',
      { method: 'POST', body: JSON.stringify({ targetPlan, paymentReference }) },
      consumerId,
    )
  }

  resetDemo(): Promise<ConsumerSummary[]> {
    return this.request<ConsumerSummary[]>('/api/demo/reset', { method: 'POST' })
  }

  private async request<T>(path: string, init: RequestInit, consumerId?: string): Promise<T> {
    const headers = new Headers({ Accept: 'application/json' })
    if (init.body) {
      headers.set('Content-Type', 'application/json')
    }
    if (consumerId) {
      headers.set(CONSUMER_HEADER, consumerId)
    }
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers })
    } catch {
      throw new ApiRequestError(
        0,
        'No fue posible conectar con el servidor. Si es la primera solicitud del día, espera unos segundos mientras se activa.',
        null,
        null,
      )
    }
    if (!response.ok) {
      throw await this.toApiError(response)
    }
    return (await response.json()) as T
  }

  private async toApiError(response: Response): Promise<ApiRequestError> {
    const body = await this.readErrorBody(response)
    const retryAfterHeader = response.headers.get('Retry-After')
    const retryAfterFromBody = body?.details?.retryAfterSeconds
    const retryAfterSeconds = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10)
      : typeof retryAfterFromBody === 'number'
        ? retryAfterFromBody
        : null
    const message = body?.message ?? `El servidor respondió con el código ${response.status}`
    return new ApiRequestError(response.status, message, Number.isNaN(retryAfterSeconds) ? null : retryAfterSeconds, body)
  }

  private async readErrorBody(response: Response): Promise<ApiErrorBody | null> {
    try {
      return (await response.json()) as ApiErrorBody
    } catch {
      return null
    }
  }
}
