import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils/utils"
import type { TargetAndTransition, Transition } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { cloneElement, useEffect, useState } from "react"

type TransitionType = {
  initial: TargetAndTransition | boolean
  animate: TargetAndTransition
  exit: TargetAndTransition
}

type IconTransitionProps = {
  icon1: string | React.JSX.Element
  icon2: string | React.JSX.Element
  status: "init" | "done"
  className?: string
  icon1ClassName?: string
  icon2ClassName?: string
}

const createIconTransition =
  (transitionType: TransitionType) =>
  ({ icon1, icon2, status, className, icon1ClassName, icon2ClassName }: IconTransitionProps) => {
    const [isMount, setIsMounted] = useState(false)
    useEffect(() => {
      setIsMounted(true)
      return () => setIsMounted(false)
    }, [])

    const initial = isMount ? transitionType.initial : true
    const { animate } = transitionType
    const { exit } = transitionType

    return (
      <AnimatePresence mode="popLayout">
        {status === "init" ? (
          typeof icon1 === "string" ? (
            <m.i
              className={cn(icon1ClassName, className, icon1)}
              key="1"
              initial={initial}
              animate={animate}
              exit={exit}
            />
          ) : (
            <m.span key="1" initial={initial} animate={animate} exit={exit}>
              {cloneElement(icon1, {
                className: cn(icon1ClassName, className),
              })}
            </m.span>
          )
        ) : typeof icon2 === "string" ? (
          <m.i
            className={cn(icon2ClassName, className, icon2)}
            key="2"
            initial={initial}
            animate={animate}
            exit={exit}
          />
        ) : (
          <m.span key="2" initial={initial} animate={animate} exit={exit}>
            {cloneElement(icon2, {
              className: cn(icon2ClassName, className),
            })}
          </m.span>
        )}
      </AnimatePresence>
    )
  }

export const IconScaleTransition = createIconTransition({
  initial: { scale: 0 },
  animate: { scale: 1 },
  exit: { scale: 0 },
})

export const IconOpacityTransition = createIconTransition({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
})

const Presets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: Spring.presets.smooth,
  },
}
export const IconTransition = (
  props: React.PropsWithChildren<{
    animatedKey: string
    initial?: TargetAndTransition
    animate?: TargetAndTransition
    exit?: TargetAndTransition
    transition?: Transition

    preset?: "fade"
  }>,
) => {
  const preset = Presets[props.preset ?? "fade"]
  return (
    <AnimatePresence mode="popLayout">
      <m.span
        key={props.animatedKey}
        initial={props.initial ?? preset.initial}
        animate={props.animate ?? preset.animate}
        exit={props.exit ?? preset.exit}
        transition={props.transition ?? preset.transition}
      >
        {props.children}
      </m.span>
    </AnimatePresence>
  )
}
