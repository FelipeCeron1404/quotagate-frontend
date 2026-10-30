const numberFormatter = new Intl.NumberFormat('es-CO')

const longDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDayFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export class DisplayFormatter {
  number(value: number): string {
    return numberFormatter.format(value)
  }

  isoDateLong(isoDate: string): string {
    return longDateFormatter.format(new Date(`${isoDate}T00:00:00Z`))
  }

  isoDateShort(isoDate: string): string {
    return shortDayFormatter.format(new Date(`${isoDate}T00:00:00Z`))
  }

  countdown(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.ceil(totalSeconds))
    const minutes = Math.floor(safeSeconds / 60)
    const seconds = safeSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

export const displayFormatter = new DisplayFormatter()
