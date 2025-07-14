import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"

const SUPPORTED_MIME_TYPES = new Set(["application/x-bittorrent"])

export function EntryAttachments({ entryId }: { entryId: string }) {
  const attachments = useEntry(entryId, (entry) => entry.attachments)
  if (!attachments || attachments.length === 0) {
    return null
  }
  return (
    <div className="flex gap-2">
      {attachments
        .filter(
          (attachment) => attachment.mime_type && SUPPORTED_MIME_TYPES.has(attachment.mime_type),
        )
        .map((attachment) => (
          <Tooltip key={attachment.url}>
            <TooltipTrigger asChild>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-xl",
                  attachment.mime_type === "application/x-bittorrent" &&
                    "i-simple-icons-bittorrent",
                )}
              />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>{attachment.url}</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        ))}
    </div>
  )
}
