'use client'

// Tremor Button [v0.2.0]
import { Slot as RadixSlot } from 'radix-ui'
import * as React from 'react'
import type { VariantProps } from 'tailwind-variants'
import { tv } from 'tailwind-variants'

import { cx, focusRing } from '~/lib/cn'

const { Slot } = RadixSlot

const buttonVariants = tv({
  base: [
    // base - pill shape, spacing and glass-friendly shadow
    'relative box-content inline-flex pointer-events-auto no-drag-region items-center justify-center whitespace-nowrap rounded-full border text-center font-medium shadow-sm transition-all duration-200 ease-out',
    // disabled
    'disabled:pointer-events-none disabled:shadow-none disabled:text-disabled-text',
    // focus
    focusRing,
  ],
  variants: {
    variant: {
      primary: [
        // border
        '!border-transparent',
        // text color
        'text-accent-foreground',
        // gradient accent
        'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-60)] border-0',

        // hover state
        'hover:brightness-110',
        // active state
        'active:scale-[0.98]',
        // disabled
        'disabled:bg-disabled-control',
      ],
      secondary: [
        // glass button
        'border-border text-text bg-material-medium/60 backdrop-blur',
        // hover / active
        'hover:bg-fill-secondary shadow-none hover:shadow-sm active:bg-fill-tertiary active:scale-[0.98]',
        // disabled
        'disabled:bg-fill disabled:text-disabled-text disabled:border-border disabled:shadow-none',
      ],
      light: [
        // base
        'shadow-none',
        // border
        'border-transparent',
        // text color
        'text-text',
        // background color
        'bg-fill',
        // hover color
        'hover:bg-fill-tertiary hover:shadow-sm',
        // active state
        'active:bg-fill-quaternary active:scale-[0.98]',
        // disabled
        'disabled:bg-fill disabled:text-disabled-text',
      ],
      ghost: [
        // base
        'shadow-none',
        // border
        'border-transparent',
        // text color
        'text-text-secondary',
        // hover color
        'bg-transparent hover:bg-fill/80 hover:text-text',
        // active state
        'active:bg-fill active:scale-[0.98]',
        // disabled
        'disabled:text-disabled-text',
      ],
      destructive: [
        // text color
        'text-background',
        // border
        'border-transparent',
        // background color
        'bg-red',
        // hover color
        'hover:bg-red/90 hover:shadow-md',
        // active state
        'active:bg-red/80 active:scale-[0.98]',
        // disabled
        'disabled:bg-red/50 disabled:text-background/70',
      ],
    },
    size: {
      sm: ['px-4 py-1.5 text-sm rounded-full'],
      md: ['px-4 py-2 text-sm rounded-full'],
      lg: ['px-5 py-2.5 text-base rounded-full'],
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

interface ButtonProps
  extends
    React.ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'light' | 'ghost' | 'destructive'
}

const Button = ({
  ref: forwardedRef,
  asChild,
  isLoading = false,
  loadingText,
  className,
  disabled,
  variant,
  size = 'md',
  children,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      ref={forwardedRef}
      className={cx(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      tremor-id="tremor-raw"
      {...props}
    >
      {isLoading ? (
        <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
          <i
            className="i-mingcute-loading-3-line size-4 shrink-0 animate-spin"
            aria-hidden="true"
          />

          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </Component>
  )
}

Button.displayName = 'Button'

export { Button, type ButtonProps }
