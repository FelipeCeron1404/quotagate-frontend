import { Fragment } from 'react'

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
  { key: 'client', title: 'Tu pregunta', detail: 'POST /api/ai/generate' },
  { key: 'rate', title: 'RateLimitProxyService', detail: 'Responde 429 si superas el límite por minuto' },
  { key: 'quota', title: 'QuotaProxyService', detail: 'Responde 402 si se agotó la cuota mensual' },
  { key: 'real', title: 'MockAIGenerationService', detail: 'Genera el texto' },
]

type StageState = 'neutral' | 'passed' | 'blocked'

function withCamelCaseBreaks(identifier: string) {
  const parts = identifier.split(/(?=[A-Z][a-z])/)
  return parts.map((part, index) => (
    <Fragment key={part + index}>
      {index > 0 && <wbr />}
      {part}
    </Fragment>
  ))
}

function stageState(stageKey: string, outcome: ChainOutcome): StageState {
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
  idle: 'Envía una pregunta para ver por dónde pasa.',
  passed: 'Cruzó los dos controles y llegó al modelo.',
  'rate-limited': 'Se detuvo en el control de solicitudes por minuto.',
  'quota-exhausted': 'Se detuvo en el control de cuota mensual.',
  failed: 'No llegó al servidor.',
}

export function ProxyChainTrace({ outcome }: ProxyChainTraceProps) {
  return (
    <section className="gate-track" aria-labelledby="track-heading">
      <div className="gate-track__heading">
        <h2 id="track-heading">Recorrido de la última solicitud</h2>
        <p className="gate-track__summary" aria-live="polite">
          {OUTCOME_LABELS[outcome]}
        </p>
      </div>
      <ol className="gate-track__stages">
        {STAGES.map((stage) => (
          <li key={stage.key} className={`gate-stop gate-stop--${stageState(stage.key, outcome)}`}>
            <span className="gate-stop__lamp" aria-hidden="true" />
            <span className="gate-stop__title">{withCamelCaseBreaks(stage.title)}</span>
            <span className="gate-stop__detail">{stage.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
