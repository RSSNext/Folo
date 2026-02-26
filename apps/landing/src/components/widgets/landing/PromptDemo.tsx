'use client'

import * as React from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

export const PromptDemo: Component = () => {
  const [value, setValue] = React.useState(
    'Summarize this article in 3 key points',
  )
  const [reply, setReply] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleAsk = async () => {
    setLoading(true)
    // Fake response
    await new Promise((r) => setTimeout(r, 600))
    setReply(
      '1) Key idea extracted. 2) Context preserved. 3) Actionable insight surfaced.',
    )
    setLoading(false)
  }

  return (
    <section className="mx-auto mt-14 w-full max-w-[var(--container-max-width-2xl)] px-4">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Ask in context
        </h2>
        <p className="text-text-secondary mt-2">
          Translate, summarize, and ask follow-ups—right inside what you read.
        </p>
      </div>

      <div className="border-border bg-material-medium/60 mx-auto mt-6 max-w-3xl rounded-xl border p-3 backdrop-blur-md">
        <div className="border-border bg-background rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1"
            />
            <Button
              onClick={handleAsk}
              isLoading={loading}
              loadingText="Asking…"
            >
              Ask
            </Button>
          </div>
          {reply && (
            <div className="border-border bg-fill text-text-secondary mt-3 rounded-lg border p-3 text-sm">
              {reply}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

PromptDemo.displayName = 'PromptDemo'
