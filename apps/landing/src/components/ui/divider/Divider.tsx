import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react'
import * as React from 'react'

import { clsxm } from '~/lib/helper'

export const Divider: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLHRElement>, HTMLHRElement>
> = (props) => {
  const { className, ...rest } = props
  return (
    <hr
      className={clsxm(
        'bg-always-black dark:bg-always-white my-4 h-[0.5px] border-0 !bg-opacity-30',
        className,
      )}
      {...rest}
    />
  )
}

export const DividerVertical: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
> = (props) => {
  const { className, ...rest } = props
  return (
    <span
      className={clsxm(
        'bg-always-black dark:bg-always-white mx-4 inline-block h-full w-[0.5px] select-none !bg-opacity-30 text-transparent',
        className,
      )}
      {...rest}
    >
      w
    </span>
  )
}
