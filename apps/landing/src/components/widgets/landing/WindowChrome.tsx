'use client'
import { useTranslations } from 'next-intl'
import type * as React from 'react'

import { Folo } from '~/components/brand/Folo'

export function WindowChrome({
  children,
  showTryOnWeb = true,
}: {
  children: React.ReactNode
  showTryOnWeb?: boolean
}) {
  const actionsT = useTranslations('common.actions')

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
        <span className="inline-block size-2.5 rounded-full bg-red" />
        <span className="inline-block size-2.5 rounded-full bg-yellow" />
        <span className="inline-block size-2.5 rounded-full bg-green" />
        <div className="ml-3 h-5 flex items-center gap-2">
          {/* <Logo className="size-4" /> */}
          <Folo className="size-5" />
        </div>

        {showTryOnWeb ? (
          <a
            href="https://app.folo.is"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs  pointer-events-auto text-text-secondary cursor-pointer hover:text-text transition-colors"
          >
            {actionsT('tryOnWeb')}
          </a>
        ) : null}
      </div>
      {children}
    </div>
  )
}
