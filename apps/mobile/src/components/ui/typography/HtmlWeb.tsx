"use dom"
import "@follow/components/assets/colors-media.css"
import "@follow/components/assets/tailwind.css"

import type { HtmlProps } from "@follow/components"
import { Html } from "@follow/components"
import { useEffect } from "react"

function useSize(callback: (size: [number, number]) => void) {
  useEffect(() => {
    const lastSize = [document.body.clientWidth, document.body.clientHeight] as [number, number]

    // Observe window size changes
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect

        if (
          width.toFixed(0) !== lastSize[0].toFixed(0) ||
          height.toFixed(0) !== lastSize[1].toFixed(0)
        ) {
          lastSize[0] = width
          lastSize[1] = height
          callback([width, height])
        }
      }
    })

    observer.observe(document.body)

    callback([document.body.clientWidth, document.body.clientHeight])

    return () => {
      observer.disconnect()
    }
  }, [callback])
}

export default function HtmlWeb({
  content,
  dom,
  onLayout,
  ...options
}: {
  dom?: import("expo/dom").DOMProps
  onLayout: (size: [number, number]) => void
} & HtmlProps) {
  useSize(onLayout)
  return <Html content={content} {...options} />
}
