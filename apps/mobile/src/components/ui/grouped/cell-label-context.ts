import { createContext } from "react"

/** The label of the grouped cell a control sits in, so screen readers can name the control */
export const GroupedCellLabelContext = createContext<string | undefined>(undefined)
