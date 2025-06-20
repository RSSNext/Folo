import { useChat } from "@ai-sdk/react"
import { env } from "@follow/shared/env.desktop"
import type { FC, PropsWithChildren } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import { AIChatContext } from "./__internal__/AIChatContext"

export const AIChatRoot: FC<PropsWithChildren> = (props) => {
  const ctx = useChat({
    api: `${env.VITE_API_URL}/ai/chat`,
    onError: (error) => {
      console.warn(error)
    },
    credentials: "include",
  })

  return (
    <Focusable scope={HotkeyScope.AIChat} className="size-full">
      <AIChatContext value={ctx}>{props.children}</AIChatContext>
    </Focusable>
  )
}
