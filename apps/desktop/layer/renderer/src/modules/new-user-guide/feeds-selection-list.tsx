import { decode } from "@byjohann/toon"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@follow/components/ui/card/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import type { PrimitiveAtom } from "jotai"
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useMemo, useRef } from "react"

import { useI18n } from "~/hooks/common"

import { AISplineLoader } from "../ai-chat/components/3d-models/AISplineLoader"
import { useMessages } from "../ai-chat/store/hooks"
import { SearchResultContent } from "../discover/DiscoverFeedCard"
import { FeedIcon } from "../feed/feed-icon"
import type { FeedSelection } from "./store"
import { feedSelectionAtomsAtom, selectedFeedSelectionAtomsAtom } from "./store"

type FeedToSelect = Omit<FeedSelection, "selected">

export function FeedsSelectionList() {
  const chatMessages = useMessages()

  const hasFeedsSelection = chatMessages.some((msg) =>
    msg.parts.some((p) => p.type === "tool-onboardingGetTrendingFeeds" && p.output),
  )

  return (
    <div className="col-span-4 h-full overflow-hidden">
      <AnimatePresence mode="popLayout">
        {hasFeedsSelection ? <FeedSelectionOperationScreen /> : <FeedSelectionFirstScreen />}
      </AnimatePresence>
    </div>
  )
}

function FeedSelectionOperationScreen() {
  const chatMessages = useMessages()

  const feedsToSelect: FeedToSelect[] = useMemo(() => {
    // find the last message that has the tool
    const output = chatMessages
      .findLast((m) => m.parts?.some((p) => p.type === "tool-onboardingGetTrendingFeeds"))
      ?.parts?.findLast((p) => p.type === "tool-onboardingGetTrendingFeeds")?.output

    return typeof output === "string" ? (decode(output) as any[]) : []
  }, [chatMessages])

  const store = useStore()
  const atomList = useAtomValue(feedSelectionAtomsAtom)
  const dispatch = useSetAtom(feedSelectionAtomsAtom)

  const lastKeyRef = useRef<string | null>(null)

  const outputKey = useMemo(() => {
    const ids = Array.from(new Set(feedsToSelect.map((f) => String(f.id))))
    ids.sort()
    return ids.join("|")
  }, [feedsToSelect])

  const existingIds = useMemo(
    () => new Set(atomList.map((a) => String(store.get(a).id))),
    [atomList, store],
  )

  useEffect(() => {
    if (lastKeyRef.current === outputKey) return
    lastKeyRef.current = outputKey

    const seen = new Set(existingIds)

    for (const feed of feedsToSelect) {
      const id = String(feed.id)
      if (seen.has(id)) continue
      seen.add(id)

      dispatch({
        type: "insert",
        value: { ...feed, selected: true },
      })
    }
  }, [dispatch, feedsToSelect, existingIds, outputKey])

  const selectedAtoms = useAtomValue(selectedFeedSelectionAtomsAtom)
  const items = useMemo(
    () => selectedAtoms.map((atom) => ({ atom, id: store.get(atom).id })),
    [selectedAtoms, store],
  )

  return (
    <ScrollArea flex rootClassName="h-full" viewportClassName="px-3 flex min-h-0 grow">
      <div className="flex flex-col gap-5 py-5">
        <AnimatePresence mode="popLayout">
          {items.map(({ atom, id }) => (
            <m.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <FeedSelectionItem feedAtom={atom} />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  )
}

function FeedSelectionItem({ feedAtom }: { feedAtom: PrimitiveAtom<FeedSelection> }) {
  const [feed, setFeed] = useAtom(feedAtom)

  const onRemove = () => {
    setFeed((prev) => ({
      ...prev,
      selected: false,
    }))
  }

  return (
    <div className="relative mr-4">
      {/* remove button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <i
            onClick={onRemove}
            className="i-mingcute-minus-circle-fill absolute right-0 top-0 z-10 size-5 -translate-y-1/2 translate-x-1/2 cursor-pointer text-text-secondary transition-colors hover:text-text"
          />
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>

      <Card
        data-feed-id={feed.id}
        className={cn(
          "flex-shrink-0 select-text overflow-hidden border border-zinc-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/50 dark:bg-neutral-800/50",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1">
            <FeedIcon
              size={32}
              target={{ type: "feed", ...feed }}
              siteUrl={feed.url}
              fallbackUrl={feed.image ?? undefined}
              fallback
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-text">{feed.title}</p>
              <p className="text-xs text-text-secondary">{feed.url}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="text-sm text-text-secondary">
            {feed.description}
          </CardDescription>

          <div className="pointer-events-none mt-5 grid grid-cols-4 gap-2">
            {feed.entries?.map((entry) => (
              <SearchResultContent key={entry.id} entry={entry as any} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeedSelectionFirstScreen() {
  const t = useI18n()

  return (
    <m.div
      className="relative mr-4 h-full overflow-hidden rounded-3xl border border-zinc-200/50 bg-material-thin p-8 backdrop-blur-xl dark:border-zinc-800/50"
      aria-hidden="true"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Grid background - consistent with app patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        {/* Icon - using app's existing icon library */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: "spring" }}
          className="mb-6"
        >
          <div className="mx-auto mb-4 flex items-center justify-center">
            <AISplineLoader />
          </div>
        </m.div>

        {/* Title - using app's gradient text pattern */}
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="mb-4"
        >
          <h1 className="bg-gradient-to-r from-zinc-800 to-zinc-600 bg-clip-text text-4xl font-bold text-transparent dark:from-zinc-100 dark:to-zinc-300">
            {t.app("new_user_guide.intro.title")}
          </h1>
        </m.div>

        {/* Description text */}
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="mb-8 max-w-sm"
        >
          <p className="text-lg leading-relaxed text-text-secondary">
            {t.app("new_user_guide.intro.description")}
          </p>
        </m.div>
      </div>
    </m.div>
  )
}
