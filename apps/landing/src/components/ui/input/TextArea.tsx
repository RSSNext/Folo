'use client'

// Tremor Textarea [v1.0.0]
import * as React from 'react'

import { useInputComposition } from '~/hooks/common/use-input-composition'
import { cx, focusInput, hasErrorInput } from '~/lib/cn'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

const Textarea = ({
  ref: forwardedRef,
  className,
  hasError,
  ...props
}: TextareaProps & { ref?: React.RefObject<HTMLTextAreaElement | null> }) => {
  const inputProps = useInputComposition<HTMLTextAreaElement>(props)
  return (
    <textarea
      ref={forwardedRef}
      className={cx(
        // base
        'flex min-h-[4rem] w-full rounded-md border px-3 py-1.5 shadow-xs outline-hidden transition-colors sm:text-sm',
        // text color
        'text-text',
        // border color
        'border-border',
        // background color
        'bg-background',
        // placeholder color
        'placeholder:text-placeholder-text',
        // disabled
        'disabled:border-border disabled:bg-disabled-control disabled:text-disabled-text',
        // focus
        focusInput,
        // error
        hasError ? hasErrorInput : '',
        // invalid (optional)
        // "dark:aria-invalid:ring-red-400/20 aria-invalid:ring-2 aria-invalid:ring-red-200 aria-invalid:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
        className,
      )}
      tremor-id="tremor-raw"
      {...props}
      {...inputProps}
    />
  )
}

Textarea.displayName = 'Textarea'

export { Textarea, type TextareaProps }
