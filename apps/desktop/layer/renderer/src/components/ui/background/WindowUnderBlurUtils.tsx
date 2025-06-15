import { cn } from "@follow/utils/utils"
import type { ComponentPropsWithoutRef, ElementType } from "react"

export type Props<T extends ElementType = "div"> = {
  as?: T
} & ComponentPropsWithoutRef<T>

export const MacOSVibrancy = <T extends ElementType = "div">({
  children,
  as,
  ...rest
}: Props<T>) => {
  const Component = as || "div"
  return <Component {...rest}>{children}</Component>
}

export const Noop = <T extends ElementType = "div">({
  children,
  className,
  as,
  ...rest
}: Props<T>) => {
  const Component = as || "div"
  return (
    <Component className={cn("bg-sidebar", className)} {...rest}>
      {children}
    </Component>
  )
}
