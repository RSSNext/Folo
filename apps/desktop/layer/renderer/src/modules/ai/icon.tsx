import { cn } from "@follow/utils/utils"
import Spline from "@splinetool/react-spline"

import aiIconUrl from "~/assets/ai.splinecode?url"

const resolvedAIIconUrl = new URL(aiIconUrl, import.meta.url).href

export const AISpline = ({ className }: { className?: string }) => {
  function handleLoad(app) {
    const obj = app.findObjectByName("Mesh")
    if (!obj) return

    const onMove = (e) => {
      const iconPosition = app.canvas.getBoundingClientRect()
      const { innerWidth: w, innerHeight: h } = window
      const nx = Math.max(-0.25, Math.min(0.25, (e.clientX - iconPosition.left) / w))
      const ny = Math.max(-0.2, Math.min(0.2, (e.clientY - iconPosition.top) / h))
      obj.rotation.y = nx * Math.PI * 2
      obj.rotation.x = ny * Math.PI
    }
    window.addEventListener("pointermove", onMove)

    return () => window.removeEventListener("pointermove", onMove)
  }

  return (
    <Spline scene={resolvedAIIconUrl} onLoad={handleLoad} className={cn("!size-16", className)} />
  )
}
