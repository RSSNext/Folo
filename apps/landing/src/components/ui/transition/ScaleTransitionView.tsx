'use client'

import { createTransitionView } from './factor'

export const ScaleTransitionView = createTransitionView({
  from: {
    scale: 0.001,
    opacity: 0.001,
  },
  to: {
    scale: 1,
    opacity: 1,
  },
})
