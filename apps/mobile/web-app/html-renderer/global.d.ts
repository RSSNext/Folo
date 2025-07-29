import "vite/client"
import "../../../../packages/types/react-global"
import "../../../../packages/types/global"

interface Bridge {
  measure: () => void
  setContentHeight: (height: number) => void
  previewImage: (data: { imageUrls: string[]; index: number }) => void
}

declare global {
  export const bridge: Bridge
}

export {}
