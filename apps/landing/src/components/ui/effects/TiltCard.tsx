'use client'

import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import * as React from 'react'

type TiltCardProps = React.PropsWithChildren<{
  className?: string
  intensity?: number // degrees, default 12
  glare?: boolean
}>

/**
 * Glass-friendly 3D tilt container with smooth springs and optional glare.
 * Enhanced visual feedback with more pronounced tilt and glare effects.
 */
export function TiltCard({
  className,
  children,
  intensity = 12,
  glare = true,
}: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  // responsive springs with slightly more bounce
  const srx = useSpring(rx, { stiffness: 140, damping: 14, mass: 0.3 })
  const sry = useSpring(ry, { stiffness: 140, damping: 14, mass: 0.3 })

  const rotateX = useTransform(sry, (v) => `${v}deg`)
  const rotateY = useTransform(srx, (v) => `${v}deg`)

  const spotlightX = useSpring(px, { stiffness: 150, damping: 18 })
  const spotlightY = useSpring(py, { stiffness: 150, damping: 18 })

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = (x - cx) / cx
    const dy = (y - cy) / cy
    rx.set(dx * intensity)
    ry.set(-dy * intensity)
    px.set(x)
    py.set(y)
  }

  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <m.div
      ref={ref}
      className={className}
      style={{
        perspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      <m.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="will-change-transform relative rounded-xl"
      >
        {glare ? (
          <>
            {/* Main spotlight effect with brand color */}
            <m.span
              aria-hidden
              className="tilt-spotlight pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-overlay"
              style={{
                // @ts-expect-error CSS variable MotionValues
                '--mx': spotlightX,
                '--my': spotlightY,
                background:
                  'radial-gradient(300px 300px at calc(var(--mx) * 1px) calc(var(--my) * 1px), color-mix(in oklab,var(--color-accent),transparent 80%), transparent 40%)',
              }}
            />
            {/* Secondary white glow */}
            <m.span
              aria-hidden
              className="tilt-spotlight pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
              style={{
                // @ts-expect-error CSS variable MotionValues
                '--mx': spotlightX,
                '--my': spotlightY,
                background:
                  'radial-gradient(250px 250px at calc(var(--mx) * 1px) calc(var(--my) * 1px), color-mix(in oklab,var(--color-background),transparent 75%), transparent 45%)',
              }}
            />
          </>
        ) : null}
        {children}
      </m.div>
    </m.div>
  )
}
