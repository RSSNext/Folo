import { DateTimePicker } from "@follow/components/ui/input/index.js"
import dayjs from "dayjs"
import type { FC } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { RELATIVE_DATE_DEFINITIONS } from "~/modules/ai-chat/editor/plugins/mention/hooks/dateMentionConfig"
import { formatRangeValue } from "~/modules/ai-chat/editor/plugins/mention/hooks/dateMentionUtils"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"

import { CurrentFeedEntriesPickerList, FeedPickerList, RecentEntriesPickerList } from "../pickers"

export const ContextMenuContent: FC = () => {
  const blockActions = useChatBlockActions()
  const { t } = useTranslation("ai")
  const today = dayjs().startOf("day")

  return (
    <DropdownMenuContent align="start">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <i className="i-mgc-paper-cute-fi mr-1.5 size-4" />
          Current Feed Entries
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <CurrentFeedEntriesPickerList
            onSelect={(entryId) =>
              blockActions.addBlock({
                type: "referEntry",
                value: entryId,
              })
            }
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <i className="i-mgc-paper-cute-fi mr-1.5 size-4" />
          Reference Entry
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <RecentEntriesPickerList
            onSelect={(entryId) =>
              blockActions.addBlock({
                type: "referEntry",
                value: entryId,
              })
            }
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <i className="i-mgc-rss-cute-fi mr-1.5 size-4" />
          Reference Feed
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <FeedPickerList
            onSelect={(feedId) =>
              blockActions.addBlock({
                type: "referFeed",
                value: feedId,
              })
            }
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* Reference Date */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <i className="i-mgc-calendar-time-add-cute-re mr-1.5 size-4" />
          Reference Date
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64">
          {/* Presets based on RELATIVE_DATE_DEFINITIONS */}
          {RELATIVE_DATE_DEFINITIONS.map((def) => {
            const range = def.range(today)
            if (!range) return null
            const label = t(def.labelKey)
            const value = formatRangeValue(range)
            return (
              <DropdownMenuItem
                key={def.id}
                className="text-xs"
                onClick={() => blockActions.addBlock({ type: "referDate", value })}
              >
                {String(label)}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Custom range (opens a small inline range picker) */}
          <CustomRangePicker
            onConfirm={(value) => blockActions.addBlock({ type: "referDate", value })}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  )
}

function CustomRangePicker({ onConfirm }: { onConfirm: (value: string) => void }) {
  const [range, setRange] = useState<{ start?: string; end?: string }>({})
  const buildValue = (): string | null => {
    if (!range.start || !range.end) return null
    return formatRangeValue({
      start: dayjs(range.start).startOf("day"),
      end: dayjs(range.end).startOf("day"),
    })
  }

  return (
    <div className="space-y-2 p-1">
      <div className="text-text-secondary px-1 text-xs">Custom range</div>
      <DateTimePicker
        mode="range"
        rangeValue={range}
        onRangeChange={(next) => setRange(next)}
        rangePlaceholder="Select range"
        contentClassName="z-[999]"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="bg-material-opaque hover:bg-fill-tertiary text-text-secondary hover:text-text rounded px-2 py-1 text-xs"
          onClick={() => setRange({})}
        >
          Clear
        </button>
        <button
          type="button"
          className="bg-accent hover:bg-accent/90 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
          disabled={!range.start || !range.end}
          onClick={() => {
            const value = buildValue()
            if (value) onConfirm(value)
          }}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
