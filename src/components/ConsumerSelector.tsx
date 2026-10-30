import type { ConsumerSummary } from '../api/types'
import { planCatalog } from '../domain/PlanCatalog'

interface ConsumerSelectorProps {
  consumers: ConsumerSummary[]
  selectedId: string | null
  disabled: boolean
  onSelect: (consumerId: string) => void
}

export function ConsumerSelector({ consumers, selectedId, disabled, onSelect }: ConsumerSelectorProps) {
  return (
    <label className="consumer-selector">
      <span className="consumer-selector__label">Conectado como</span>
      <select
        className="consumer-selector__input"
        value={selectedId ?? ''}
        disabled={disabled || consumers.length === 0}
        onChange={(event) => onSelect(event.target.value)}
      >
        {consumers.length === 0 && <option value="">Cargando usuarios…</option>}
        {consumers.map((consumer) => (
          <option key={consumer.id} value={consumer.id}>
            {consumer.displayName} ({planCatalog.offerFor(consumer.plan).label})
          </option>
        ))}
      </select>
    </label>
  )
}
