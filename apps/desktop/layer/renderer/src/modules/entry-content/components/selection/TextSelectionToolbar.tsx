import { Spring } from "@follow/components/constants/spring.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import type { CSSProperties, MouseEventHandler } from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { copyToClipboard } from "~/lib/clipboard"
import type { TextSelectionEvent } from "~/lib/simple-text-selection"

const styles = {
  toolbar: {
    backgroundImage:
      "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
    boxShadow:
      "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06), 0 4px 16px hsl(var(--fo-a) / 0.08), 0 2px 8px hsl(var(--fo-a) / 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
  } as CSSProperties,
  innerGlow: {
    background:
      "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.02), transparent, hsl(var(--fo-a) / 0.02))",
  } as CSSProperties,
}

type TextSelectionToolbarProps = {
  selection: TextSelectionEvent | null
  onRequestClose: () => void
  onAskAI?: (selection: TextSelectionEvent) => void
}

const DEFAULT_DIMENSIONS = {
  width: 220,
  height: 48,
}

const VIEWPORT_PADDING = 12

export function TextSelectionToolbar({
  selection,
  onRequestClose,
  onAskAI,
}: TextSelectionToolbarProps) {
  const { t } = useTranslation()
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [toolbarSize, setToolbarSize] = useState(DEFAULT_DIMENSIONS)
  const [copied, setCopied] = useState(false)
  const [viewport, setViewport] = useState(() => getViewport())

  useEffect(() => {
    const handleResize = () => setViewport(getViewport())
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    if (!selection) return

    const handleScroll = () => onRequestClose()
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [selection, onRequestClose])

  useLayoutEffect(() => {
    if (!selection || !toolbarRef.current) return
    const rect = toolbarRef.current.getBoundingClientRect()
    setToolbarSize({
      width: rect.width || DEFAULT_DIMENSIONS.width,
      height: rect.height || DEFAULT_DIMENSIONS.height,
    })
  }, [selection, copied])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const position = useMemo(() => {
    if (!selection) return null
    const { rect } = selection
    const toolbarHeight = toolbarSize.height || DEFAULT_DIMENSIONS.height
    const toolbarWidth = toolbarSize.width || DEFAULT_DIMENSIONS.width
    const viewportWidth = viewport.width || toolbarWidth

    let top = rect.top - toolbarHeight - VIEWPORT_PADDING
    if (top < VIEWPORT_PADDING) {
      top = rect.bottom + VIEWPORT_PADDING
    }

    let left = rect.left + rect.width / 2 - toolbarWidth / 2
    const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - toolbarWidth - VIEWPORT_PADDING)
    left = clamp(left, VIEWPORT_PADDING, maxLeft)

    return { top, left }
  }, [selection, toolbarSize, viewport])

  const handleCopy = useCallback(async () => {
    if (!selection) return
    await copyToClipboard(selection.selectedText)
    setCopied(true)
  }, [selection])

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
  }

  if (!selection || !position) return null

  return (
    <RootPortal>
      <m.div
        ref={toolbarRef}
        style={{
          top: position.top,
          left: position.left,
          ...styles.toolbar,
        }}
        className="pointer-events-auto fixed z-[70] rounded-full border border-border/50 bg-material-ultra-thick px-1.5 py-1 backdrop-blur-background"
        onMouseDown={handleMouseDown}
        layout="position"
        initial={{ opacity: 0, y: 4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={Spring.presets.smooth}
      >
        {/* Inner glow layer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={styles.innerGlow}
        />
        <div className="relative flex items-center gap-1 text-[0.85rem] font-medium text-text">
          <ToolbarButton
            iconClassName={copied ? "i-mgc-check-cute-re" : "i-mgc-copy-cute-re"}
            label={
              copied
                ? t("entry_content.selection_toolbar.copied")
                : t("entry_content.selection_toolbar.copy")
            }
            onClick={handleCopy}
            active={copied}
          />
          {onAskAI ? (
            <ToolbarButton
              iconClassName="i-mingcute-sparkles-2-line"
              label={t("entry_content.selection_toolbar.ask_ai")}
              onClick={() => onAskAI(selection)}
            />
          ) : null}
        </div>
      </m.div>
    </RootPortal>
  )
}

type ToolbarButtonProps = {
  iconClassName: string
  label: string
  onClick?: () => void
  active?: boolean
}

function ToolbarButton({ iconClassName, label, onClick, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200",
        active
          ? "bg-fill/80 text-text shadow-sm"
          : "text-text-secondary hover:bg-fill/60 hover:text-text active:scale-95",
      )}
      aria-label={label}
    >
      <i className={cn("text-base", iconClassName)} />
      <span>{label}</span>
    </button>
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function getViewport() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 }
  }

  return { width: window.innerWidth, height: window.innerHeight }
}
