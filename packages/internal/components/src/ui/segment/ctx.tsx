import { createContext } from "use-context-selector"

export interface SegmentGroupContextValue {
  value: string
  setValue: (value: string) => void
  componentId: string
}
export const SegmentGroupContext = createContext<SegmentGroupContextValue>(null!)
