import { useCallback, useEffect, useState } from 'react'
import { quotaApiClient } from './api/apiClient'
import { ApiRequestError } from './api/ApiRequestError'
import type { ConsumerSummary, QuotaStatus } from './api/types'
import { ChatPanel, type ChatMessage } from './components/ChatPanel'
import { ConsumerSelector } from './components/ConsumerSelector'
import { PlanBadge } from './components/PlanBadge'
import { ProxyChainTrace, type ChainOutcome } from './components/ProxyChainTrace'
import { QuotaMeter } from './components/QuotaMeter'
import { RateLimitMeter } from './components/RateLimitMeter'
import { UpgradeModal } from './components/UpgradeModal'
import { UsageHistoryChart } from './components/UsageHistoryChart'
import { useCountdown } from './hooks/useCountdown'
import { useQuotaDashboard } from './hooks/useQuotaDashboard'

const SELECTED_CONSUMER_KEY = 'quotagate.selectedConsumer'
const STATUS_SYNC_INTERVAL_MS = 15000

function readStoredConsumer(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_CONSUMER_KEY)
  } catch {
    return null
  }
}

function storeConsumer(consumerId: string) {
  try {
    window.localStorage.setItem(SELECTED_CONSUMER_KEY, consumerId)
  } catch {
    return
  }
}

let messageSequence = 0

function nextMessageId(): string {
  messageSequence += 1
  return `message-${messageSequence}`
}

export default function App() {
  const [consumers, setConsumers] = useState<ConsumerSummary[]>([])
  const [consumersError, setConsumersError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [chainOutcome, setChainOutcome] = useState<ChainOutcome>('idle')
  const [resettingDemo, setResettingDemo] = useState(false)

  const dashboard = useQuotaDashboard(selectedId)
  const { status, history, windowResetAt, refresh, applyStatus } = dashboard
  const windowSecondsLeft = useCountdown(windowResetAt)
  const blockedSecondsLeft = useCountdown(blockedUntil)

  const loadConsumers = useCallback(async () => {
    try {
      const loaded = await quotaApiClient.listConsumers()
      setConsumers(loaded)
      setConsumersError(null)
      setSelectedId((current) => {
        if (current && loaded.some((consumer) => consumer.id === current)) {
          return current
        }
        const stored = readStoredConsumer()
        if (stored && loaded.some((consumer) => consumer.id === stored)) {
          return stored
        }
        return loaded[0]?.id ?? null
      })
    } catch (error) {
      setConsumersError(error instanceof ApiRequestError ? error.message : 'No se pudieron cargar los usuarios')
    }
  }, [])

  useEffect(() => {
    void loadConsumers()
  }, [loadConsumers])

  useEffect(() => {
    if (windowResetAt === null || windowSecondsLeft > 0) {
      return
    }
    const timeoutId = window.setTimeout(() => void refresh(), 600)
    return () => window.clearTimeout(timeoutId)
  }, [windowResetAt, windowSecondsLeft, refresh])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void refresh()
      }
    }, STATUS_SYNC_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [refresh])

  function selectConsumer(consumerId: string) {
    storeConsumer(consumerId)
    setSelectedId(consumerId)
    setMessages([])
    setBlockedUntil(null)
    setChainOutcome('idle')
    setUpgradeOpen(false)
  }

  function appendMessage(message: Omit<ChatMessage, 'id'>) {
    setMessages((previous) => [...previous, { ...message, id: nextMessageId() }])
  }

  const limit = status?.requestsPerMinuteLimit ?? null
  const windowExhausted = limit !== null && status !== null && status.requestsUsedThisMinute >= limit
  const rateLimited = blockedSecondsLeft > 0 || (windowExhausted && windowSecondsLeft > 0)
  const rateLimitSecondsLeft = blockedSecondsLeft > 0 ? blockedSecondsLeft : windowSecondsLeft
  const quotaExhausted = status !== null && !status.unlimited && (status.tokensRemaining ?? 0) <= 0

  async function sendPrompt(prompt: string): Promise<boolean> {
    if (!selectedId) {
      return false
    }
    appendMessage({ author: 'user', text: prompt })
    setSending(true)
    try {
      const result = await quotaApiClient.generate(selectedId, prompt)
      appendMessage({
        author: 'assistant',
        text: result.text,
        totalTokens: result.totalTokens,
        latencyMs: result.latencyMs,
      })
      setChainOutcome('passed')
      return true
    } catch (error) {
      handleGenerationError(error)
      return true
    } finally {
      setSending(false)
      const latestStatus = await refresh()
      if (latestStatus && !latestStatus.unlimited && (latestStatus.tokensRemaining ?? 0) <= 0) {
        setUpgradeOpen(true)
      }
    }
  }

  function handleGenerationError(error: unknown) {
    if (error instanceof ApiRequestError && error.isRateLimited()) {
      const retryAfter = error.retryAfterSeconds ?? 60
      setBlockedUntil(Date.now() + retryAfter * 1000)
      setChainOutcome('rate-limited')
      appendMessage({ author: 'notice', text: `Detenido por el límite por minuto (429). ${error.message}` })
      return
    }
    if (error instanceof ApiRequestError && error.isQuotaExhausted()) {
      setChainOutcome('quota-exhausted')
      appendMessage({ author: 'notice', text: `Detenido por la cuota mensual (402). ${error.message}` })
      setUpgradeOpen(true)
      return
    }
    setChainOutcome('failed')
    appendMessage({
      author: 'notice',
      text: error instanceof Error ? error.message : 'No fue posible generar la respuesta',
    })
  }

  function handleUpgraded(nextStatus: QuotaStatus) {
    applyStatus(nextStatus)
    setConsumers((previous) =>
      previous.map((consumer) => (consumer.id === nextStatus.consumerId ? { ...consumer, plan: nextStatus.plan } : consumer)),
    )
    appendMessage({ author: 'notice', text: `Plan actualizado a ${nextStatus.plan}. Ya puedes seguir enviando prompts.` })
    setChainOutcome('idle')
    void refresh()
  }

  async function resetDemo() {
    setResettingDemo(true)
    try {
      const restored = await quotaApiClient.resetDemo()
      setConsumers(restored)
      setMessages([])
      setBlockedUntil(null)
      setChainOutcome('idle')
      await refresh()
    } catch (error) {
      setConsumersError(error instanceof ApiRequestError ? error.message : 'No se pudo restablecer la demo')
    } finally {
      setResettingDemo(false)
    }
  }

  const errorMessage = consumersError ?? dashboard.errorMessage

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect x="4" y="8" width="5" height="26" rx="1.5" />
            <rect x="31" y="8" width="5" height="26" rx="1.5" />
            <rect className="brand__bar" x="9" y="17" width="22" height="4" rx="2" />
          </svg>
          <div>
            <h1 className="brand__name">QuotaGate</h1>
            <p className="brand__tagline">Tu acceso a la IA, medido por plan</p>
          </div>
        </div>
        <div className="topbar__controls">
          <ConsumerSelector
            consumers={consumers}
            selectedId={selectedId}
            disabled={sending}
            onSelect={selectConsumer}
          />
          {status && <PlanBadge plan={status.plan} size="large" />}
        </div>
      </header>

      {errorMessage && (
        <div className="banner" role="alert">
          <span>{errorMessage}</span>
          <button type="button" className="button button--ghost" onClick={() => void loadConsumers().then(refresh)}>
            Reintentar
          </button>
        </div>
      )}

      <main className="layout">
        <div className="layout__main">
          <ChatPanel
            key={selectedId ?? 'none'}
            messages={messages}
            sending={sending}
            rateLimitSecondsLeft={rateLimitSecondsLeft}
            rateLimited={rateLimited}
            quotaExhausted={quotaExhausted}
            tokensRemaining={status?.unlimited ? null : (status?.tokensRemaining ?? null)}
            expectedCompletionTokens={status?.expectedCompletionTokens ?? 0}
            onSend={sendPrompt}
            onUpgradeClick={() => setUpgradeOpen(true)}
          />
          <ProxyChainTrace outcome={chainOutcome} />
        </div>

        <aside className="instrument-panel" aria-label="Estado de tu plan">
          {status ? (
            <>
              <QuotaMeter status={status} onUpgradeClick={() => setUpgradeOpen(true)} />
              <RateLimitMeter status={status} secondsUntilReset={rateLimitSecondsLeft} blocked={rateLimited} />
              <UsageHistoryChart history={history} />
            </>
          ) : (
            <div className="instrument-panel__loading">
              <p className="muted">
                {dashboard.loading ? 'Leyendo el estado de tu plan…' : 'Elige un usuario para ver su consumo'}
              </p>
            </div>
          )}
        </aside>
      </main>

      <footer className="footer">
        <span>Taller de Patrones de Software, patrón Proxy</span>
        <button type="button" className="link-button" onClick={() => void resetDemo()} disabled={resettingDemo}>
          {resettingDemo ? 'Restableciendo…' : 'Restablecer datos de demostración'}
        </button>
      </footer>

      {upgradeOpen && status && selectedId && (
        <UpgradeModal
          consumerId={selectedId}
          currentPlan={status.plan}
          quotaExhausted={quotaExhausted}
          onClose={() => setUpgradeOpen(false)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  )
}
