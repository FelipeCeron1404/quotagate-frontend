import { useCallback, useEffect, useRef, useState } from 'react'
import { quotaApiClient } from '../api/apiClient'
import { ApiRequestError } from '../api/ApiRequestError'
import type { DailyUsagePoint, QuotaStatus } from '../api/types'

export interface QuotaDashboardState {
  status: QuotaStatus | null
  history: DailyUsagePoint[]
  windowResetAt: number | null
  loading: boolean
  errorMessage: string | null
  refresh: () => Promise<QuotaStatus | null>
  applyStatus: (status: QuotaStatus) => void
}

export function useQuotaDashboard(consumerId: string | null): QuotaDashboardState {
  const [status, setStatus] = useState<QuotaStatus | null>(null)
  const [history, setHistory] = useState<DailyUsagePoint[]>([])
  const [windowResetAt, setWindowResetAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const activeConsumer = useRef(consumerId)

  const applyStatus = useCallback((nextStatus: QuotaStatus) => {
    setStatus(nextStatus)
    setWindowResetAt(Date.now() + nextStatus.secondsUntilRateLimitReset * 1000)
  }, [])

  const refresh = useCallback(async (): Promise<QuotaStatus | null> => {
    if (!consumerId) {
      return null
    }
    try {
      const [nextStatus, nextHistory] = await Promise.all([
        quotaApiClient.getStatus(consumerId),
        quotaApiClient.getHistory(consumerId),
      ])
      if (activeConsumer.current !== consumerId) {
        return null
      }
      applyStatus(nextStatus)
      setHistory(nextHistory)
      setErrorMessage(null)
      return nextStatus
    } catch (error) {
      if (activeConsumer.current === consumerId) {
        setErrorMessage(error instanceof ApiRequestError ? error.message : 'Ocurrió un error inesperado')
      }
      return null
    }
  }, [consumerId, applyStatus])

  useEffect(() => {
    activeConsumer.current = consumerId
    setStatus(null)
    setHistory([])
    setWindowResetAt(null)
    if (!consumerId) {
      return
    }
    setLoading(true)
    refresh().finally(() => {
      if (activeConsumer.current === consumerId) {
        setLoading(false)
      }
    })
  }, [consumerId, refresh])

  return { status, history, windowResetAt, loading, errorMessage, refresh, applyStatus }
}
