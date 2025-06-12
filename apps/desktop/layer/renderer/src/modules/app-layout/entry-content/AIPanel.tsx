import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { TextArea } from "@follow/components/ui/input/TextArea.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"

import { whoami } from "~/atoms/user"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal"

export const AIPanel = () => {
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
          <div className="bg-accent size-6 animate-pulse rounded-full" />
        </div>
        <div>Hi {user?.name}, how may I assist you today?</div>
      </div>
      <TextArea
        wrapperClassName="h-28 w-full"
        placeholder="Describe a task or ask a question"
        rounded="3xl"
        className="px-5"
      >
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between leading-none">
          <div className="flex flex-1 flex-row items-center gap-3 text-sm">
            <Select defaultValue="unread">
              <SelectTrigger className="h-7 w-auto rounded-3xl py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="mt-2 rounded-xl">
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
            <Button variant="ghost" buttonClassName="text-text-secondary font-normal">
              @ Mention a date or source
            </Button>
          </div>
          <div className="flex flex-row items-center gap-3">
            <i className="i-mgc-mic-cute-re text-xl" />
            <i className="i-mgc-arrow-up-circle-cute-fi text-3xl transition-transform hover:scale-110" />
          </div>
        </div>
      </TextArea>
      <div className="w-full space-y-4 pl-5">
        <ul className="flex flex-col gap-3 text-sm text-gray-500">
          <li className="text-text font-medium">My unread items</li>
          <li>🧠 Organize all unread items into a mind map.</li>
          <li>
            ✂️ According to my reading habits and interests, reduce unread items to less than 100.
          </li>
          <li>🌟 Highlight unread items containing "OpenAI" in their content.</li>
          <Divider className="my-1" />
          <li className="text-text font-medium">My subscriptions</li>
          <li>🖼️ Summarize my starred items from the past week and make it into a poster.</li>
          <li>📑 Create a timeline of AI-related content.</li>
          <Divider className="my-1" />
          <li className="text-text font-medium">Everything on Folo</li>
          <li>📊 Compare the crypto market sentiment this week with last week.</li>
          <li>🔍 Which podcasts have recently mentioned OpenAI's o3 model?</li>
        </ul>
      </div>
    </div>
  )
}
