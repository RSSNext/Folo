import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { clsx, cn } from "@follow/utils/utils"
import { atom, useAtomValue } from "jotai"
import type { HTMLMotionProps } from "motion/react"
import { AnimatePresence } from "motion/react"
import type * as React from "react"
import type { FC, JSX, PropsWithChildren, ReactNode } from "react"
import { useId } from "react"

import { m } from "~/components/common/Motion"
import { jotaiStore } from "~/lib/jotai"

const fabContainerElementAtom = atom(null as HTMLDivElement | null)

export interface FABConfig {
  id: string
  icon: JSX.Element
  onClick: () => void
}

export const FABBase: FC<
  PropsWithChildren<
    {
      id: string
      show?: boolean
      children: JSX.Element
      ref?: React.Ref<HTMLButtonElement>
    } & HTMLMotionProps<"button">
  >
> = (props) => {
  const { children, show = true, ref, ...extra } = props
  const { className, ...rest } = extra

  return (
    <AnimatePresence>
      {show && (
        <m.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
          ref={ref}
          aria-label="Floating action button"
          className={cn(
            "mt-2 flex items-center justify-center",
            "size-9 text-lg md:text-base",
            "outline-accent hover:opacity-100 focus:opacity-100 focus:outline-none",
            "hover:border-border bg-background relative rounded-xl border border-transparent",
            "group duration-200",
            className,
          )}
          {...rest}
        >
          <div className="shadow-perfect border-border/50 pointer-events-none absolute inset-0 rounded-xl border shadow-xl duration-200 group-hover:opacity-0" />
          {children}
        </m.button>
      )}
    </AnimatePresence>
  )
}

export const FABPortable: FC<
  PropsWithChildren<{
    children: React.JSX.Element
    onClick: () => void
    show?: boolean
    ref?: React.Ref<HTMLButtonElement>
  }>
> = (props) => {
  const { onClick, children, show = true, ref } = props
  const id = useId()
  const portalElement = useAtomValue(fabContainerElementAtom)

  if (!portalElement) return null

  return (
    <RootPortal to={portalElement}>
      <FABBase ref={ref} id={id} show={show} onClick={onClick}>
        {children}
      </FABBase>
    </RootPortal>
  )
}

export const FABContainer = (props: { children?: ReactNode }) => {
  return (
    <div
      ref={useTypeScriptHappyCallback((ref) => jotaiStore.set(fabContainerElementAtom, ref), [])}
      data-testid="fab-container"
      data-hide-print
      className={clsx(
        "fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-[calc(100vw-3rem-1rem)] z-[9] flex flex-col",
        "transition-transform duration-300 ease-in-out",
      )}
    >
      {props.children}
    </div>
  )
}
