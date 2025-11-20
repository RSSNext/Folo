import { Spring } from "@follow/components/constants/spring.js"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { copyImageToClipboard } from "~/lib/clipboard"
import { UrlBuilder } from "~/lib/url-builder"

import { GlassButton } from "./GlassButton"

type SharePosterModalProps = {
  selectedText: string
  entryId: string
}

type Mode = "light" | "dark"

export function SharePosterModal({ selectedText, entryId }: SharePosterModalProps) {
  const { t } = useTranslation()
  const { dismiss } = useCurrentModal()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCopying, setIsCopying] = useState(false)
  const [authorAvatarImg, setAuthorAvatarImg] = useState<HTMLImageElement | null>(null)
  const [mode, setMode] = useState<Mode>(
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  )

  const entry = useEntry(entryId, (state) => ({
    title: state.title,
    feedId: state.feedId,
    author: state.author,
    authorAvatar: state.authorAvatar,
    publishedAt: state.publishedAt,
    url: state.url,
  }))

  const feed = useFeedById(entry?.feedId)

  // Load author avatar image
  useEffect(() => {
    if (entry?.authorAvatar) {
      loadImage(entry.authorAvatar).then(setAuthorAvatarImg)
    } else {
      setAuthorAvatarImg(null)
    }
  }, [entry?.authorAvatar])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", {
      alpha: false, // Better performance for opaque backgrounds
      desynchronized: false, // Better quality
    })
    if (!ctx) return

    // High resolution for crisp text - use higher scale for better quality
    // Scale 3 provides excellent quality for long text
    const scale = 3
    const baseWidth = 720
    const width = baseWidth * scale

    // --- Config ---
    const baseConfig = {
      bg: mode === "dark" ? "#0f0f0f" : "#ffffff",
      bgGradient:
        mode === "dark" ? ["#1a1a1a", "#0f0f0f", "#0a0a0a"] : ["#fafafa", "#ffffff", "#f5f5f5"],
      text: mode === "dark" ? "#f5f5f5" : "#1a1a1a",
      textSecondary: mode === "dark" ? "#a3a3a3" : "#525252",
      accent: mode === "dark" ? "#737373" : "#737373",
      quoteColor: mode === "dark" ? "#404040" : "#e5e5e5",
      logoColor: mode === "dark" ? "#ff5c00" : "#ff5c00",
      fontFamilyTitle: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontFamilyBody: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      fontFamilyMeta: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      sizeTitle: 36,
      sizeBody: 26,
      sizeMeta: 14,
      lineHeight: 1.7,
      titleLineHeight: 1.4,
      maxBodyLines: 18, // Limit body text to 18 lines
    }

    const config = {
      ...baseConfig,
      fontTitle: `600 ${baseConfig.sizeTitle}px ${baseConfig.fontFamilyTitle}`,
      fontBody: `400 ${baseConfig.sizeBody}px ${baseConfig.fontFamilyBody}`,
      fontMeta: `500 ${baseConfig.sizeMeta}px ${baseConfig.fontFamilyMeta}`,
    }

    // --- Measure Height ---
    const padding = 56
    const contentWidth = width / scale - padding * 2

    // Measure Body - with truncation
    ctx.font = config.fontBody
    const allBodyLines = wrapText(ctx, selectedText, contentWidth)
    const bodyLines = allBodyLines.slice(0, config.maxBodyLines)
    const bodyHeight = bodyLines.length * (baseConfig.sizeBody * config.lineHeight)

    // Measure Title
    let titleHeight = 0
    if (entry?.title) {
      ctx.font = config.fontTitle
      const titleLines = wrapText(ctx, entry.title, contentWidth)
      titleHeight = titleLines.length * (baseConfig.sizeTitle * config.titleLineHeight) + 24 // + margin
    }

    // Total Height Calculation
    const headerHeight = 72
    const authorHeight = entry?.author ? 48 : 0 // Increased for avatar
    const footerHeight = 80 // Increased for logo
    const spacing = 48
    const quoteSpacing = 32

    const totalContentHeight =
      padding +
      headerHeight +
      quoteSpacing +
      bodyHeight +
      spacing +
      titleHeight +
      authorHeight +
      footerHeight +
      padding
    const minHeight = 800
    const finalHeight = Math.max(minHeight, totalContentHeight) * scale

    // Resize canvas
    canvas.width = width
    canvas.height = finalHeight

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Scale context for high DPI rendering
    ctx.scale(scale, scale)

    const w = width / scale
    const h = finalHeight / scale

    // --- Background with Gradient ---
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    const bgColors = config.bgGradient
    gradient.addColorStop(0, bgColors[0] ?? config.bg)
    gradient.addColorStop(0.5, bgColors[1] ?? config.bg)
    gradient.addColorStop(1, bgColors[2] ?? config.bg)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Subtle texture overlay
    ctx.save()
    ctx.globalAlpha = 0.03
    for (let i = 0; i < w; i += 4) {
      for (let j = 0; j < h; j += 4) {
        if ((i + j) % 8 === 0) {
          ctx.fillStyle = mode === "dark" ? "#ffffff" : "#000000"
          ctx.fillRect(i, j, 1, 1)
        }
      }
    }
    ctx.restore()

    // --- Layout Drawing ---
    let currentY = padding + 24

    // 1. Header (Feed Info)
    ctx.fillStyle = config.textSecondary
    ctx.globalAlpha = 0.7
    ctx.font = config.fontMeta
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    const dateStr = entry?.publishedAt
      ? new Date(entry.publishedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : new Date().toLocaleDateString()

    const headerText = `${feed?.title || "Folo"}  •  ${dateStr}`
    ctx.fillText(headerText, padding, currentY)

    currentY += headerHeight

    // 2. Quote Body with improved styling
    ctx.save()

    // Decorative Quote Mark - larger and more refined
    ctx.fillStyle = config.quoteColor
    ctx.globalAlpha = 0.4
    ctx.font = "bold 64px Georgia, serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText("\u201C", padding - 36, currentY - 24)

    ctx.restore()

    // Body text with better spacing
    ctx.fillStyle = config.text
    ctx.globalAlpha = 1
    ctx.font = config.fontBody
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    bodyLines.forEach((line, index) => {
      // Add slight indentation for continuation lines
      const indent = index === 0 ? 0 : 24
      ctx.fillText(line, padding + indent, currentY)
      currentY += baseConfig.sizeBody * config.lineHeight
    })

    // Show truncation indicator if text was truncated
    if (allBodyLines.length > config.maxBodyLines) {
      currentY += 8
      ctx.fillStyle = config.textSecondary
      ctx.globalAlpha = 0.6
      ctx.font = config.fontMeta
      ctx.fillText("...", padding, currentY)
      ctx.globalAlpha = 1
    }

    currentY += spacing

    // 3. Divider line
    ctx.save()
    ctx.strokeStyle = config.quoteColor
    ctx.globalAlpha = 0.2
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, currentY - spacing / 2)
    ctx.lineTo(w - padding, currentY - spacing / 2)
    ctx.stroke()
    ctx.restore()

    // 4. Entry Title & Author
    if (entry?.title) {
      currentY += 8
      ctx.fillStyle = config.text
      ctx.globalAlpha = 0.9
      ctx.font = config.fontTitle
      const titleLines = wrapText(ctx, entry.title, contentWidth)
      titleLines.forEach((line) => {
        ctx.fillText(line, padding, currentY)
        currentY += baseConfig.sizeTitle * config.titleLineHeight
      })
    }

    if (entry?.author) {
      currentY += 16

      // Draw author avatar if available
      const avatarSize = 32
      const avatarX = padding
      const avatarY = currentY

      if (authorAvatarImg) {
        // Draw circular avatar
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(authorAvatarImg, avatarX, avatarY, avatarSize, avatarSize)
        ctx.restore()
      }

      // Draw author name
      ctx.fillStyle = config.textSecondary
      ctx.globalAlpha = 0.8
      ctx.font = config.fontMeta
      const authorTextX = authorAvatarImg ? padding + avatarSize + 12 : padding
      ctx.fillText(`By ${entry.author}`, authorTextX, avatarY + avatarSize / 2 - 7)
      ctx.globalAlpha = 1
    }

    // 5. Footer / Branding - Draw Folo logo and text
    const footerY = h - padding - 24
    const logoSize = 36
    const gap = 16
    const svgScale = logoSize / 24

    // Calculate positions for [Logo] [Folo] aligned to right
    // Total width = logoSize + gap + logoSize (assuming folo text is also 24x24 scaled)
    const totalWidth = logoSize + gap + logoSize
    const startX = w - padding - totalWidth

    const logoX = startX
    const foloX = startX + logoSize + gap
    const drawY = footerY - logoSize / 2

    ctx.save()

    // Draw Logo
    ctx.translate(logoX, drawY)
    ctx.scale(svgScale, svgScale)

    // Logo Background
    ctx.fillStyle = config.logoColor
    const logoBgPath = new Path2D(
      "M5.382 0h13.236A5.37 5.37 0 0 1 24 5.383v13.235A5.37 5.37 0 0 1 18.618 24H5.382A5.37 5.37 0 0 1 0 18.618V5.383A5.37 5.37 0 0 1 5.382.001Z",
    )
    ctx.fill(logoBgPath)

    // Logo F
    ctx.fillStyle = "#ffffff"
    const logoFPath = new Path2D(
      "M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z",
    )
    ctx.fill(logoFPath)

    ctx.restore()

    // Draw Folo Text
    ctx.save()
    ctx.translate(foloX, drawY)
    ctx.scale(svgScale, svgScale)

    ctx.fillStyle = config.textSecondary
    ctx.globalAlpha = 0.6
    const foloPath = new Path2D(
      "M.899 16.997c-.567 0-.899-.358-.899-.994v-7.77c0-.637.36-.996 1.01-.996h4.34c.595 0 .927.29.927.788 0 .497-.332.774-.926.774H1.797v2.336H5.06c.595 0 .927.263.927.76 0 .512-.332.775-.927.775H1.797v3.332c0 .636-.318.996-.898.996m9.035.125c-2.101 0-3.553-1.52-3.553-3.664 0-2.17 1.438-3.705 3.553-3.705 2.13 0 3.567 1.534 3.567 3.705 0 2.143-1.452 3.664-3.567 3.664m0-1.493c1.134 0 1.825-.899 1.825-2.185 0-1.3-.691-2.198-1.825-2.198s-1.797.899-1.797 2.198c0 1.286.663 2.185 1.797 2.185m5.266 1.367c-.553 0-.857-.359-.857-.967V7.845c0-.608.304-.968.857-.968s.857.36.857.968v8.185c0 .608-.29.967-.857.967m5.234.125c-2.102 0-3.553-1.52-3.553-3.664 0-2.17 1.438-3.705 3.553-3.705 2.129 0 3.566 1.534 3.566 3.704 0 2.143-1.452 3.664-3.567 3.664m0-1.493c1.134 0 1.825-.899 1.825-2.185 0-1.3-.691-2.198-1.825-2.198s-1.797.899-1.797 2.198c0 1.286.663 2.185 1.797 2.185",
    )
    ctx.fill(foloPath)

    ctx.restore()
  }, [entry, feed, mode, selectedText, authorAvatarImg])

  useEffect(() => {
    draw()
  }, [draw])

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current || isCopying) return

    setIsCopying(true)
    try {
      await copyImageToClipboard(canvasRef.current)
      toast.success(t("entry_content.selection_toolbar.poster_copied"))
      dismiss()
    } catch (error) {
      console.error("Failed to copy image:", error)
      toast.error(t("entry_content.selection_toolbar.poster_copy_failed"))
    } finally {
      setIsCopying(false)
    }
  }, [isCopying, t, dismiss])

  const handleShareToX = useCallback(() => {
    if (!entry) return
    const text = selectedText.length > 200 ? `${selectedText.slice(0, 200)}...` : selectedText
    const shareUrl = UrlBuilder.shareEntry(entryId)
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(intentUrl, "_blank")
  }, [entry, selectedText, entryId])

  return (
    <div className="container center size-full" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex flex-col items-center justify-center gap-6">
        {/* Preview Card */}
        <m.div
          layout
          className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={Spring.presets.smooth}
        >
          <canvas ref={canvasRef} className="size-auto max-h-[65vh] max-w-[90vw] object-contain" />
        </m.div>

        {/* Floating Toolbar - Glassmorphic Design */}
        <m.div
          className={cn(
            "relative flex items-center gap-3 rounded-full border p-2 backdrop-blur-2xl",
            "text-text",
          )}
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, rgba(var(--color-background) / 0.95), rgba(var(--color-background) / 0.9))",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "hsl(var(--fo-a) / 0.2)",
            boxShadow:
              "0 8px 32px hsl(var(--fo-a) / 0.08), 0 4px 16px hsl(var(--fo-a) / 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ ...Spring.presets.smooth, delay: 0.1 }}
        >
          {/* Inner glow layer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.05), transparent, hsl(var(--fo-a) / 0.05))",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Mode Toggle - Glassmorphic Button */}
            <m.button
              type="button"
              onClick={() => setMode(mode === "light" ? "dark" : "light")}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-full",
                "text-text-secondary transition-all duration-300",
                "hover:bg-fill/20 hover:text-text",
              )}
              whileTap={{ scale: 0.95 }}
              title="Toggle Appearance"
            >
              <span
                className={
                  mode === "light"
                    ? "i-mingcute-sun-line text-base"
                    : "i-mingcute-moon-line text-base"
                }
              />
            </m.button>

            {/* Share to X */}
            <m.button
              type="button"
              onClick={handleShareToX}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-full",
                "text-text-secondary transition-all duration-300",
                "hover:bg-fill/20 hover:text-text",
              )}
              whileTap={{ scale: 0.95 }}
              title="Share to X"
            >
              <span className="i-mgc-social-x-cute-li text-base" />
            </m.button>

            {/* Divider */}
            <div className="h-4 w-px bg-accent/20" />

            {/* Actions */}
            <div className="flex items-center gap-2 pl-1">
              <GlassButton variant="secondary" onClick={() => dismiss()}>
                {t("words.close", { ns: "common" })}
              </GlassButton>
              <GlassButton onClick={handleCopy} isLoading={isCopying}>
                {isCopying ? (
                  <span className="i-mingcute-loading-line relative z-10 animate-spin" />
                ) : (
                  <span className="i-mingcute-copy-line relative z-10" />
                )}
                <span className="relative z-10">
                  {isCopying
                    ? t("entry_content.selection_toolbar.copying")
                    : t("entry_content.selection_toolbar.copy_image")}
                </span>
              </GlassButton>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  )
}

// Helper function to load image from URL
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []

  // Check if text contains Chinese/Japanese/Korean characters
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text)

  if (hasCJK) {
    // For CJK text, split by character and build lines
    let currentLine = ""

    for (const char of text) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  } else {
    // For non-CJK text, split by words
    const words = text.split(/\s+/)
    let currentLine = words[0] || ""

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      if (!word) continue
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines.length > 0 ? lines : [text]
}
