import { FeedViewType } from "@follow/constants"
import { useMemo } from "react"
import type { JSX } from "react/jsx-runtime"

import {
  MarkdownImageRecordContext,
  MarkdownRenderActionContext,
} from "~/components/ui/markdown/context"
import type { HTMLProps } from "~/components/ui/markdown/HTML"
import { HTML } from "~/components/ui/markdown/HTML"
import type { MarkdownImage, MarkdownRenderActions } from "~/components/ui/markdown/types"
import { useEntry } from "~/store/entry/hooks"
import { getFeedById } from "~/store/feed"

import { TimeStamp } from "./components/TimeStamp"
import { EntryInfoContext } from "./context"

export function EntryContentHTMLRenderer<AS extends keyof JSX.IntrinsicElements = "div">({
  view,
  feedId,
  entryId,
  children,
  ...props
}: {
  view: FeedViewType
  feedId: string
  entryId: string
  children: Nullable<string>
} & HTMLProps<AS>) {
  const entry = useEntry(entryId, (state) => {
    const images =
      state.entries.media?.reduce(
        (acc, media) => {
          if (media.height && media.width) {
            acc[media.url] = media
          }
          return acc
        },
        {} as Record<string, MarkdownImage>,
      ) ?? {}

    return {
      images,
    }
  })

  const images: Record<string, MarkdownImage> = useMemo(() => entry?.images ?? {}, [entry])
  const actions: MarkdownRenderActions = useMemo(() => {
    return {
      isAudio() {
        return view === FeedViewType.Audios
      },
      transformUrl(url) {
        if (!url || url.startsWith("http")) return url
        const feed = getFeedById(feedId)
        if (!feed) return url
        const feedSiteUrl = "siteUrl" in feed ? feed.siteUrl : undefined

        if (url.startsWith("/") && feedSiteUrl) return safeUrl(url, feedSiteUrl)
        return url
      },
      ensureAndRenderTimeStamp,
    }
  }, [feedId, view])
  return (
    // eslint-disable-next-line @eslint-react/no-context-provider
    <MarkdownImageRecordContext.Provider value={images}>
      <MarkdownRenderActionContext value={actions}>
        <EntryInfoContext value={useMemo(() => ({ feedId, entryId }), [feedId, entryId])}>
          {/*  @ts-expect-error */}
          <HTML {...props}>{children}</HTML>
        </EntryInfoContext>
      </MarkdownRenderActionContext>
    </MarkdownImageRecordContext.Provider>
  )
}

const safeUrl = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

const ensureAndRenderTimeStamp = (children: string) => {
  const firstPart = children.replace(" ", " ").split(" ")[0]
  // 00:00 , 00:00:00
  if (!firstPart) {
    return
  }
  const isTime = isValidTimeString(firstPart.trim())
  if (isTime) {
    return (
      <>
        <TimeStamp time={firstPart} />
        <span>{children.slice(firstPart.length)}</span>
      </>
    )
  }
  return false
}
function isValidTimeString(time: string): boolean {
  const timeRegex = /^\d{1,2}:[0-5]\d(?::[0-5]\d)?$/
  return timeRegex.test(time)
}
