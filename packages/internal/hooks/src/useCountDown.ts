// credits: https://usehooks-ts.com/react-hook/use-countdown

import { useCallback } from "react"
import { useBoolean, useCounter, useInterval } from "usehooks-ts"

type CountdownOptions = {
  countStart: number

  intervalMs?: number
  isIncrement?: boolean
  autoStart?: boolean

  countStop?: number
}

type CountdownControllers = {
  startCountdown: () => void
  stopCountdown: () => void
  resetCountdown: () => void
}

export function useCountdown({
  countStart,
  countStop = 0,
  intervalMs = 1000,
  isIncrement = false,
  autoStart = true,
}: CountdownOptions): [number, CountdownControllers] {
  const { count, increment, decrement, reset: resetCounter } = useCounter(countStart)

  /*
   * Note: used to control the useInterval
   * running: If true, the interval is running
   * start: Should set running true to trigger interval
   * stop: Should set running false to remove interval.
   */
  const {
    value: isCountdownRunning,
    setTrue: startCountdown,
    setFalse: stopCountdown,
  } = useBoolean(autoStart)

  // Will set running false and reset the seconds to initial value.
  const resetCountdown = useCallback(() => {
    stopCountdown()
    resetCounter()
  }, [stopCountdown, resetCounter])

  const countdownCallback = useCallback(() => {
    if (count === countStop) {
      stopCountdown()
      return
    }

    if (isIncrement) {
      increment()
    } else {
      decrement()
    }
  }, [count, countStop, decrement, increment, isIncrement, stopCountdown])

  useInterval(countdownCallback, isCountdownRunning ? intervalMs : null)

  return [count, { startCountdown, stopCountdown, resetCountdown }]
}
