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
    <section className={`card ${blocked ? 'card--alert' : ''}`}>
      <header className="card__header">
        <h2 className="card__title">Solicitudes por minuto</h2>
        <span className="countdown" aria-live="polite">
          Reinicio en <strong>{displayFormatter.countdown(secondsUntilReset)}</strong>
        </span>
      </header>

      <div className="rate-figures">
        <span className="rate-figures__used">{used}</span>
        <span className="rate-figures__limit">/ {limit === null ? '∞' : limit} en este minuto</span>
      </div>

      {limit !== null && (
        <div className={`rate-slots ${dense ? 'rate-slots--dense' : ''}`} aria-hidden="true">
          {slots.map((isUsed, index) => (
            <span key={index} className={`rate-slots__slot ${isUsed ? 'rate-slots__slot--used' : ''}`} />
          ))}
        </div>
      )}

      {blocked && (
        <p className="rate-alert" role="status">
          Alcanzaste el límite de tu plan. Podrás enviar de nuevo en {displayFormatter.countdown(secondsUntilReset)}.
        </p>
      )}
    </section>
  )
}
