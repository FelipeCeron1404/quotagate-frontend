import type { SubscriptionPlan } from '../api/types'
import { planCatalog } from '../domain/PlanCatalog'

interface PlanBadgeProps {
  plan: SubscriptionPlan
  size?: 'small' | 'large'
}

export function PlanBadge({ plan, size = 'small' }: PlanBadgeProps) {
  return (
    <span className={`plan-badge plan-badge--${plan.toLowerCase()} plan-badge--${size}`}>
      <span className="plan-badge__dot" aria-hidden="true" />
      {planCatalog.offerFor(plan).label.toUpperCase()}
    </span>
  )
}
