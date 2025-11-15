import { Spring } from "@follow/components/constants/spring.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import * as React from "react"

// Popular RSS reader services
const RSS_READERS = [
  { icon: "i-simple-icons-feedly", name: "Feedly", color: "#2BB24C" },
  { icon: "i-simple-icons-inoreader", name: "Inoreader", color: "#007BC5" },
  { icon: "i-simple-icons-freshrss", name: "FreshRSS", color: "#FF9800" },
]
const seededRandom = (seed: number) => {
  // Mulberry32
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function OpmlAbstractGraphic({ className }: { className?: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const logoRef = React.useRef<HTMLDivElement | null>(null)
  const iconRefs = React.useRef<(HTMLDivElement | null)[]>([])

  const [paths, setPaths] = React.useState<{ d: string; color: string; shadow: string }[]>([])
  const [ready, setReady] = React.useState(false)
  const completedKeysRef = React.useRef<Set<string>>(new Set())

  // Deterministic pseudo-random with seed

  const computePaths = React.useCallback(() => {
    const container = containerRef.current
    const logoEl = logoRef.current
    if (!container || !logoEl) return

    const containerRect = container.getBoundingClientRect()
    const logoRect = logoEl.getBoundingClientRect()

    const endX = logoRect.left - containerRect.left + logoRect.width / 2
    const endY = logoRect.top - containerRect.top + logoRect.height / 2

    const newPaths: { d: string; color: string; shadow: string }[] = []

    iconRefs.current.forEach((el, idx) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const startX = r.left - containerRect.left + r.width / 2
      const startY = r.top - containerRect.top + r.height / 2

      // Generate a slightly wobbly path between start and end
      const dx = endX - startX
      const dy = endY - startY
      const distance = Math.hypot(dx, dy)
      const segments = Math.max(6, Math.min(12, Math.round(distance / 70)))
      const amplitude = Math.min(18, Math.max(6, distance * 0.06))

      // Build points along the straight line and offset them by a seeded noise
      const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }]
      for (let i = 1; i < segments; i++) {
        const t = i / segments
        const baseX = startX + dx * t
        const baseY = startY + dy * t
        // Perpendicular vector
        const px = -dy
        const py = dx
        const plen = Math.hypot(px, py) || 1
        const nx = px / plen
        const ny = py / plen
        // Taper near the ends
        const taper = Math.sin(Math.PI * t)
        const rand = (seededRandom((idx + 1) * 9973 + i * 53) - 0.5) * 2 // [-1, 1]
        const offset = rand * amplitude * taper
        points.push({ x: baseX + nx * offset, y: baseY + ny * offset })
      }
      points.push({ x: endX, y: endY })

      // Convert to a smooth path using quadratic curves
      let d = `M ${points[0]!.x} ${points[0]!.y}`
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i]!
        const p2 = points[i + 1]!
        // Midpoint smoothing
        const cx = p1.x
        const cy = p1.y
        const mx = (p1.x + p2.x) / 2
        const my = (p1.y + p2.y) / 2
        d += ` Q ${cx} ${cy} ${mx} ${my}`
      }

      // Accent shadow color
      const color = RSS_READERS[idx]?.color ?? "#999999"
      const shadow =
        idx === 0
          ? "rgba(43,178,76,0.25)"
          : idx === 1
            ? "rgba(0,123,197,0.25)"
            : "rgba(255,152,0,0.25)"

      newPaths.push({ d, color, shadow })
    })

    setPaths(newPaths)
  }, [])

  // Compute when animations are completed and on resize thereafter
  React.useLayoutEffect(() => {
    if (!ready) return
    // Two rafs to ensure transforms are fully flushed
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        computePaths()
      })
      return () => cancelAnimationFrame(id2)
    })
    return () => cancelAnimationFrame(id)
  }, [ready, computePaths])

  React.useEffect(() => {
    if (!ready) return
    const onResize = () => computePaths()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [ready, computePaths])

  const markAnimationDone = React.useCallback(
    (key: string) => {
      const set = completedKeysRef.current
      if (set.has(key)) return
      set.add(key)
      if (set.size >= RSS_READERS.length + 1) {
        setReady(true)
      }
    },
    [setReady],
  )

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full overflow-hidden bg-material-medium", className)}
    >
      {/* Right side Logo */}
      <m.div
        ref={logoRef}
        className="absolute right-[15%] top-1/2 z-10 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0, x: 50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ ...Spring.presets.smooth, delay: 0.3 }}
        onAnimationComplete={() => markAnimationDone("logo")}
      >
        <div className="relative">
          {/* Logo glow effect */}
          <div
            className="absolute inset-0 -z-10 blur-2xl"
            style={{
              background: "radial-gradient(circle, rgba(255, 92, 0, 0.3) 0%, transparent 70%)",
            }}
          />
          <Logo className="size-20 drop-shadow-lg" />
        </div>
      </m.div>

      {/* Left side RSS Reader Icons in vertical layout */}
      {RSS_READERS.map((reader, index) => {
        const totalReaders = RSS_READERS.length
        const spacing = 70 / (totalReaders + 1) // Distribute vertically within 70% of height
        const yPosition = 15 + spacing * (index + 1) // Start at 15%, space evenly

        return (
          <m.div
            key={reader.name}
            className="absolute left-[15%]"
            style={{
              top: `${yPosition}%`,
            }}
            initial={{ scale: 0, opacity: 0, x: -50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{
              ...Spring.presets.smooth,
              delay: 0.1 + index * 0.08,
            }}
            onAnimationComplete={() => markAnimationDone(`icon-${index}`)}
          >
            {/* Icon container */}
            <div
              ref={(el) => {
                iconRefs.current[index] = el
              }}
              className="relative flex size-12 items-center justify-center rounded-xl backdrop-blur-sm"
              style={{
                backgroundColor: `${reader.color}20`,
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: `${reader.color}40`,
                boxShadow: `0 4px 12px ${reader.color}20`,
              }}
            >
              <i className={cn(reader.icon, "size-6")} style={{ color: reader.color }} />
            </div>
          </m.div>
        )
      })}

      {/* Hand-drawn connector lines */}
      <svg className="pointer-events-none absolute inset-0" width="100%" height="100%">
        <defs>
          {/* Slight wobble via displacement map to enhance sketch feeling (subtle) */}
          <filter id="scribble-wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="0.7" />
          </filter>
        </defs>
        {paths.map((p, index) => {
          // Keep reveal order in sync with icon animations
          const iconDelay = index * 0.08
          const revealDelay = iconDelay + 0.1 // start after icon settles a bit
          return (
            <g key={p.d} filter="url(#scribble-wobble)">
              {/* Underlay shadow to suggest marker bleed */}
              <m.path
                d={p.d}
                fill="none"
                stroke={p.shadow}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={ready ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ ...Spring.presets.smooth, delay: revealDelay }}
              />
              {/* Main line */}
              <m.path
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={ready ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ ...Spring.presets.smooth, delay: revealDelay + 0.05 }}
              />
              {/* A second, lighter stroke with slight dash to mimic hand-drawn */}
              <m.path
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeOpacity={0.7}
                strokeWidth={1.4}
                strokeDasharray="6 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={ready ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ ...Spring.presets.smooth, delay: revealDelay + 0.1 }}
              />
            </g>
          )
        })}
      </svg>

      {/* Ambient background glow on the right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 85% 50%, rgba(255, 92, 0, 0.08) 0%, transparent 50%)",
        }}
      />
    </div>
  )
}
