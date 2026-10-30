import type { SubscriptionPlan } from '../api/types'

export interface PlanOffer {
  plan: SubscriptionPlan
  label: string
  monthlyPriceUsd: number
  requestsPerMinuteLabel: string
  monthlyTokensLabel: string
  highlight: string
}

const PLAN_ORDER: SubscriptionPlan[] = ['FREE', 'PRO', 'ENTERPRISE']

const PLAN_OFFERS: Record<SubscriptionPlan, PlanOffer> = {
  FREE: {
    plan: 'FREE',
    label: 'Free',
    monthlyPriceUsd: 0,
    requestsPerMinuteLabel: '10 solicitudes/min',
    monthlyTokensLabel: '50.000 tokens/mes',
    highlight: 'Para explorar la plataforma',
  },
  PRO: {
    plan: 'PRO',
    label: 'Pro',
    monthlyPriceUsd: 19,
    requestsPerMinuteLabel: '60 solicitudes/min',
    monthlyTokensLabel: '500.000 tokens/mes',
    highlight: 'Diez veces más capacidad',
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    label: 'Enterprise',
    monthlyPriceUsd: 99,
    requestsPerMinuteLabel: 'Solicitudes ilimitadas',
    monthlyTokensLabel: 'Tokens ilimitados',
    highlight: 'Sin límites para equipos',
  },
}

export class PlanCatalog {
  offerFor(plan: SubscriptionPlan): PlanOffer {
    return PLAN_OFFERS[plan]
  }

  upgradesFrom(plan: SubscriptionPlan): PlanOffer[] {
    const currentIndex = PLAN_ORDER.indexOf(plan)
    return PLAN_ORDER.slice(currentIndex + 1).map((candidate) => PLAN_OFFERS[candidate])
  }
}

export const planCatalog = new PlanCatalog()
