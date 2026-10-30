import { useEffect, useState } from 'react'

const TICK_MS = 250

export function useCountdown(targetEpochMs: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (targetEpochMs === null) {
      return
    }
    const intervalId = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(intervalId)
  }, [targetEpochMs])

  if (targetEpochMs === null) {
    return 0
  }
  return Math.max(0, Math.ceil((targetEpochMs - now) / 1000))
}
