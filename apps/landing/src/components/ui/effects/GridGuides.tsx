import * as React from 'react'

type GridGuidesProps = React.PropsWithChildren<{
  className?: string
  /** Show horizontal baseline guides, default: true on md+ */
  showRows?: boolean
  /** Number of columns for vertical guides (desktop). Default 12 */
  cols?: number
}>

/**
 * Subtle design guide lines overlay for sections.
 * Uses background gradients for vertical (columns) and horizontal (baseline) guides.
 * Non-interactive; fades toward edges via mask-image.
 */
export function GridGuides({
  className,
  showRows,
  cols = 12,
}: GridGuidesProps) {
  // Tailwind arbitrary values for background-size require constants at build time.
  // We keep `cols` configurable for potential future extension, but today use 12.
  const colSize = `calc(100%/${cols}) 100%`
  const rowSize = `100% 24px`

  return (
    <div
      aria-hidden
      className={[
        'pointer-events-none absolute inset-0 -z-10 hidden lg:block',
        'opacity-30 md:opacity-40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--color-border, hsl(0 0% 100% / 0.12)) 1px, transparent 1px),\
linear-gradient(to bottom, var(--color-border, hsl(0 0% 100% / 0.12)) 1px, transparent 1px)',
        backgroundSize: `${colSize}, ${showRows !== false ? rowSize : '0 0'}`,
        backgroundPosition: '0 0, 0 0',
        maskImage:
          'radial-gradient(60% 60% at 50% 40%, black 55%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(60% 60% at 50% 40%, black 55%, transparent 100%)',
      }}
    />
  )
}

GridGuides.displayName = 'GridGuides'
