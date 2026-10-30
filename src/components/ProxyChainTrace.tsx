export type ChainOutcome = 'idle' | 'passed' | 'rate-limited' | 'quota-exhausted' | 'failed'

interface ProxyChainTraceProps {
  outcome: ChainOutcome
}

interface ChainStage {
  key: string
  title: string
  detail: string
}

const STAGES: ChainStage[] = [
  { key: 'client', title: 'Cliente', detail: 'POST /api/ai/generate' },
  { key: 'rate', title: 'RateLimitProxyService', detail: '429 Too Many Requests' },
  { key: 'quota', title: 'QuotaProxyService', detail: '402 Payment Required' },
  { key: 'real', title: 'MockAIGenerationService', detail: 'Texto generado' },
]

function stageState(stageKey: string, outcome: ChainOutcome): 'neutral' | 'passed' | 'blocked' {
  if (outcome === 'idle' || outcome === 'failed') {
    return 'neutral'
  }
  if (outcome === 'passed') {
    return 'passed'
  }
  if (outcome === 'rate-limited') {
    return stageKey === 'client' ? 'passed' : stageKey === 'rate' ? 'blocked' : 'neutral'
  }
  return stageKey === 'client' || stageKey === 'rate' ? 'passed' : stageKey === 'quota' ? 'blocked' : 'neutral'
}

const OUTCOME_LABELS: Record<ChainOutcome, string> = {
  idle: 'Envía un prompt para ver el recorrido por la cadena de proxies',
  passed: 'La solicitud atravesó ambos proxies y llegó al servicio real',
  'rate-limited': 'El proxy de rate limiting detuvo la solicitud',
  'quota-exhausted': 'El proxy de cuota detuvo la solicitud',
  failed: 'La solicitud no pudo completarse',
}

export function ProxyChainTrace({ outcome }: ProxyChainTraceProps) {
  return (
    <section className="card chain">
      <header className="card__header">
        <h2 className="card__title">Cadena de proxies</h2>
        <span className="card__caption">{OUTCOME_LABELS[outcome]}</span>
      </header>
      <ol className="chain__stages">
        {STAGES.map((stage) => {
          const state = stageState(stage.key, outcome)
          return (
            <li key={stage.key} className={`chain__stage chain__stage--${state}`}>
              <span className="chain__title">{stage.title}</span>
              <span className="chain__detail">{stage.detail}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
