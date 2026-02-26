// Tremor Label [v0.0.2]

import { Label as LabelPrimitives } from 'radix-ui'
import * as React from 'react'
import { tv } from 'tailwind-variants'

interface LabelProps extends React.ComponentPropsWithoutRef<
  typeof LabelPrimitives.Root
> {
  disabled?: boolean

  variant?: 'form' | 'default'
}

const styles = tv({
  base: 'text-sm leading-none text-text',
  variants: {
    variant: {
      form: 'text-sm leading-none text-text pl-2.5 pb-1 block',
      default: 'text-sm leading-none text-text',
    },
    disabled: {
      true: 'text-disabled-text',
    },
  },
})

const Label = ({
  ref: forwardedRef,
  className,
  disabled,
  variant = 'default',
  ...props
}: LabelProps & {
  ref?: React.RefObject<React.ElementRef<typeof LabelPrimitives.Root> | null>
}) => (
  <LabelPrimitives.Root
    ref={forwardedRef}
    className={styles({ variant, disabled, className })}
    aria-disabled={disabled}
    tremor-id="tremor-raw"
    {...props}
  />
)

Label.displayName = 'Label'

export { Label }
