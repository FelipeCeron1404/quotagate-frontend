import type { QuotaStatus } from '../api/types'
import { displayFormatter } from '../domain/formatters'

interface QuotaMeterProps {
  status: QuotaStatus
  onUpgradeClick: () => void
}

export function QuotaMeter({ status, onUpgradeClick }: QuotaMeterProps) {
  const limit = status.monthlyTokenLimit
  const usedRatio = status.unlimited || !limit ? 0 : Math.min(1, status.tokensUsed / limit)
  const percentage = Math.round(usedRatio * 100)
  const tone = usedRatio >= 1 ? 'critical' : usedRatio >= 0.8 ? 'warning' : 'healthy'

  return (
    <section className="card">
      <header className="card__header">
        <h2 className="card__title">Cuota mensual</h2>
        <span className="card__caption">Se reinicia el {displayFormatter.isoDateLong(status.resetDate)}</span>
      </header>

      {status.unlimited ? (
        <div className="quota-unlimited">
          <strong className="quota-unlimited__value">∞</strong>
          <p>Tokens ilimitados. Este mes llevas {displayFormatter.number(status.tokensUsed)} tokens consumidos.</p>
        </div>
      ) : (
        <>
          <div className="quota-figures">
            <span className="quota-figures__used">{displayFormatter.number(status.tokensUsed)}</span>
            <span className="quota-figures__limit">/ {displayFormatter.number(limit ?? 0)} tokens</span>
          </div>
          <div
            className={`progress progress--${tone}`}
            role="progressbar"
            aria-label="Tokens usados del mes"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
          >
            <div className="progress__fill" style={{ width: `${percentage}%` }} />
          </div>
          <div className="quota-footer">
            <span>{percentage}% usado</span>
            <span className={tone === 'critical' ? 'text-critical' : ''}>
              {displayFormatter.number(status.tokensRemaining ?? 0)} disponibles
            </span>
          </div>
          {tone !== 'healthy' && (
            <button type="button" className="button button--ghost button--block" onClick={onUpgradeClick}>
              Mejorar plan
            </button>
          )}
        </>
      )}
    </section>
  )
}
