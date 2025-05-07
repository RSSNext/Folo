import { useMemo, useRef, useState } from "react"

import { RadioGroupContextProvider, RadioGroupValueProvider } from "./context"

export const RadioGroup: Component<{
  value?: string
  onValueChange?: (value: string) => void
}> = (props) => {
  const { onValueChange, value } = props

  const stableOnValueChange = useRef(onValueChange).current

  const [currentValue, setCurrentValue] = useState(value)
  return (
    <RadioGroupContextProvider
      value={useMemo(
        () => ({
          onChange(value) {
            setCurrentValue(value)
            stableOnValueChange?.(value)
          },
        }),
        [stableOnValueChange],
      )}
    >
      <RadioGroupValueProvider value={currentValue}>{props.children}</RadioGroupValueProvider>
    </RadioGroupContextProvider>
  )
}
