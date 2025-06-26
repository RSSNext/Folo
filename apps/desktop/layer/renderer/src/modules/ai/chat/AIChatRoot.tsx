import { useChat } from "@ai-sdk/react"
import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
import { env } from "@follow/shared/env.desktop"
import type { FC, PropsWithChildren } from "react"
import { useEffect, useMemo, useRef } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import type { AIPanelRefs } from "./__internal__/AIChatContext"
import { AIChatContext, AIPanelRefsContext } from "./__internal__/AIChatContext"

export const AIChatRoot: FC<PropsWithChildren> = (props) => {
  const ctx = useChat({
    api: `${env.VITE_API_URL}/ai/chat`,
    onError: (error) => {
      console.warn(error)
    },
    credentials: "include",
  })

  const panelRef = useRef<HTMLDivElement>(null!)
  const inputRef = useRef<HTMLTextAreaElement>(null!)
  const refsContext = useMemo<AIPanelRefs>(() => ({ panelRef, inputRef }), [panelRef, inputRef])

  const hasScope = useGlobalFocusableHasScope(HotkeyScope.AIChat)

  useEffect(() => {
    if (hasScope && inputRef.current) {
      inputRef.current.focus()
    }
  }, [hasScope])
  return (
    <Focusable scope={HotkeyScope.AIChat} className="size-full">
      <AIChatContext value={ctx}>
        <AIPanelRefsContext value={refsContext}>{props.children}</AIPanelRefsContext>
      </AIChatContext>
    </Focusable>
  )
}
