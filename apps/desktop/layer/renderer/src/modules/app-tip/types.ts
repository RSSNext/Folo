export type AppTipDebugOpenEventDetail = {
  step?: number
  openAiGuide?: boolean
}

export type AppTipStepMedia = {
  src?: string
  poster?: string
  caption?: string
}

export type AppTipStep = {
  id: string
  title: string
  description: string
  highlights: string[]
  media?: AppTipStepMedia
  primaryActionLabel: string
  onPrimaryAction: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}
