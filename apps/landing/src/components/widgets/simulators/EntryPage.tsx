'use client'
import { useInView } from 'motion/react'
import * as React from 'react'

import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'

import { EntryPageOverlay } from './components/EntryPageOverlay'
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
        rootClassName="relative h-full @container"
        viewportClassName="px-8 py-12 lg:pl-16 lg:pr-[390px]"
      >
        <div className="flex min-h-[640px] items-center">
          <div className="group relative block w-full max-w-[860px] min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full border border-border/70 bg-white p-1">
                    <img
                      src={ENTRY_DETAIL.source.icon}
                      alt={ENTRY_DETAIL.source.name}
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {ENTRY_DETAIL.source.name}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {ENTRY_DETAIL.source.host}
                </span>
              </div>

              <h2 className="inline-block select-text wrap-break-word text-[2.1rem] font-bold leading-tight">
                <span className="text-text inline-block select-text hyphens-auto">
                  {ENTRY_DETAIL.title}
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <i className="i-mgc-user-3-cute-re text-base" />
                    <span className="text-xs font-medium">
                      {ENTRY_DETAIL.author.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <i className="i-mgc-tag-3-cute-re text-base" />
                    <span className="text-xs font-medium">
                      {ENTRY_DETAIL.author.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <i className="i-mgc-calendar-time-add-cute-re text-base" />
                    <span className="text-xs tabular-nums">
                      {ENTRY_DETAIL.author.dateLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <i className="i-mgc-time-cute-re text-base" />
                    <span className="text-xs tabular-nums">
                      {ENTRY_DETAIL.author.readingTime}
                    </span>
                  </div>
                </div>
              </div>

              <EntryContentPreview />
            </div>
          </div>
        </div>
      </ScrollArea>
      <EntryChatPanel playTimeline={isInView} />
    </div>
  )
}

const bodyParagraphs = [
  'The newest generation of agent tooling is forcing teams to think less about prompts in isolation and more about end-to-end system design.',
  'Once a model can search, call tools, draft structured work, or trigger external actions, reliability becomes a product question rather than a model benchmark question.',
]

const sectionBlocks = [
  {
    title: 'What teams are optimizing for',
    paragraphs: [
      'Accuracy still matters, but operational quality is now the real differentiator: predictable tool use, bounded retries, and evaluation sets that mirror production traffic.',
      'Many failures that look like model mistakes are really interface mistakes: vague tool descriptions, missing state, or workflows that ask one agent to do too much in a single step.',
    ],
  },
]

const checklistItems = [
  'Start with one narrow task and one or two tools.',
  'Log every tool call, retry, and failure reason.',
  'Add evals before widening the workflow.',
  'Keep a human in the loop for risky actions.',
]

const EntryContentPreview = () => {
  return (
    <div className="mt-5 space-y-5">
      <div className="space-y-4 text-[15px] leading-8 text-text-secondary">
        {bodyParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {sectionBlocks.map((section) => (
        <section key={section.title} className="space-y-3">
          <h3 className="text-xl font-semibold tracking-tight text-text">
            {section.title}
          </h3>
          <div className="space-y-4 text-[15px] leading-8 text-text-secondary">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      <blockquote className="border-l-2 border-accent pl-4 text-[15px] leading-8 text-text-secondary">
        “The most dependable agent products are the ones that expose their
        workflow clearly enough for teams to inspect, test, and intervene.”
      </blockquote>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight text-text">
          Operating checklist
        </h3>
        <ul className="space-y-3 text-[15px] leading-8 text-text-secondary">
          {checklistItems.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-[13px] size-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
