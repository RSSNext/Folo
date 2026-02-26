import type { UserContext } from '../../mocks'
import { AiMessageContextBar } from './AiMessageContextBar'

export const AiUserMessage = ({
  userMessage,
  context,
}: {
  userMessage?: string
  context?: UserContext
}) => {
  return (
    <div className="relative flex flex-col gap-1">
      {context && <AiMessageContextBar context={context} />}
      <div className="group flex justify-end">
        <div className="text-text relative flex max-w-[calc(100%-1rem)] flex-col gap-2">
          <div className="text-text bg-fill-secondary/50 rounded-2xl px-4 py-2.5">
            <div className="flex select-text flex-col gap-2 text-sm">
              <div className="relative cursor-text text-sm text-text">
                <p className="mb-1 last:mb-0" dir="ltr">
                  {userMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
