export type MarkdownImage = {
  url: string
  width?: number | undefined
  height?: number | undefined
  preview_image_url?: string | undefined
  blurhash?: string | undefined
}

export interface MarkdownRenderActions {
  transformUrl: (url?: string) => string | undefined
  isAudio: (url?: string) => boolean
  ensureAndRenderTimeStamp: (children: string) => React.ReactNode
}
