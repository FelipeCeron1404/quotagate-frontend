import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { displayFormatter } from '../domain/formatters'
import { tokenEstimator } from '../domain/TokenEstimator'

export type ChatAuthor = 'user' | 'assistant' | 'notice'

export interface ChatMessage {
  id: string
  author: ChatAuthor
  text: string
  totalTokens?: number
  latencyMs?: number
}

interface ChatPanelProps {
  messages: ChatMessage[]
  sending: boolean
  rateLimitSecondsLeft: number
  rateLimited: boolean
  quotaExhausted: boolean
  tokensRemaining: number | null
  expectedCompletionTokens: number
  onSend: (prompt: string) => Promise<boolean>
  onUpgradeClick: () => void
}

const MAX_PROMPT_LENGTH = 4000

export function ChatPanel({
  messages,
  sending,
  rateLimitSecondsLeft,
  rateLimited,
  quotaExhausted,
  tokensRemaining,
  expectedCompletionTokens,
  onSend,
  onUpgradeClick,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const estimate = tokenEstimator.estimateRequest(draft, expectedCompletionTokens)
  const exceedsRemaining = tokensRemaining !== null && estimate.totalTokens > tokensRemaining
  const canSend = draft.trim().length > 0 && !sending && !rateLimited && !quotaExhausted

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function submit() {
    if (!canSend) {
      return
    }
    const prompt = draft.trim()
    const accepted = await onSend(prompt)
    if (accepted) {
      setDraft('')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  function sendButtonLabel(): string {
    if (sending) {
      return 'Generando…'
    }
    if (quotaExhausted) {
      return 'Cuota agotada'
    }
    if (rateLimited) {
      return `Espera ${displayFormatter.countdown(rateLimitSecondsLeft)}`
    }
    return 'Enviar'
  }

  return (
    <section className="chat card">
      <header className="card__header">
        <h2 className="card__title">Asistente de IA</h2>
        <span className="card__caption">Servicio simulado · respuesta en ~1,2 s</span>
      </header>

      <div className="chat__messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="chat__empty">
            <p className="chat__empty-title">Escribe un prompt para empezar</p>
            <p className="muted">
              Cada solicitud pasa primero por el proxy de rate limiting, luego por el de cuota y por último llega al
              servicio de IA.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <article key={message.id} className={`bubble bubble--${message.author}`}>
            <p className="bubble__text">{message.text}</p>
            {message.totalTokens !== undefined && (
              <span className="bubble__meta">
                {displayFormatter.number(message.totalTokens)} tokens · {message.latencyMs} ms
              </span>
            )}
          </article>
        ))}
        {sending && (
          <article className="bubble bubble--assistant bubble--typing" aria-label="Generando respuesta">
            <span />
            <span />
            <span />
          </article>
        )}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          className="composer__input"
          value={draft}
          maxLength={MAX_PROMPT_LENGTH}
          rows={3}
          placeholder={quotaExhausted ? 'Tu cuota mensual se agotó. Mejora tu plan para seguir.' : 'Escribe tu prompt…'}
          disabled={quotaExhausted}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Prompt"
        />
        <div className="composer__footer">
          <p className={`estimator ${exceedsRemaining ? 'estimator--warning' : ''}`} aria-live="polite">
            {estimate.promptTokens === 0 ? (
              'El estimador de tokens aparecerá al escribir'
            ) : (
              <>
                ≈ <strong>{displayFormatter.number(estimate.totalTokens)} tokens</strong> ({estimate.promptTokens} del
                prompt + ~{estimate.completionTokens} de respuesta)
                {exceedsRemaining && ' · supera tus tokens disponibles'}
              </>
            )}
          </p>
          {quotaExhausted ? (
            <button type="button" className="button button--primary" onClick={onUpgradeClick}>
              Mejorar plan
            </button>
          ) : (
            <button type="submit" className="button button--primary" disabled={!canSend}>
              {sendButtonLabel()}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
