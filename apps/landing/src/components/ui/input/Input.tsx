'use client'

// Tremor Input [v2.0.0]
import * as React from 'react'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

import { useInputComposition } from '~/hooks/common/use-input-composition'
import { clsxm, focusInput, focusRing, hasErrorInput } from '~/lib/cn'

const inputStyles = tv({
  base: [
    // base
    'relative block w-full appearance-none border shadow-xs outline-hidden transition rounded-full',
    // electron
    'no-drag-region',
    // border color
    'border-border',
    // text color
    'text-text',
    // placeholder color
    'placeholder:text-placeholder-text',
    // background color (slightly translucent for glass feel)
    'bg-background/80 backdrop-blur',
    // disabled
    'disabled:border-border disabled:bg-disabled-control disabled:text-disabled-text',

    // file
    [
      'file:cursor-pointer file:rounded-l-[999px] file:rounded-r-none file:border-0 file:px-3 file:outline-hidden focus:outline-hidden disabled:pointer-events-none file:disabled:pointer-events-none',
      'file:border-solid file:border-border file:bg-fill file:text-placeholder-text file:hover:bg-fill-secondary',
      'file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem]',
      'file:disabled:bg-disabled-control file:disabled:text-disabled-text',
    ],
    // focus
    focusInput,
    // invalid (optional)
    'aria-invalid:ring-2 aria-invalid:ring-red/20 aria-invalid:border-red invalid:ring-2 invalid:ring-red/20 invalid:border-red',
    // remove search cancel button (optional)
    '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
    // number input
    enableStepper: {
      false:
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
    },
    size: {
      sm: [
        'px-4 py-1.5 text-sm rounded-full',
        'file:-my-1.5 file:-ml-4 file:py-1.5',
      ],
      md: [
        'px-3 text-sm rounded-full h-10',
        'file:-my-2 file:-ml-2.5 file:py-2',
      ],
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputStyles> {
  inputClassName?: string
  /**
   * Optional node to render at the end (right side) of the input.
   * Useful for inline actions like Save/Clear.
   */
  endAdornment?: React.ReactNode
  /**
   * Visibility strategy for endAdornment.
   * - 'focus': show only when input is focused (default)
   * - 'always': always visible
   */
  endAdornmentVisibility?: 'focus' | 'always'
}

const Input = ({
  ref: forwardedRef,
  className,
  inputClassName,
  hasError,
  enableStepper = true,
  size = 'md',
  type,
  endAdornment,
  endAdornmentVisibility = 'focus',
  onFocus,
  onBlur,
  disabled,
  style,
  ...props
}: InputProps & { ref?: React.RefObject<HTMLInputElement | null> }) => {
  const [typeState, setTypeState] = React.useState(type)
  const [focused, setFocused] = React.useState(false)

  const isPassword = type === 'password'
  const isSearch = type === 'search'
  const inputProps = useInputComposition(props)

  const showEndAdornment =
    Boolean(endAdornment) &&
    !disabled &&
    (endAdornmentVisibility === 'always' || focused)

  const rightControlsRef = React.useRef<HTMLDivElement | null>(null)
  const [rightControlsWidth, setRightControlsWidth] = React.useState(0)

  React.useEffect(() => {
    if (!(isPassword || showEndAdornment)) {
      setRightControlsWidth(0)
    }
  }, [isPassword, showEndAdornment])

  React.useLayoutEffect(() => {
    if (!rightControlsRef.current) return

    const node = rightControlsRef.current

    const updateWidth = () => {
      const { width } = node.getBoundingClientRect()
      setRightControlsWidth(width)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [isPassword, showEndAdornment])

  const computedStyle = React.useMemo(() => {
    if (rightControlsWidth > 0) {
      const padding = rightControlsWidth + 8
      const paddingValue = `${padding}px`
      if (
        style &&
        Object.prototype.hasOwnProperty.call(style, 'paddingRight')
      ) {
        return style
      }
      return { ...style, paddingRight: paddingValue }
    }
    return style
  }, [style, rightControlsWidth])

  return (
    <div className={clsxm('relative w-full', className)} tremor-id="tremor-raw">
      <input
        ref={forwardedRef}
        type={isPassword ? typeState : type}
        className={clsxm(
          inputStyles({ hasError, enableStepper, size }),
          {
            'pl-8': isSearch,
          },
          inputClassName,
        )}
        disabled={disabled}
        style={computedStyle}
        {...props}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        {...inputProps}
      />
      {isSearch && (
        <div
          className={clsxm(
            // base
            'pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center',
            // text color
            'text-placeholder-text',
          )}
        >
          <i
            className="i-mingcute-search-line size-[1.125rem] shrink-0"
            aria-hidden="true"
          />
        </div>
      )}

      {(isPassword || showEndAdornment) && (
        <div
          className={clsxm(
            'absolute inset-y-0 right-0 flex items-center gap-1 px-2',
          )}
          ref={rightControlsRef}
        >
          {/* Inline actions / custom adornment */}
          {showEndAdornment ? (
            <div className="pointer-events-auto flex items-center gap-1">
              {endAdornment}
            </div>
          ) : null}

          {/* Password visibility toggle */}
          {isPassword && (
            <button
              aria-label="Change password visibility"
              className={clsxm(
                // base
                'flex h-full w-fit items-center rounded-xs outline-hidden transition-all',
                // text
                'text-placeholder-text',
                // hover
                'hover:text-text',
                focusRing,
              )}
              type="button"
              onClick={() => {
                setTypeState(typeState === 'password' ? 'text' : 'password')
              }}
            >
              <span className="sr-only">
                {typeState === 'password' ? 'Show password' : 'Hide password'}
              </span>
              {typeState === 'password' ? (
                <i
                  className="i-mingcute-eye-line size-5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <i
                  className="i-mingcute-eye-close-line size-5 shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

Input.displayName = 'Input'

export { Input, type InputProps }
