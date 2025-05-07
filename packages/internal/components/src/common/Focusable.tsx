import type { FocusEvent } from "react"
import { createContext, use, useCallback, useState } from "react"

// const
const FocusableContext = createContext(false)
export const Focusable: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ ref, ...props }) => {
  const { onBlur, onFocus, ...rest } = props
  const [isFocusWithIn, setIsFocusWithIn] = useState(false)
  const handleFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      onFocus?.(e)
      setIsFocusWithIn(true)
    },
    [onFocus],
  )
  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      onBlur?.(e)
      setIsFocusWithIn(false)
    },
    [onBlur],
  )

  return (
    <FocusableContext value={isFocusWithIn}>
      <div
        tabIndex={-1}
        role="region"
        ref={ref}
        {...rest}
        onBlur={handleBlur}
        onFocusCapture={handleFocus}
        onBlurCapture={handleBlur}
        onFocus={handleFocus}
      />
    </FocusableContext>
  )
}

export const useFocusable = () => {
  return use(FocusableContext)
}
