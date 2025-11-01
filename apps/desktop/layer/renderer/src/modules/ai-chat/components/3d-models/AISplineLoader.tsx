import { clamp, cn } from "@follow/utils"
import Spline from "@splinetool/react-spline"
import { useCallback, useRef } from "react"

const resolvedAIIconUrl = "https://cdn.follow.is/ai2.splinecode"

export const AISplineLoader = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<any>(null)

  // Angle conversion function: degrees to radians
  const degToRad = (degrees: number) => degrees * (Math.PI / 180)

  // Calculate the angle the head should look at
  const calculateHeadRotation = useCallback(
    (mouseX: number, mouseY: number, containerRect: DOMRect) => {
      const containerCenterX = containerRect.left + containerRect.width / 2
      const containerCenterY = containerRect.top + containerRect.height / 2

      // Calculate mouse position relative to container center (-1 to 1)
      const relativeX = (mouseX - containerCenterX) / (window.innerWidth / 2)
      const relativeY = (mouseY - containerCenterY) / (window.innerHeight / 2)

      // Clamp range
      const clampedX = Math.max(-1, Math.min(1, relativeX))
      const clampedY = Math.max(-1, Math.min(1, relativeY))

      // Calculate head rotation angle based on relative position
      // Y-axis rotation (left-right): -70 to 70 degrees
      const headRotationY = clampedX * 20

      // X-axis rotation (up-down): -60 to 60 degrees
      const headRotationX = clampedY * 20

      return {
        x: degToRad(headRotationX),
        y: degToRad(headRotationY),
      }
    },
    [],
  )

  const handleLoad = useCallback(
    (app: any) => {
      const head = app.findObjectByName("Folo Character_V3")

      if (!head) {
        console.warn("Cannot find Head or Body object")
        return
      }

      headRef.current = head

      const onMove = (e: MouseEvent) => {
        if (!containerRef.current || !headRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()

        // Calculate head rotation
        const headRotation = calculateHeadRotation(e.clientX, e.clientY, containerRect)
        headRef.current.rotation.x = clamp(headRotation.x, -0.5, 0.5)
        headRef.current.rotation.y = clamp(headRotation.y, -0.5, 0.5)
      }

      // Reset to default position when mouse leaves
      const onMouseLeave = () => {
        if (!headRef.current) return

        // Smooth transition back to default position
        const resetAnimation = () => {
          if (!headRef.current) return

          const currentHeadX = headRef.current.rotation.x
          const currentHeadY = headRef.current.rotation.y

          // Simple linear interpolation to smoothly return rotation to 0
          headRef.current.rotation.x = currentHeadX * 0.9
          headRef.current.rotation.y = currentHeadY * 0.9

          // Continue animation if not fully returned to 0
          if (Math.abs(currentHeadX) > 0.01 || Math.abs(currentHeadY) > 0.01) {
            requestAnimationFrame(resetAnimation)
          } else {
            // Complete reset to 0
            headRef.current.rotation.x = 0
            headRef.current.rotation.y = 0
          }
        }

        resetAnimation()
      }

      const onClick = () => {
        app.emitEvent("mouseDown", "Folo Character_V3")
      }
      onClick()

      window.addEventListener("pointermove", onMove)
      document.addEventListener("mouseleave", onMouseLeave)
      window.addEventListener("click", onClick)

      return () => {
        window.removeEventListener("pointermove", onMove)
        document.removeEventListener("mouseleave", onMouseLeave)
        window.removeEventListener("click", onClick)
      }
    },
    [calculateHeadRotation],
  )

  return (
    <div ref={containerRef} className={cn("size-20", className)}>
      <Spline scene={resolvedAIIconUrl} onLoad={handleLoad} className="size-full" />
    </div>
  )
}
