export interface SimulatedCardDetails {
  holderName: string
  cardNumber: string
  expiry: string
  securityCode: string
}

export type CardValidationErrors = Partial<Record<keyof SimulatedCardDetails, string>>

export interface SimulatedPaymentReceipt {
  reference: string
  lastFourDigits: string
  processedAt: Date
}

export class PaymentSimulator {
  private static readonly PROCESSING_DELAY_MS = 1500

  validate(details: SimulatedCardDetails, today: Date = new Date()): CardValidationErrors {
    const errors: CardValidationErrors = {}
    if (details.holderName.trim().length < 3) {
      errors.holderName = 'Escribe el nombre como aparece en la tarjeta'
    }
    const digits = this.digitsOf(details.cardNumber)
    if (digits.length !== 16 || !this.passesLuhnCheck(digits)) {
      errors.cardNumber = 'Número inválido. Para la simulación usa 4242 4242 4242 4242'
    }
    if (!this.isFutureExpiry(details.expiry, today)) {
      errors.expiry = 'Usa el formato MM/AA con una fecha futura'
    }
    if (!/^\d{3}$/.test(details.securityCode)) {
      errors.securityCode = 'El CVC tiene 3 dígitos'
    }
    return errors
  }

  async process(details: SimulatedCardDetails): Promise<SimulatedPaymentReceipt> {
    await new Promise((resolve) => setTimeout(resolve, PaymentSimulator.PROCESSING_DELAY_MS))
    const digits = this.digitsOf(details.cardNumber)
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    return {
      reference: `SIM-${Date.now().toString(36).toUpperCase()}-${suffix}`,
      lastFourDigits: digits.slice(-4),
      processedAt: new Date(),
    }
  }

  formatCardNumber(value: string): string {
    return this.digitsOf(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  formatExpiry(value: string): string {
    const digits = this.digitsOf(value).slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }

  private digitsOf(value: string): string {
    return value.replace(/\D/g, '')
  }

  private passesLuhnCheck(digits: string): boolean {
    let sum = 0
    for (let index = 0; index < digits.length; index++) {
      let digit = Number(digits[digits.length - 1 - index])
      if (index % 2 === 1) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      sum += digit
    }
    return sum % 10 === 0
  }

  private isFutureExpiry(expiry: string, today: Date): boolean {
    const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
    if (!match) {
      return false
    }
    const month = Number(match[1])
    const year = 2000 + Number(match[2])
    if (month < 1 || month > 12) {
      return false
    }
    const lastValidDay = new Date(year, month, 0, 23, 59, 59)
    return lastValidDay >= today
  }
}

export const paymentSimulator = new PaymentSimulator()
