'use client'

import type {
  HTMLMotionProps,
  Spring,
  Target,
  TargetAndTransition,
} from 'motion/react'
import { m } from 'motion/react'
import type { FC, PropsWithChildren } from 'react'
import { memo, useMemo } from 'react'

import { isHydrationEnded } from '~/components/common/HydrationEndDetector'
import { microReboundPreset } from '~/constants/spring'

import type { BaseTransitionProps } from './typings'

interface TransitionViewParams {
  from: Target
  to: Target
  initial?: Target
  preset?: Spring
}

export const createTransitionView = (
  params: TransitionViewParams,
): FC<PropsWithChildren<BaseTransitionProps>> => {
  const { from, to, initial, preset } = params

  const TransitionView = (props: PropsWithChildren<BaseTransitionProps>) => {
    const {
      timeout = {},
      duration = 0.5,

      animation = {},
      as = 'div',
      delay = 0,
      lcpOptimization = false,
      ...rest
    } = props

    const { enter = delay, exit = delay } = timeout

    const MotionComponent = m[as] as FC<HTMLMotionProps<any>>

    return (
      <MotionComponent
        initial={useMemo(
          () =>
            lcpOptimization
              ? isHydrationEnded()
                ? initial || from
                : true
              : initial || from,
          [],
        )}
        animate={{
          ...to,
          transition: {
            duration,
            ...(preset || microReboundPreset),
            ...animation.enter,
            delay: enter / 1000,
          },
        }}
        exit={{
          ...from,
          transition: {
            duration,
            ...animation.exit,
            delay: exit / 1000,
          } as TargetAndTransition['transition'],
        }}
        transition={{
          duration,
        }}
        {...rest}
      >
        {props.children}
      </MotionComponent>
    )
  }
  const MemoedTransitionView = memo(TransitionView)
  MemoedTransitionView.displayName = `MemoedTransitionView`
  return MemoedTransitionView
}
