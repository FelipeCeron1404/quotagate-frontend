import type { ApiErrorBody } from './types'

export class ApiRequestError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null
  readonly body: ApiErrorBody | null

  constructor(status: number, message: string, retryAfterSeconds: number | null, body: ApiErrorBody | null) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
    this.body = body
  }

  isRateLimited(): boolean {
    return this.status === 429
  }

  isQuotaExhausted(): boolean {
    return this.status === 402
  }

  isNetworkFailure(): boolean {
    return this.status === 0
  }
}
