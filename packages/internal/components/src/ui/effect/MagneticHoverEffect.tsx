import { cn } from "@follow/utils/utils"
import * as React from "react"
import { useImperativeHandle, useRef } from "react"

type MagneticHoverEffectProps<T extends React.ElementType> = {
  as?: T
  children: React.ReactNode
  ref?: React.Ref<T>
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children">

export const MagneticHoverEffect = <T extends React.ElementType = "div">({
  as,
  children,
  ref,
  ...rest
}: MagneticHoverEffectProps<T>) => {
  const Component = as || "div"

  const itemRef = useRef<HTMLElement>(null)

  useImperativeHandle(ref, () => {
    return itemRef.current as unknown as T
  })

  return (
    <Component
      ref={itemRef as any}
      {...rest}
      className={cn(
        "relative",
        "inline-block duration-200 ease-out",
        "hover:before:bg-material-ultra-thick",
        "before:backdrop-blur-background before:absolute before:-inset-x-2 before:inset-y-0 before:z-[-1] before:scale-0 before:rounded-xl before:opacity-0 before:transition-all before:duration-200 before:[transform-origin:var(--origin-x)_var(--origin-y)] hover:before:scale-100 hover:before:opacity-100",
        rest.className,
      )}
    >
      {children}
    </Component>
  )
}
