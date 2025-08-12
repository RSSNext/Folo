import type { FC } from "react"

import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"

import { CurrentFeedEntriesPickerList, FeedPickerList, RecentEntriesPickerList } from "../pickers"

export const ContextMenuContent: FC = () => {
  const blockActions = useChatBlockActions()

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
    </DropdownMenuContent>
  )
}
