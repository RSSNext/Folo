import { Spring } from "@follow/components/constants/spring.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"

// Popular RSS reader services
const RSS_READERS = [
  { icon: "i-simple-icons-feedly", name: "Feedly", color: "#2BB24C" },
  { icon: "i-simple-icons-inoreader", name: "Inoreader", color: "#007BC5" },
  { icon: "i-simple-icons-freshrss", name: "FreshRSS", color: "#FF9800" },
]

export function OpmlAbstractGraphic({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative aspect-square w-full overflow-hidden bg-material-medium", className)}
    >
      {/* Right side Logo */}
      <m.div
        className="absolute right-[15%] top-1/2 z-10 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0, x: 50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ ...Spring.presets.smooth, delay: 0.3 }}
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
          >
            {/* Icon container */}
            <div
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
