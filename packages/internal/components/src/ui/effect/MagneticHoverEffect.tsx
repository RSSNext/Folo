import { cn } from "@follow/utils/utils"
import * as React from "react"
import { useCallback, useImperativeHandle, useRef } from "react"

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

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!itemRef.current) return
    const rect = itemRef.current.getBoundingClientRect()

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    itemRef.current.style.transition = "transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)"
    itemRef.current.style.setProperty("--origin-x", `${x}%`)
    itemRef.current.style.setProperty("--origin-y", `${y}%`)
  }

  const handleMouseLeave = () => {
    if (!itemRef.current) return
    itemRef.current.style.transform = "translate(0px, 0px)"
    itemRef.current.style.transition = "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)"
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!itemRef.current) return
    const rect = itemRef.current.getBoundingClientRect()

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = (e.clientX - centerX) * 0.05
    const distanceY = (e.clientY - centerY) * 0.05

    itemRef.current.style.transform = `translate(${distanceX}px, ${distanceY}px)`
  }, [])

  return (
    <Component
      ref={itemRef as any}
      {...rest}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative",
        "inline-block transition-transform duration-200 ease-out will-change-transform",
        "hover:before:bg-fill-tertiary",
        "before:backdrop-blur-background before:absolute before:-inset-x-2 before:inset-y-0 before:z-[-1] before:scale-0 before:rounded-xl before:opacity-0 before:transition-all before:duration-200 before:[transform-origin:var(--origin-x)_var(--origin-y)] hover:before:scale-100 hover:before:opacity-100",
        rest.className,
      )}
    >
      {children}
    </Component>
  )
}
