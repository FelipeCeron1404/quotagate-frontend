import type { QuotaStatus } from '../api/types'
import { displayFormatter } from '../domain/formatters'

interface QuotaMeterProps {
  status: QuotaStatus
  onUpgradeClick: () => void
}

const GAUGE_TICKS = Array.from({ length: 11 }, (_, index) => index / 10)

function polarPoint(ratio: number, radius: number): { x: number; y: number } {
  const angle = Math.PI * (1 - ratio)
  return { x: 120 + radius * Math.cos(angle), y: 120 - radius * Math.sin(angle) }
}

export function QuotaMeter({ status, onUpgradeClick }: QuotaMeterProps) {
  const limit = status.monthlyTokenLimit
  const usedRatio = status.unlimited || !limit ? 0 : Math.min(1, status.tokensUsed / limit)
  const percentage = Math.round(usedRatio * 100)
  const tone = status.unlimited ? 'unlimited' : usedRatio >= 1 ? 'critical' : usedRatio >= 0.8 ? 'warning' : 'healthy'
  const needleAngle = -90 + 180 * (status.unlimited ? 1 : usedRatio)

  return (
    <section className="panel-section" aria-labelledby="quota-heading">
      <div className="panel-section__heading">
        <h2 id="quota-heading">Cuota mensual</h2>
        <span className="panel-section__aside">Reinicia el {displayFormatter.isoDateLong(status.resetDate)}</span>
      </div>

      <div className={`gauge gauge--${tone}`}>
        <svg
          viewBox="0 0 240 140"
          className="gauge__svg"
          role="progressbar"
          aria-label="Tokens usados del mes"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={status.unlimited ? undefined : percentage}
          aria-valuetext={status.unlimited ? 'Tokens ilimitados' : `${percentage}% usado`}
        >
          <path className="gauge__track" d="M 24 120 A 96 96 0 0 1 216 120" pathLength={100} />
          <path
            className="gauge__fill"
            d="M 24 120 A 96 96 0 0 1 216 120"
            pathLength={100}
            strokeDasharray={`${status.unlimited ? 100 : percentage} 100`}
          />
          {GAUGE_TICKS.map((tick) => {
            const outer = polarPoint(tick, 78)
            const inner = polarPoint(tick, tick % 0.5 === 0 ? 68 : 72)
            return (
              <line key={tick} className="gauge__tick" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
            )
          })}
          <g className="gauge__needle" style={{ transform: `rotate(${needleAngle}deg)` }}>
            <line x1="120" y1="120" x2="120" y2="44" />
          </g>
          <circle className="gauge__hub" cx="120" cy="120" r="7" />
        </svg>
        <div className="gauge__readout">
          {status.unlimited ? (
            <>
              <span className="gauge__value">∞</span>
              <span className="gauge__caption">Tokens ilimitados</span>
            </>
          ) : (
            <>
              <span className="gauge__value">{percentage}%</span>
              <span className="gauge__caption">del plan usado</span>
            </>
          )}
        </div>
      </div>

      <dl className="readings">
        <div>
          <dt>Usados</dt>
          <dd>{displayFormatter.number(status.tokensUsed)}</dd>
        </div>
        <div>
          <dt>Disponibles</dt>
          <dd className={tone === 'critical' ? 'readings__critical' : ''}>
            {status.unlimited ? 'Sin límite' : displayFormatter.number(status.tokensRemaining ?? 0)}
          </dd>
        </div>
        <div>
          <dt>Límite</dt>
          <dd>{status.unlimited ? 'Sin límite' : displayFormatter.number(limit ?? 0)}</dd>
        </div>
      </dl>

      {(tone === 'warning' || tone === 'critical') && (
        <button type="button" className="button button--signal button--block" onClick={onUpgradeClick}>
          Mejorar plan
        </button>
      )}
    </section>
  )
}
