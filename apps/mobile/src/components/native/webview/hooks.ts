import { useEffect } from "react"

import { prepareEntryRenderWebView } from "./index"

export const usePrepareEntryRenderWebView = () => {
  useEffect(() => {
    prepareEntryRenderWebView()
  }, [])
}
