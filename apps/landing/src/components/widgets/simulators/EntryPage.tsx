'use client'
import { useInView } from 'motion/react'
import * as React from 'react'

import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'

import { EntryPageOverlay } from './components/EntryPageOverlay'
import { SimulatorReaders } from './components/SimulatorReaders'
import { EntryChatPanel } from './EntryChatPanel'
import { ENTRY_DETAIL } from './mocks'

export const EntryPageDemo = () => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, {
    once: true,
    margin: '-20% 0px',
  })

  return (
    <div ref={containerRef} className="relative size-full">
      <EntryPageOverlay />
      <ScrollArea
        data-simulator="entry-page"
        rootClassName="relative @container"
        viewportClassName="max-w-3xl mx-auto py-12"
      >
        <h2 className="inline-block select-text wrap-break-word text-2xl font-bold leading-normal">
          <span className="text-text inline-block select-text hyphens-auto">
            Categorize Your Dependencies
          </span>

          {/* Meta bar */}
        </h2>

        <div className="text-text-secondary flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center text-xs font-medium gap-2">
            <img
              src={ENTRY_DETAIL.author.avatar}
              className="object-cover rounded-sm mr-2 size-4"
            />
            {ENTRY_DETAIL.author.name}
          </div>
          <div className="flex items-center gap-1.5">
            <i className="i-mingcute-user-3-line size-4" />
            <span className="text-xs font-medium">
              {/* hi@antfu.me (Anthony Fu) */}
              {ENTRY_DETAIL.author.email} ({ENTRY_DETAIL.author.name})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <i className="i-mingcute-calendar-time-add-line size-4" />
            <span className="text-xs tabular-nums">
              {ENTRY_DETAIL.author.date}
            </span>
          </div>
        </div>

        <SimulatorReaders />
        <EntryContentSkeleton />
      </ScrollArea>
      <EntryChatPanel playTimeline={isInView} />
    </div>
  )
}

const EntryContentSkeleton = () => {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-36 h-6 rounded-md bg-material-medium" />

      <div className="h-6" />

      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-full h-6 rounded-md bg-material-medium" />
      <div className="w-24 h-6 rounded-md bg-material-medium" />
    </div>
  )
}
