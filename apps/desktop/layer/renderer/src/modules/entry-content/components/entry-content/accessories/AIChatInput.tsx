import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { AIChatInput } from "~/modules/ai/chat/AIChatInput"
import { AIChatRoot } from "~/modules/ai/chat/AIChatRoot"

export const EntryAIChatInput: Component = () => {
  const { entryId } = useRouteParamsSelector((s) => ({
    entryId: s.entryId,
  }))
  return (
    <div className="sticky bottom-0 -mx-10">
      <AIChatRoot>
        <AIChatInput entryId={entryId} autoShrink />
      </AIChatRoot>
    </div>
  )
}
