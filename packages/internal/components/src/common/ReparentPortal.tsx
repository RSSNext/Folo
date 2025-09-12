import type * as React from "react"
import type { CSSProperties } from "react"
import { useLayoutEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"

type Target = HTMLElement | null | string | (() => HTMLElement | null | undefined) | undefined

export interface ReparentPortalProps {
  target: Target
  children: React.ReactNode
  hostClassName?: string
  hostStyle?: CSSProperties
  hostTag?: keyof HTMLElementTagNameMap
  debugName?: string
  /**
   * Behavior when target is null:
   * - true (default): keep the last parent container, do not unmount the subtree
   * - false: remove the host from DOM (subtree is unmounted)
   */
  keepLastParentOnNull?: boolean
}

function resolveTarget(target: Target): HTMLElement | null {
  if (target == null) return null
  if (typeof target === "string") return document.querySelector(target) as HTMLElement | null
  if (typeof target === "function") return target() ?? null
  return target
}

export function ReparentPortal({
  target,
  children,
  hostClassName,
  hostStyle,
  hostTag = "div",
  debugName,
  keepLastParentOnNull = true,
}: ReparentPortalProps) {
  // Keep Fixed hostEl(Portal's container is always it)
  const hostEl = useMemo(() => {
    const el = document.createElement(hostTag)
    if (debugName) el.dataset.reparentPortal = debugName
    if (hostClassName != null) el.className = hostClassName
    if (hostStyle != null) Object.assign(el.style, hostStyle)

    return el
  }, [hostTag, debugName])

  const lastParentRef = useRef<HTMLElement | null>(null)

  // Sync styles/classes to hostEl
  useLayoutEffect(() => {
    if (hostClassName != null) hostEl.className = hostClassName
    if (hostStyle != null) Object.assign(hostEl.style, hostStyle)
  }, [hostEl, hostClassName, hostStyle])

  // Move the same hostEl to the target container
  useLayoutEffect(() => {
    const nextParent = resolveTarget(target)

    if (nextParent) {
      if (hostEl.parentNode !== nextParent) {
        nextParent.append(hostEl)
        lastParentRef.current = nextParent
      }
      return
    }

    // target is null
    if (!keepLastParentOnNull) {
      const prev = lastParentRef.current
      if (prev && hostEl.parentNode === prev) {
        hostEl.remove()
      }
      lastParentRef.current = null
    }
  }, [target, hostEl, keepLastParentOnNull])

  // When unmounting, remove hostEl from DOM
  useLayoutEffect(() => {
    return () => {
      const parent = hostEl.parentNode
      if (parent) hostEl.remove()
    }
  }, [hostEl])

  // Critical fix: no longer depends on "attached" secondary rendering, directly render to hostEl
  // If you want to unmount the subtree when target is null and keepLastParentOnNull=false, you can check here:
  if (!keepLastParentOnNull && !resolveTarget(target) && !lastParentRef.current) {
    return null
  }

  return createPortal(children, hostEl)
}
