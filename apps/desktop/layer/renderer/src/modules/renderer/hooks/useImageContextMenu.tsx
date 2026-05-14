import { useEventCallback } from "usehooks-ts"

import type { MarkdownRenderActions } from "../../../components/ui/markdown/types"

export const useImageContextMenu = (
  entryUrl?: Nullable<string>,
): NonNullable<MarkdownRenderActions["onImageContextMenu"]> => {
  void entryUrl

  return useEventCallback(() => {
    // Keep Chromium's native image context menu. Electron appends custom media actions in main.
  })
}
