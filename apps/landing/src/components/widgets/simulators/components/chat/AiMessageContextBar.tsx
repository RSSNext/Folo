import type { UserContext } from '../../mocks'

export const AiMessageContextBar = ({ context }: { context: UserContext }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[calc(100%-1rem)]">
        <div className="min-w-0 max-w-full text-left">
          <div className="inline-flex flex-wrap items-center gap-1.5 pl-2 pr-1">
            <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 border bg-linear-to-r backdrop-blur-sm from-orange/5 to-orange/10 border-orange/20 hover:border-orange/30">
              <div className="flex size-4 shrink-0 items-center justify-center rounded bg-orange/10 text-orange">
                {context.icon}
              </div>
              <div className="flex min-w-0 items-center gap-1">
                {context.current && (
                  <span className={`text-xs font-medium ${context.className}`}>
                    {context.current}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
