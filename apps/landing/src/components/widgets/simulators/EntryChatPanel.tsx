'use client'
import * as React from 'react'

import { ListChatPlayer } from './components/chat/ListChatPlayer'
import { AI_SUMMARY_STEPS } from './mocks'

interface EntryChatPanelProps {
  playTimeline?: boolean
}

export const EntryChatPanel: React.FC<EntryChatPanelProps> = ({
  playTimeline = false,
}) => {
  return (
    <aside className="absolute shadow-2xl z-10 right-0 inset-y-0 flex flex-col w-[calc(100vw-100px)] lg:w-[400px] bg-background border-l">
      <ListChatPlayer
        autoplay={playTimeline}
        steps={AI_SUMMARY_STEPS}
        rootClassName="contents"
        scrollRootClassName="h-0 grow"
        scrollViewportClassName="px-3 min-w-0"
      />
    </aside>
  )
}
