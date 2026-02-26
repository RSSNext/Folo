'use client'

import { m } from 'motion/react'
import * as React from 'react'

type ParticlesAuraProps = {
  className?: string
  color?: string // CSS color, default accent
  count?: number // 6-12 reasonable
}

/**
 * Lightweight, decorative particles for CTA aura.
 * Rendered as blurred dots with subtle float animation.
 */
export function ParticlesAura({
  className,
  color = 'var(--color-accent)',
  count = 8,
}: ParticlesAuraProps) {
  const items = React.useMemo(() => Array.from({ length: count }), [count])
  return (
    <div
      className={['pointer-events-none absolute inset-0 -z-10', className].join(
        ' ',
      )}
      aria-hidden
    >
      {items.map((_, i) => {
        const size = 4 + ((i * 17) % 8) // 4-11px
        const left = (i * 137) % 100 // pseudo-random
        const top = (i * 73) % 100
        const delay = (i * 0.22) % 2
        const duration = 2.5 + ((i * 0.37) % 2)
        return (
          <m.span
            key={i}
            className="absolute rounded-full blur-[2px]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              background: color,
              opacity: 0.35,
              filter: 'drop-shadow(0 0 8px rgba(255,92,0,0.45))',
            }}
            initial={{ y: 0, opacity: 0.2 }}
            animate={{ y: -8, opacity: 0.4 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
              duration,
              delay,
            }}
          />
        )
      })}
    </div>
  )
}

export default ParticlesAura
