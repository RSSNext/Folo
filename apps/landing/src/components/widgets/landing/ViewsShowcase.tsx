'use client'

import * as React from 'react'

import { SegmentTab } from '~/components/ui/segment-tab'

type ViewKey = 'list' | 'social' | 'masonry' | 'grid'

const items = [
  { value: 'list', label: 'List' },
  { value: 'social', label: 'Social' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'grid', label: 'Grid' },
] as const satisfies { value: ViewKey; label: string }[]

const ViewContent: React.FC<{ view: ViewKey }> = ({ view }) => {
  switch (view) {
    case 'list': {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-fill-secondary h-14 rounded-lg border"
            />
          ))}
        </div>
      )
    }
    case 'social': {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-fill-secondary rounded-xl border p-3"
            >
              <div className="bg-fill-tertiary mb-2 h-3 w-24 rounded" />
              <div className="bg-fill-tertiary h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )
    }
    case 'masonry': {
      return (
        <div className="columns-2 gap-2 md:columns-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-fill-secondary mb-2 break-inside-avoid rounded-lg border"
              style={{ height: 80 + ((i * 37) % 120) }}
            />
          ))}
        </div>
      )
    }
    case 'grid': {
      return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-fill-secondary aspect-4/3 rounded-lg border"
            />
          ))}
        </div>
      )
    }
  }
}

export const ViewsShowcase: Component = () => {
  const [view, setView] = React.useState<ViewKey>('list')
  return (
    <section
      id="views"
      className="mx-auto mt-28 md:mt-32 lg:mt-40 w-full max-w-max-width-2xl px-4"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          Reading experience reimagined in the AI era
        </h2>
        <p className="text-text-secondary mt-2">
          Views for every signal: List, Social timeline, Masonry, and Grid.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-5xl">
        <SegmentTab
          items={items}
          value={view}
          onChange={(v) => setView(v as ViewKey)}
          containerClassName="mx-auto max-w-md"
        />

        <div className="border-border bg-material-medium/60 mt-4 rounded-xl border p-3 backdrop-blur-md">
          <div className="border-border bg-background rounded-lg border p-3">
            <ViewContent view={view} />
          </div>
        </div>
      </div>
    </section>
  )
}

ViewsShowcase.displayName = 'ViewsShowcase'
