import { IN_ELECTRON } from "@follow/shared/constants"
import { useEffect, useRef } from "react"

const titleTemplate = IN_ELECTRON ? `%s` : `%s | ${APP_NAME}`

export const useTitle = (title?: string | null) => {
  const currentTitleRef = useRef(document.title)
  useEffect(() => {
    if (!title) return

    document.title = titleTemplate.replace("%s", title)
    return () => {
      document.title = currentTitleRef.current
    }
  }, [title])
}
