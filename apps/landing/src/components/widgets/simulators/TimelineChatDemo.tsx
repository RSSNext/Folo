'use client'
import { ListChatPlayer } from './components/chat/ListChatPlayer'
import { TIMELINE_SUMMARY_STEPS } from './mocks'

const INITIAL_HEADER_TITLE = 'Folo AI - Timeline Summary'

export const TimelineChatDemo = () => {
  return (
    <ListChatPlayer
      steps={TIMELINE_SUMMARY_STEPS}
      initialTitle={INITIAL_HEADER_TITLE}
      rootClassName="size-full flex flex-col bg-background"
      scrollRootClassName="h-0 grow"
      scrollViewportClassName="px-3 min-w-0"
      showChatPanelRightDownload
    />
  )
}
