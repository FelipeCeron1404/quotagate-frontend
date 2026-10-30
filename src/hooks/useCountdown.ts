import { useEffect, useReducer } from 'react'

const TICK_MS = 250

function secondsUntil(targetEpochMs: number | null): number {
  if (targetEpochMs === null) {
    return 0
  }
  return Math.max(0, Math.ceil((targetEpochMs - Date.now()) / 1000))
}

export function useCountdown(targetEpochMs: number | null): number {
  const [, forceTick] = useReducer((tick: number) => tick + 1, 0)

  useEffect(() => {
    if (targetEpochMs === null) {
      return
    }
    const intervalId = window.setInterval(forceTick, TICK_MS)
    return () => window.clearInterval(intervalId)
  }, [targetEpochMs])

  return secondsUntil(targetEpochMs)
}
