import type { CSSProperties } from "react"

export const tooltipStyle = {
  content: [
    "relative z-[101] px-2 py-1 text-text",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
    "rounded-lg text-sm backdrop-blur-2xl",
    "max-w-[75ch] select-text",
    "border border-solid",
  ],
}

export const tooltipStyles: {
  container: CSSProperties
  innerGlow: CSSProperties
  arrow: CSSProperties
} = {
  container: {
    backgroundImage:
      "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
    borderColor: "hsl(var(--fo-a) / 0.2)",
    boxShadow:
      "0 4px 16px hsl(var(--fo-a) / 0.08), 0 2px 8px hsl(var(--fo-a) / 0.06), 0 1px 4px rgba(0, 0, 0, 0.1)",
  },
  innerGlow: {
    background:
      "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.01), transparent, hsl(var(--fo-a) / 0.01))",
  },
  arrow: {
    fill: "hsl(var(--fo-a) / 0.2)",
  },
}
