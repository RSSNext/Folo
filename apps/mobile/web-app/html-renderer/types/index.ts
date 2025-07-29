export interface MediaModel {
  url: string
  type: "photo" | "video"
  preview_image_url?: string
  width?: number
  height?: number
  blurhash?: string
}

export interface EntryModel {
  content?: string
  title?: string
  media?: MediaModel[]
}
