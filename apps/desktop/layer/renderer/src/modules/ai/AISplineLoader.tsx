import Spline from "@splinetool/react-spline"
import { useCallback, useRef } from "react"

const resolvedAIIconUrl = "https://cdn.follow.is/ai.splinecode"

export const AISplineLoader = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<any>(null)
  const bodyRef = useRef<any>(null)

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
      const headRotationY = clampedX * 70

      // X-axis rotation (up-down): -60 to 60 degrees
      const headRotationX = clampedY * 60

      return {
        x: degToRad(headRotationX),
        y: degToRad(headRotationY),
      }
    },
    [],
  )

  // Calculate body rotation angle (horizontal rotation only)
  const calculateBodyRotation = useCallback((mouseX: number, containerRect: DOMRect) => {
    const containerCenterX = containerRect.left + containerRect.width / 2

    // Calculate mouse X position relative to container center (-1 to 1)
    const relativeX = (mouseX - containerCenterX) / (window.innerWidth / 2)
    const clampedX = Math.max(-1, Math.min(1, relativeX))

    // Body Y-axis rotation: -30 to 30 degrees (smaller range than head rotation)
    const bodyRotationY = clampedX * 30

    return {
      x: 0, // Body doesn't rotate up-down
      y: degToRad(bodyRotationY),
    }
  }, [])

  const handleLoad = useCallback(
    (app: any) => {
      const head = app.findObjectByName("Head")
      const body = app.findObjectByName("Body")

      if (!head || !body) {
        console.warn("Cannot find Head or Body object")
        return
      }

      headRef.current = head
      bodyRef.current = body

      const onMove = (e: MouseEvent) => {
        if (!containerRef.current || !headRef.current || !bodyRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()

        // Calculate head rotation
        const headRotation = calculateHeadRotation(e.clientX, e.clientY, containerRect)
        headRef.current.rotation.x = headRotation.x
        headRef.current.rotation.y = headRotation.y

        // Calculate body rotation
        const bodyRotation = calculateBodyRotation(e.clientX, containerRect)
        bodyRef.current.rotation.x = bodyRotation.x
        bodyRef.current.rotation.y = bodyRotation.y
      }

      // Reset to default position when mouse leaves
      const onMouseLeave = () => {
        if (!headRef.current || !bodyRef.current) return

        // Smooth transition back to default position
        const resetAnimation = () => {
          if (!headRef.current || !bodyRef.current) return

          const currentHeadX = headRef.current.rotation.x
          const currentHeadY = headRef.current.rotation.y
          const currentBodyY = bodyRef.current.rotation.y

          // Simple linear interpolation to smoothly return rotation to 0
          headRef.current.rotation.x = currentHeadX * 0.9
          headRef.current.rotation.y = currentHeadY * 0.9
          bodyRef.current.rotation.y = currentBodyY * 0.9

          // Continue animation if not fully returned to 0
          if (
            Math.abs(currentHeadX) > 0.01 ||
            Math.abs(currentHeadY) > 0.01 ||
            Math.abs(currentBodyY) > 0.01
          ) {
            requestAnimationFrame(resetAnimation)
          } else {
            // Complete reset to 0
            headRef.current.rotation.x = 0
            headRef.current.rotation.y = 0
            bodyRef.current.rotation.x = 0
            bodyRef.current.rotation.y = 0
          }
        }

        resetAnimation()
      }

      window.addEventListener("pointermove", onMove)
      document.addEventListener("mouseleave", onMouseLeave)

      return () => {
        window.removeEventListener("pointermove", onMove)
        document.removeEventListener("mouseleave", onMouseLeave)
      }
    },
    [calculateHeadRotation, calculateBodyRotation],
  )

  return (
    <div ref={containerRef} className={"!size-16"}>
      <Spline scene={resolvedAIIconUrl} onLoad={handleLoad} className="size-full" />
    </div>
  )
}
