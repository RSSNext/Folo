import * as React from "react"

interface LinearBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  strength?: number
  steps?: number
  falloffPercentage?: number
  tint?: string
  side?: "left" | "right" | "top" | "bottom"
}

const oppositeSide = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
}

export function LinearBlur({
  strength = 64,
  steps = 8,
  falloffPercentage = 100,
  tint = "transparent",
  side = "top",
  ...props
}: LinearBlurProps) {
  const actualSteps = Math.max(1, steps)
  const step = falloffPercentage / actualSteps

  const factor = 0.5

  const base = Math.pow(strength / factor, 1 / (actualSteps - 1))

  const mainPercentage = 100 - falloffPercentage

  const getBackdropFilter = (i: number) => `blur(${factor * base ** (actualSteps - i - 1)}px)`

  return (
    <div
      {...props}
      style={{
        // This has to be set on the top level element to prevent pointer events
        pointerEvents: "none",
        transformOrigin: side,
        ...props.style,
      }}
    >
      <div className="absolute z-0 size-full">
        {/* Full blur at 100-falloffPercentage% */}
        {actualSteps > 1 && (
          <div
            className="absolute inset-0 z-[2]"
            style={{
              mask: `linear-gradient(to ${oppositeSide[side]}, rgba(0, 0, 0, 1) ${mainPercentage}%, rgba(0, 0, 0, 1) ${mainPercentage + step}%, rgba(0, 0, 0, 0) ${mainPercentage + step * 2}%)`,
              backdropFilter: getBackdropFilter(1),
              WebkitBackdropFilter: getBackdropFilter(1),
            }}
          />
        )}
        {actualSteps > 2 &&
          Array.from({ length: actualSteps - 2 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                zIndex: i + 2,

                mask: `linear-gradient(to ${oppositeSide[side]},rgba(0, 0, 0, 0) ${mainPercentage + i * step}%,rgba(0, 0, 0, 1) ${mainPercentage + (i + 1) * step}%,rgba(0, 0, 0, 1) ${mainPercentage + (i + 2) * step}%,rgba(0, 0, 0, 0) ${mainPercentage + (i + 3) * step}%)`,
                backdropFilter: getBackdropFilter(i + 2),
                WebkitBackdropFilter: getBackdropFilter(i + 2),
              }}
            />
          ))}
        <div
          className="absolute -top-full left-0 size-full"
          style={{ boxShadow: `0 0 60px ${tint}, 0 0 100px ${tint}` }}
        />
      </div>
    </div>
  )
}
