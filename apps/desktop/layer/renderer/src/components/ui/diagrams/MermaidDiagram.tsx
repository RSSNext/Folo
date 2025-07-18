import { cn } from "@follow/utils"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import { usePreviewMedia } from "~/components/ui/media/hooks"

interface MermaidDiagramProps {
  code: string
  className?: string

  shouldRender?: boolean
}

export const MermaidDiagram = memo<MermaidDiagramProps>(({ code, className, shouldRender }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [imageUrl, setImageUrl] = useState<string>("")
  const previewMedia = usePreviewMedia()

  const handleImagePreview = useCallback(() => {
    if (imageUrl) {
      previewMedia([{ url: imageUrl, type: "photo" }])
    }
  }, [imageUrl, previewMedia])

  useEffect(() => {
    if (!shouldRender) return

    let mounted = true

    const renderDiagram = async () => {
      if (!code.trim()) return

      try {
        setIsLoading(true)
        setError(null)

        // Dynamic import to avoid loading Mermaid on the main thread
        const mermaid = await import("mermaid").then((m) => m.default)

        // Initialize mermaid with better spacing configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose", // Allow HTML in diagrams
          fontFamily: "system-ui, sans-serif",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            nodeSpacing: 50,
            rankSpacing: 80,
            padding: 20,
          },
          themeVariables: {
            primaryColor: "#f0f0f0",
            primaryTextColor: "#333",
            primaryBorderColor: "#ccc",
            lineColor: "#666",
            background: "#fff",
            secondaryColor: "#f9f9f9",
            tertiaryColor: "#fafafa",
          },
        })

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

        if (!mounted) return

        // Render the diagram
        const { svg } = await mermaid.render(id, code)

        if (!mounted) return

        if (containerRef.current) {
          containerRef.current.innerHTML = svg

          // Apply theme-aware styling to the SVG with better spacing
          const svgElement = containerRef.current.querySelector("svg")
          if (svgElement) {
            svgElement.style.maxWidth = "100%"
            svgElement.style.height = "auto"
            svgElement.style.minHeight = "200px"
            svgElement.setAttribute("class", "dark:invert-[0.87] dark:hue-rotate-180")

            // Add padding and spacing styles
            svgElement.style.padding = "20px"

            // Adjust node spacing through CSS
            const style = document.createElement("style")
            style.textContent = `
                .node {
                  margin: 10px !important;
                }
                .edgeLabel {
                  background-color: rgba(255, 255, 255, 0.8) !important;
                  padding: 4px 8px !important;
                  border-radius: 4px !important;
                }
                .cluster rect {
                  fill: rgba(0, 0, 0, 0.05) !important;
                  stroke: rgba(0, 0, 0, 0.2) !important;
                  stroke-width: 1px !important;
                }
              `
            svgElement.append(style)
          }
        }

        try {
          const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
          const url = URL.createObjectURL(blob)

          if (mounted) {
            setImageUrl(url)
          }
        } catch (imgErr) {
          console.warn("Failed to convert SVG to image:", imgErr)
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render diagram")
          setIsLoading(false)
        }
      }
    }
    renderDiagram()
    return () => {
      mounted = false
    }
  }, [code, shouldRender])

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}
      >
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <i className="i-mgc-warning-cute-re size-4" />
          <span>Failed to render Mermaid diagram</span>
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-red-500 dark:text-red-400">
            Show error details
          </summary>
          <pre className="mt-1 whitespace-pre-wrap text-xs text-red-600 dark:text-red-300">
            {error}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className={cn("bg-background relative my-4 overflow-auto rounded-lg border", className)}>
      {!isLoading && !error && imageUrl && (
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-text-secondary text-xs">Mermaid Diagram</span>
          <button
            type="button"
            onClick={handleImagePreview}
            className="hover:bg-fill-secondary flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
            title="Preview diagram"
          >
            <i className="i-mgc-pic-cute-fi size-3" />
            <span>Preview</span>
          </button>
        </div>
      )}

      <div className="flex justify-center p-6">
        {isLoading && (
          <div className="text-text-secondary flex items-center gap-2 text-sm">
            <span>Rendering diagram...</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full text-center [&_svg]:mx-auto"
          style={{ display: isLoading ? "none" : "block" }}
        />
      </div>
    </div>
  )
})

MermaidDiagram.displayName = "MermaidDiagram"
