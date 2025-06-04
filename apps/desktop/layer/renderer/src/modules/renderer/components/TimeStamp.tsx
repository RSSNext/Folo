import { nextFrame } from "@follow/utils/dom"
import { formatTimeToSeconds } from "@follow/utils/utils"
import { use } from "react"

import { AudioPlayer } from "~/atoms/player"
import { useEntry } from "~/store/entry"

import { EntryInfoContext } from "../context"

export const TimeStamp = (props: { time: string }) => {
  const { entryId } = use(EntryInfoContext)
  const entry = useEntry(entryId, (state) => {
    const attachments = state.entries.attachments || []
    const firstAttachment = attachments[0]
    const { duration_in_seconds, url: firstAttachmentUrl } = firstAttachment || {}
    const seconds = duration_in_seconds ? (formatTimeToSeconds(duration_in_seconds) ?? 0) : 0

    return {
      firstAttachmentUrl,
      seconds,
    }
  })
  const src = entry?.firstAttachmentUrl
  const mediaDuration = entry?.seconds

  if (!src) return <span>{props.time}</span>

  const seekTo = timeStringToSeconds(props.time)
  if (typeof seekTo !== "number") return <span>{props.time}</span>

  return (
    <span
      className="text-accent cursor-pointer tabular-nums"
      onClick={() => {
        AudioPlayer.mount({
          type: "audio",
          entryId,
          src,
          currentTime: 0,
        })
        nextFrame(() => AudioPlayer.seek(seekTo))
      }}
    >
      {!!mediaDuration && (
        <CircleProgress
          className="mr-1 inline translate-y-px scale-95 align-text-top"
          percent={(seekTo / mediaDuration) * 100}
          size={16}
          strokeWidth={2}
        />
      )}
      {props.time}
    </span>
  )
}

interface CircleProgressProps {
  percent: number
  size?: number
  strokeWidth?: number
  strokeColor?: string
  backgroundColor?: string
  className?: string
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  percent,
  size = 100,
  strokeWidth = 8,
  strokeColor = "hsl(var(--fo-a))",
  backgroundColor = "hsl(var(--fo-inactive))",
  className,
}) => {
  const normalizedPercent = Math.min(100, Math.max(0, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (normalizedPercent / 100) * circumference

  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.3s" }}
      />
    </svg>
  )
}

function timeStringToSeconds(time: string): number | null {
  const timeParts = time.split(":").map(Number)

  if (timeParts.length === 2) {
    const [minutes, seconds] = timeParts
    return minutes! * 60 + seconds!
  } else if (timeParts.length === 3) {
    const [hours, minutes, seconds] = timeParts
    return hours! * 3600 + minutes! * 60 + seconds!
  } else {
    return null
  }
}
