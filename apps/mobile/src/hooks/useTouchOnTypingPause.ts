import { useEffect } from "react"

// Long enough that a value still being typed is not flagged
const TYPING_PAUSE_MS = 1000

/**
 * Marks a field as touched once typing pauses on an invalid value. A hint that waits for the field
 * to lose focus never shows on Android when Back closes the keyboard, as the field keeps focus, nor
 * while the field stays focused and a disabled header button is tapped.
 */
export const useTouchOnTypingPause = (
  value: string,
  isInvalid: boolean,
  setTouched: (touched: boolean) => void,
) => {
  useEffect(() => {
    if (!value || !isInvalid) return
    const timer = setTimeout(() => setTouched(true), TYPING_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [value, isInvalid, setTouched])
}
