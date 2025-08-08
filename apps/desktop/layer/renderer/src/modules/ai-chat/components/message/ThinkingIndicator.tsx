import { m } from "motion/react"

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex w-24 items-center">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative inline-block"
      >
        <span className="from-text-tertiary via-text to-text-tertiary animate-[shimmer_5s_linear_infinite] bg-gradient-to-r bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent">
          Thinking...
        </span>
      </m.div>
    </div>
  )
}
