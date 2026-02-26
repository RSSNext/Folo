'use client'

import type { FC, PropsWithChildren } from 'react'

import { createTransitionView } from './factor'
import type { BaseTransitionProps } from './typings'

export const FadeInOutTransitionView: FC<
  PropsWithChildren<BaseTransitionProps>
> = createTransitionView({
  from: {
    opacity: 0.001,
  },
  to: {
    opacity: 1,
  },
})
