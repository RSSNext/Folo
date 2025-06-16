import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { TextArea } from "@follow/components/ui/input/TextArea.js"
import { Popover, PopoverContent, PopoverTrigger } from "@follow/components/ui/popover/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { cn } from "@follow/utils"
import { PopoverPortal } from "@radix-ui/react-popover"

import { whoami } from "~/atoms/user"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal"
import { useEntry } from "~/store/entry"

import { AIIcon } from "../icon"
import { mockShortcuts } from "../mock-data"

export const AIDialoguePanel = () => {
  const user = whoami()
  const settingModalPresent = useSettingModal()

  return (
    <div className="center relative mx-auto size-full max-w-3xl flex-col gap-8 px-8">
      <Button
        variant="ghost"
        buttonClassName="text-text-secondary absolute right-0 top-8 text-sm font-normal"
        onClick={() => {
          settingModalPresent("ai")
        }}
      >
        Personalize
      </Button>
      <div className="text-text flex flex-row items-center gap-3 text-2xl font-medium">
        <div>
          <AIIcon />
        </div>
        <div>Hi {user?.name}, how may I assist you today?</div>
      </div>
      <AIDialogueInput />
      <div className="w-full pl-5">
        <Popover modal>
          <PopoverTrigger>
            <Button variant="ghost" buttonClassName="text-sm font-normal -ml-3">
              <div className="flex items-center gap-1">
                <i className="i-mgc-question-cute-re" />
                <span>What can I do for you?</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>
              <ul className="flex flex-col gap-3 p-4 text-sm text-gray-500">
                <li className="text-text font-medium">My unread items</li>
                <li>🧠 Organize all unread items into a mind map.</li>
                <li>
                  ✂️ According to my reading habits and interests, reduce unread items to less than
                  100.
                </li>
                <li>🌟 Highlight unread items containing "OpenAI" in their content.</li>
                <Divider className="my-1 w-20" />
                <li className="text-text font-medium">My subscriptions</li>
                <li>🖼️ Summarize my starred items from the past week and make it into a poster.</li>
                <li>📑 Create a timeline of AI-related content.</li>
                <Divider className="my-1 w-20" />
                <li className="text-text font-medium">Everything on Folo</li>
                <li>💡 Generate a list of technology podcasts.</li>
                <li>📊 Compare the crypto market sentiment this week with last week.</li>
                <li>🔍 Which podcasts have recently mentioned OpenAI's o3 model?</li>
              </ul>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      </div>
    </div>
  )
}

export const AIDialogueInput = ({ entryId }: { entryId?: string }) => {
  const entry = useEntry(entryId, (state) => {
    return {
      title: state.entries.title,
    }
  })

  return (
    <div className="flex w-full flex-col gap-2">
      <TextArea
        wrapperClassName="h-28 w-full bg-background/80 backdrop-blur-lg shadow-context-menu"
        placeholder="Describe a task or ask a question"
        rounded="3xl"
        className="px-5"
      >
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between leading-none">
          <div className="flex flex-1 flex-row items-center gap-3 text-sm">
            <Select defaultValue={entry ? "entry" : "unread"}>
              <SelectTrigger className="h-7 w-auto max-w-60 rounded-3xl py-0 [&>span]:truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="mt-2 max-w-60 rounded-xl">
                {!!entry && (
                  <SelectItem
                    className="w-auto rounded-lg pr-6 [&>span]:max-w-full [&>span]:truncate"
                    value="entry"
                  >
                    Current entry: {entry?.title}
                  </SelectItem>
                )}
                <SelectItem className="rounded-lg" value="unread">
                  My unread items
                </SelectItem>
                <SelectItem className="rounded-lg" value="subscriptions">
                  My subscriptions
                </SelectItem>
                <SelectItem className="rounded-lg" value="folo">
                  Everything on Folo
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" buttonClassName="text-text-secondary font-normal shrink-0">
              @ Mention a date or source
            </Button>
          </div>
          <div className="flex flex-row items-center gap-3">
            <i className="i-mgc-mic-cute-re text-xl" />
            <i className="i-mgc-arrow-up-circle-cute-fi text-3xl transition-transform hover:scale-110" />
          </div>
        </div>
      </TextArea>
      <AIDialogueShortcuts className="pl-4" />
    </div>
  )
}

export const AIDialogueShortcuts = ({ className }: { className?: string }) => {
  return (
    <div className={cn("text-text-secondary flex grow gap-1", className)}>
      {mockShortcuts.map((shortcut) => (
        <Button key={shortcut.name} variant="outline" buttonClassName="rounded-full h-7" size="sm">
          {shortcut.name}
        </Button>
      ))}
      <Button variant="outline" buttonClassName="rounded-full" size="sm">
        +
      </Button>
    </div>
  )
}
