import clsx from 'clsx'
import * as React from 'react'

import { CollapseCss, CollapseCssGroup } from '~/components/ui/collapse'
import { JsonHighlighter } from '~/components/ui/json-highlighter'

interface ToolInvocationComponentProps {
  toolName: string
  input: string
  output: string

  variant: 'loose' | 'tight'
}

export const ToolInvocationComponent: React.FC<ToolInvocationComponentProps> =
  React.memo(({ toolName, input, output, variant }) => {
    const id = React.useId()
    const hasArgs = !!input
    const hasResult = !!output
    return (
      <div
        className={clsx(
          'relative pl-8 last:pb-0',
          variant === 'tight' ? 'pb-0' : 'pb-3',
        )}
      >
        <div
          aria-hidden
          className={`border-fill bg-fill absolute left-2 top-2 size-2 -translate-x-1/2 rounded-full border`}
        >
          <i
            className={`i-mingcute-tool-line absolute top-1/2 -translate-x-1/4 -translate-y-1/2`}
          />
        </div>

        <CollapseCssGroup>
          <CollapseCss
            collapseId={id}
            hideArrow
            className="group/collapse border-none"
            title={
              <div className="group/tool flex h-6 min-w-0 flex-1 items-center py-0">
                <div className="text-text-secondary flex items-center gap-2 text-xs">
                  <span>{'Tool Called:'}</span>
                  <span className={`truncate font-medium text-text`}>
                    {toolName}
                  </span>
                </div>
                <div className="ml-2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/tool:opacity-100">
                  <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/collapse:rotate-90" />
                </div>
              </div>
            }
            contentClassName="pb-0 pt-2 min-w-0"
          >
            <div className="space-y-2 text-xs">
              {/* Show tool arguments if available */}
              {hasArgs ? (
                <div>
                  <div className="text-text-secondary mb-1 font-medium">
                    Arguments:
                  </div>
                  <JsonHighlighter
                    className="text-text-tertiary bg-fill-secondary overflow-x-auto w-[330px] rounded p-2 text-[11px]"
                    json={JSON.stringify(input, null, 2)}
                  />
                </div>
              ) : null}

              {/* Show tool result if available */}
              {hasResult ? (
                <div>
                  <div className="text-text-secondary mb-1 font-medium">
                    Result:
                  </div>
                  <JsonHighlighter
                    className="text-text-tertiary bg-fill-secondary overflow-x-auto w-[330px] rounded p-2 text-[11px]"
                    json={JSON.stringify(output, null, 2)}
                  />
                </div>
              ) : null}
            </div>
          </CollapseCss>
        </CollapseCssGroup>
      </div>
    )
  })
