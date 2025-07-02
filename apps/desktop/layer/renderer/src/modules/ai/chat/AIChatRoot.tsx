import { useChat } from "@ai-sdk/react"
import { env } from "@follow/shared/env.desktop"
import type { FC, PropsWithChildren } from "react"
import { useMemo, useRef } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import type { AIPanelRefs } from "./__internal__/AIChatContext"
import {
  AIChatContext,
  AIChatContextStoreContext,
  AIPanelRefsContext,
} from "./__internal__/AIChatContext"
import { createAIChatContextStore } from "./__internal__/store"

interface AIChatRootProps extends PropsWithChildren {
  wrapFocusable?: boolean
}

export const AIChatRoot: FC<AIChatRootProps> = ({ children, wrapFocusable = true }) => {
  const useAiContextStore = useMemo(createAIChatContextStore, [])

  const context = useAiContextStore((s) => s.state)

  const ctx = useChat({
    api: `${env.VITE_API_URL}/ai/chat`,
    onError: (error) => {
      console.warn(error)
    },
    credentials: "include",
    body: {
      context,
    },
  })

  const panelRef = useRef<HTMLDivElement>(null!)
  const inputRef = useRef<HTMLTextAreaElement>(null!)
  const refsContext = useMemo<AIPanelRefs>(() => ({ panelRef, inputRef }), [panelRef, inputRef])

  // const hasScope = useGlobalFocusableHasScope(HotkeyScope.AIChat)
  // const autoFocusOnceRef = useRef(false)

  // useEffect(() => {
  //   if (hasScope && inputRef.current && !autoFocusOnceRef.current) {
  //     inputRef.current.focus()
  //     autoFocusOnceRef.current = true
  //   }
  // }, [hasScope])

  // useEffect(() => {
  //   // When page go to background or blur, reset once Ref
  //   const handler = () => {
  //     if (autoFocusOnceRef.current) {
  //       autoFocusOnceRef.current = false
  //     }
  //   }

  //   window.addEventListener("focus", handler)
  //   window.addEventListener("blur", handler)

  //   return () => {
  //     window.removeEventListener("focus", handler)
  //     window.removeEventListener("blur", handler)
  //   }
  // }, [])

  const Element = (
    <AIChatContext value={ctx}>
      <AIPanelRefsContext value={refsContext}>
        <AIChatContextStoreContext value={useAiContextStore}>{children}</AIChatContextStoreContext>
      </AIPanelRefsContext>
    </AIChatContext>
  )

  if (wrapFocusable) {
    return (
      <Focusable scope={HotkeyScope.AIChat} className="size-full">
        {Element}
      </Focusable>
    )
  }
  return Element
}
