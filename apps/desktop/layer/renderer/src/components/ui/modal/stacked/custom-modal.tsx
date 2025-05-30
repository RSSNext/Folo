import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { m, useAnimationControls } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import type { JSX } from "react/jsx-runtime"

import { ModalClose } from "./components"
import { useCurrentModal } from "./hooks"

export const PlainModal = ({ children }: PropsWithChildren) => children

export { PlainModal as NoopChildren }

type ModalTemplateType = {
  (props: PropsWithChildren<{ className?: string }>): JSX.Element
  class: (className: string) => (props: PropsWithChildren<{ className?: string }>) => JSX.Element
}

export const SlideUpModal: ModalTemplateType = (props) => {
  const winHeight = useState(() => window.innerHeight)[0]
  const { dismiss } = useCurrentModal()
  return (
    <div className={"center container h-full"} onPointerDown={dismiss} onClick={stopPropagation}>
      <m.div
        onPointerDown={stopPropagation}
        tabIndex={-1}
        exit={{
          y: winHeight,
          opacity: 0,
        }}
        onAnimationComplete={(definition) => {
          if (definition === "exit") {
            dismiss()
          }
        }}
        className={cn(
          "bg-theme-background relative flex flex-col items-center overflow-hidden rounded-xl border p-8 pb-0",
          "aspect-[7/9] w-[600px] max-w-full shadow lg:max-h-[calc(100vh-10rem)]",
          "motion-preset-slide-up motion-duration-200 motion-ease-spring-smooth",
          props.className,
        )}
      >
        {props.children}

        <ModalClose />
      </m.div>
    </div>
  )
}

SlideUpModal.class = (className: string) => {
  return (props: ComponentType) => (
    <SlideUpModal {...props} className={cn(props.className, className)} />
  )
}

const modalVariant = {
  enter: {
    x: 0,
    opacity: 1,
  },
  initial: {
    x: 700,
    opacity: 0.9,
  },
  exit: {
    x: 750,
    opacity: 0,
  },
}

export const DrawerModalLayout: FC<PropsWithChildren> = ({ children }) => {
  const { dismiss } = useCurrentModal()
  const controller = useAnimationControls()
  useEffect(() => {
    nextFrame(() => controller.start("enter"))
  }, [controller])

  return (
    <div className={"h-full"} onPointerDown={dismiss} onClick={stopPropagation}>
      <m.div
        onPointerDown={stopPropagation}
        tabIndex={-1}
        initial="initial"
        animate={controller}
        variants={modalVariant}
        transition={{
          type: "spring",
          mass: 0.4,
          tension: 100,
          friction: 1,
        }}
        onAnimationComplete={(definition) => {
          if (definition === "exit") {
            dismiss()
          }
        }}
        exit="exit"
        layout="size"
        className={cn(
          "bg-theme-background flex flex-col items-center overflow-hidden rounded-xl border p-8 pb-0",
          "shadow-drawer-to-left w-[60ch] max-w-full",
          "safe-inset-top-4 fixed bottom-4 right-2",
        )}
      >
        {children}
      </m.div>
    </div>
  )
}

export const ScaleModal: ModalTemplateType = (props) => {
  const { dismiss } = useCurrentModal()

  return (
    <div className={"center container h-full"} onPointerDown={dismiss} onClick={stopPropagation}>
      <m.div
        onPointerDown={stopPropagation}
        transition={{
          type: "spring",
          mass: 0.4,
          tension: 100,
          friction: 1,
        }}
        initial={{ transform: "scale(0)", opacity: 0 }}
        animate={{ transform: "scale(1)", opacity: 1 }}
        exit={{ transform: "scale(0.6)", opacity: 0 }}
        className="relative"
      >
        {props.children}
      </m.div>
    </div>
  )
}

ScaleModal.class = (className: string) => {
  return (props: ComponentType) => (
    <ScaleModal {...props} className={cn(props.className, className)} />
  )
}
