import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import type { CSSProperties } from "react"
import { createContext } from "react"

export const DraggableContext = createContext<{
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  style?: CSSProperties | undefined
} | null>(null)
