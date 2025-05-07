import { useEffect } from "react"

const PREVENT_SPRING_CLASS = "prevent-spring"

/**
 * Prevent overscroll bounce
 * @param enabled - Whether to enable the prevention of overscroll bounce, default is true
 */
export const usePreventOverscrollBounce = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return

    // If has style element, skip
    if (document.querySelector(`#${PREVENT_SPRING_CLASS}`)) {
      return
    }

    const styleElement = document.createElement("style")
    styleElement.id = PREVENT_SPRING_CLASS
    styleElement.textContent = `
      [data-${PREVENT_SPRING_CLASS}] {
        overscroll-behavior: none !important;
      }
    `

    document.head.append(styleElement)

    document.documentElement.dataset.preventSpring = "true"
    document.body.dataset.preventSpring = "true"

    return () => {
      delete document.documentElement.dataset.preventSpring
      delete document.body.dataset.preventSpring
      styleElement.remove()
    }
  }, [enabled])
}
