import type { QuotaStatus } from '../api/types'
import { displayFormatter } from '../domain/formatters'

interface RateLimitMeterProps {
  status: QuotaStatus
  secondsUntilReset: number
  blocked: boolean
}

export function RateLimitMeter({ status, secondsUntilReset, blocked }: RateLimitMeterProps) {
  const limit = status.requestsPerMinuteLimit
  const used = status.requestsUsedThisMinute
  const slots = limit === null ? [] : Array.from({ length: limit }, (_, index) => index < used)
  const dense = limit !== null && limit > 20

  return (
    <section className={`panel-section ${blocked ? 'panel-section--blocked' : ''}`} aria-labelledby="rate-heading">
      <div className="panel-section__heading">
        <h2 id="rate-heading">Solicitudes por minuto</h2>
        <span className="panel-section__aside" aria-live="polite">
          Reinicio en <strong className="clock">{displayFormatter.countdown(secondsUntilReset)}</strong>
        </span>
      </div>

      <p className="rate-count">
        <span className="rate-count__used">{used}</span>
        <span className="rate-count__limit">de {limit === null ? 'ilimitadas' : limit}</span>
      </p>

      {limit !== null && (
        <div className={`turnstile ${dense ? 'turnstile--dense' : ''}`} aria-hidden="true">
          {slots.map((isUsed, index) => (
            <span key={index} className={`turnstile__slot ${isUsed ? 'turnstile__slot--used' : ''}`} />
          ))}
        </div>
      )}

      {blocked && (
        <p className="signal-note signal-note--stop" role="status">
          Llegaste al límite de tu plan. El envío se habilita en {displayFormatter.countdown(secondsUntilReset)}.
        </p>
      )}
    </section>
  )
}
