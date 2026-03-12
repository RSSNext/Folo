import * as React from 'react'

import { cn } from '~/lib/cn'

export const PanelSplitter = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & {
    isDragging?: boolean
    cursor?: string

    tooltip?: React.ReactNode
  },
) => {
  const { isDragging, cursor, tooltip, className, ...rest } = props

  React.useEffect(() => {
    if (!isDragging) return
    const $css = document.createElement('style')

    $css.innerHTML = `
      * {
        cursor: ${cursor} !important;
      }
    `

    document.head.append($css)
    return () => {
      $css.remove()
    }
  }, [cursor, isDragging])

  return (
    <div className="relative h-full w-0 shrink-0 z-3" data-hide-in-print>
      <div
        tabIndex={-1}
        {...rest}
        className={cn(
          'active:bg-accent! absolute inset-0 z-3 w-[2px] -translate-x-1/2 cursor-ew-resize bg-transparent hover:bg-gray-400 hover:dark:bg-neutral-500',
          isDragging ? 'bg-accent' : '',
          className,
        )}
      />
    </div>
  )
}
