import { createContext, use } from "react"

interface RadioContext {
  onChange: (value: string) => void
}
const RadioContext = createContext<RadioContext>(null!)

export const useRadioContext = () => use(RadioContext)

export const RadioGroupContextProvider = RadioContext
type RadioGroupValue = string | undefined

const RadioGroupValueContext = createContext<RadioGroupValue>("")
export const RadioGroupValueProvider = RadioGroupValueContext
export const useRadioGroupValue = () => use(RadioGroupValueContext)
