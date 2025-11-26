import { cn } from "@follow/utils"

interface SelectedTextNodeComponentProps {
  text: string
  sourceEntryId?: string
  timestamp?: number
}

export function SelectedTextNodeComponent({ text }: SelectedTextNodeComponentProps) {
  return (
    <span
      className={cn(
        "relative select-none rounded-md border px-2 py-1 text-sm font-medium transition-colors",
        "border-blue/20 bg-blue/10 text-blue",
        "hover:border-blue/30 hover:bg-blue/20",
        "mb-2 flex items-start",
      )}
    >
      <i className="i-mingcute-text-2-line size-4 shrink-0 translate-y-0.5" />
      <span className="ml-2 line-clamp-3 max-w-full whitespace-pre-wrap" title={text}>
        "{text}"
      </span>
    </span>
  )
}
