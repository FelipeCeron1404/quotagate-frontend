import { useEffect, useState, type FormEvent } from 'react'
import { quotaApiClient } from '../api/apiClient'
import { ApiRequestError } from '../api/ApiRequestError'
import type { QuotaStatus, SubscriptionPlan } from '../api/types'
import { paymentSimulator, type CardValidationErrors, type SimulatedCardDetails } from '../domain/PaymentSimulator'
import { planCatalog } from '../domain/PlanCatalog'
import { PlanBadge } from './PlanBadge'

type UpgradeStep = 'choose' | 'pay' | 'processing' | 'done'

interface UpgradeModalProps {
  consumerId: string
  currentPlan: SubscriptionPlan
  quotaExhausted: boolean
  onClose: () => void
  onUpgraded: (status: QuotaStatus) => void
}

const EMPTY_CARD: SimulatedCardDetails = { holderName: '', cardNumber: '', expiry: '', securityCode: '' }

export function UpgradeModal({ consumerId, currentPlan, quotaExhausted, onClose, onUpgraded }: UpgradeModalProps) {
  const offers = planCatalog.upgradesFrom(currentPlan)
  const [step, setStep] = useState<UpgradeStep>('choose')
  const [targetPlan, setTargetPlan] = useState<SubscriptionPlan | null>(offers[0]?.plan ?? null)
  const [card, setCard] = useState<SimulatedCardDetails>(EMPTY_CARD)
  const [errors, setErrors] = useState<CardValidationErrors>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<{ reference: string; lastFourDigits: string } | null>(null)

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && step !== 'processing') {
        onClose()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, step])

  const selectedOffer = targetPlan ? planCatalog.offerFor(targetPlan) : null

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!targetPlan) {
      return
    }
    const validationErrors = paymentSimulator.validate(card)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    setFailure(null)
    setStep('processing')
    try {
      const paymentReceipt = await paymentSimulator.process(card)
      const status = await quotaApiClient.upgrade(consumerId, targetPlan, paymentReceipt.reference)
      setCard(EMPTY_CARD)
      setReceipt({ reference: paymentReceipt.reference, lastFourDigits: paymentReceipt.lastFourDigits })
      setStep('done')
      onUpgraded(status)
    } catch (error) {
      setFailure(error instanceof ApiRequestError ? error.message : 'No se pudo completar el cambio de plan')
      setStep('pay')
    }
  }

  function updateCard(field: keyof SimulatedCardDetails, value: string) {
    const formatted =
      field === 'cardNumber'
        ? paymentSimulator.formatCardNumber(value)
        : field === 'expiry'
          ? paymentSimulator.formatExpiry(value)
          : field === 'securityCode'
            ? value.replace(/\D/g, '').slice(0, 3)
            : value
    setCard((previous) => ({ ...previous, [field]: formatted }))
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => step !== 'processing' && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 id="upgrade-title" className="modal__title">
              {step === 'done' ? 'Plan actualizado' : quotaExhausted ? 'Agotaste tu cuota mensual' : 'Mejora tu plan'}
            </h2>
            {step !== 'done' && (
              <p className="muted">
                Tu plan actual es <PlanBadge plan={currentPlan} />. Elige uno superior para seguir usando el asistente.
              </p>
            )}
          </div>
          {step !== 'processing' && (
            <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          )}
        </header>

        {step === 'choose' && (
          <div className="modal__body">
            {offers.length === 0 ? (
              <p>Ya tienes el plan más alto disponible.</p>
            ) : (
              <div className="plan-options">
                {offers.map((offer) => (
                  <button
                    key={offer.plan}
                    type="button"
                    className={`plan-option ${targetPlan === offer.plan ? 'plan-option--selected' : ''}`}
                    onClick={() => setTargetPlan(offer.plan)}
                    aria-pressed={targetPlan === offer.plan}
                  >
                    <span className="plan-option__top">
                      <PlanBadge plan={offer.plan} />
                      <span className="plan-option__price">
                        US${offer.monthlyPriceUsd}
                        <small>/mes</small>
                      </span>
                    </span>
                    <span className="plan-option__highlight">{offer.highlight}</span>
                    <span className="plan-option__detail">{offer.requestsPerMinuteLabel}</span>
                    <span className="plan-option__detail">{offer.monthlyTokensLabel}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="modal__actions">
              <button type="button" className="button button--ghost" onClick={onClose}>
                Ahora no
              </button>
              <button
                type="button"
                className="button button--primary"
                disabled={!targetPlan}
                onClick={() => setStep('pay')}
              >
                Continuar al pago
              </button>
            </div>
          </div>
        )}

        {(step === 'pay' || step === 'processing') && selectedOffer && (
          <form className="modal__body" onSubmit={handlePayment} noValidate>
            <div className="payment-summary">
              <span>
                Plan <strong>{selectedOffer.label}</strong>
              </span>
              <strong>US${selectedOffer.monthlyPriceUsd}/mes</strong>
            </div>
            <p className="simulation-note">
              Pago simulado: no se realiza ningún cobro y los datos de la tarjeta no se envían al servidor. Usa la
              tarjeta de prueba 4242 4242 4242 4242.
            </p>

            <label className="field">
              <span>Nombre en la tarjeta</span>
              <input
                value={card.holderName}
                onChange={(event) => updateCard('holderName', event.target.value)}
                autoComplete="off"
                disabled={step === 'processing'}
              />
              {errors.holderName && <small className="field__error">{errors.holderName}</small>}
            </label>
            <label className="field">
              <span>Número de tarjeta</span>
              <input
                value={card.cardNumber}
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                onChange={(event) => updateCard('cardNumber', event.target.value)}
                autoComplete="off"
                disabled={step === 'processing'}
              />
              {errors.cardNumber && <small className="field__error">{errors.cardNumber}</small>}
            </label>
            <div className="field-row">
              <label className="field">
                <span>Vencimiento</span>
                <input
                  value={card.expiry}
                  inputMode="numeric"
                  placeholder="MM/AA"
                  onChange={(event) => updateCard('expiry', event.target.value)}
                  autoComplete="off"
                  disabled={step === 'processing'}
                />
                {errors.expiry && <small className="field__error">{errors.expiry}</small>}
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  value={card.securityCode}
                  inputMode="numeric"
                  placeholder="123"
                  onChange={(event) => updateCard('securityCode', event.target.value)}
                  autoComplete="off"
                  disabled={step === 'processing'}
                />
                {errors.securityCode && <small className="field__error">{errors.securityCode}</small>}
              </label>
            </div>

            {failure && <p className="form-error">{failure}</p>}

            <div className="modal__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setStep('choose')}
                disabled={step === 'processing'}
              >
                Volver
              </button>
              <button type="submit" className="button button--primary" disabled={step === 'processing'}>
                {step === 'processing' ? 'Procesando pago…' : `Pagar US$${selectedOffer.monthlyPriceUsd}`}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && selectedOffer && receipt && (
          <div className="modal__body modal__body--center">
            <div className="success-mark" aria-hidden="true">
              ✓
            </div>
            <p>
              Ahora tienes el plan <PlanBadge plan={selectedOffer.plan} size="large" />
            </p>
            <p className="muted">
              Referencia {receipt.reference}, tarjeta terminada en {receipt.lastFourDigits}
            </p>
            <button type="button" className="button button--primary" onClick={onClose}>
              Seguir usando el asistente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
