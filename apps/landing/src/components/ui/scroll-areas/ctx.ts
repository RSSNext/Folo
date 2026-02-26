import { createContext } from 'react'

export const ScrollElementContext = createContext<HTMLElement | null>(
  typeof window === 'undefined' ? null : document.documentElement,
)
