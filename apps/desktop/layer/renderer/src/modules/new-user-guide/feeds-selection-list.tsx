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

import { useMessages } from "../ai-chat/store/hooks"
import { SearchResultContent } from "../discover/DiscoverFeedCard"
import { FeedIcon } from "../feed/feed-icon"
import type { FeedSelection } from "./store"
import { feedSelectionAtomsAtom, selectedFeedSelectionAtomsAtom } from "./store"

type FeedToSelect = Omit<FeedSelection, "selected">

export function FeedsSelectionList() {
  const chatMessages = useMessages()

  const hasFeedsSelection = chatMessages.some((msg) =>
    // @ts-expect-error TODO: fix this after version published
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

  const feedsToSelect: FeedToSelect[] = useMemo(
    () =>
      // find the last message that has the tool
      chatMessages
        .findLast((m) =>
          // @ts-expect-error TODO: fix this after version published
          m.parts?.some((p) => p.type === "tool-onboardingGetTrendingFeeds"),
        )
        // @ts-expect-error TODO: fix this after version published
        ?.parts?.findLast((p) => p.type === "tool-onboardingGetTrendingFeeds")?.output ?? [],
    [chatMessages],
  )

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
            className="i-mingcute-minus-circle-fill text-text-secondary hover:text-text absolute right-0 top-0 z-10 size-5 -translate-y-1/2 translate-x-1/2 cursor-pointer transition-colors"
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
              <p className="text-text text-sm font-semibold">{feed.title}</p>
              <p className="text-text-secondary text-xs">{feed.url}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="text-text-secondary text-sm">
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
      className="relative mr-4 h-full overflow-hidden rounded-3xl bg-[#FF5C02] p-5"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h1 className="relative z-[1] text-[6rem] font-semibold leading-[6rem] text-white">
        {t.app("new_user_guide.intro.title")}
      </h1>

      {/* some shapes */}
      <div className="absolute left-10 top-10 z-0 h-40 w-[30rem] rounded-full bg-[#FF792E]" />
      <div className="absolute left-80 top-64 z-0 h-40 w-[30rem] rounded-full bg-[#FF792E]" />
      <div className="absolute left-12 top-[30rem] z-0 h-40 w-[30rem] rounded-full bg-[#FF792E]" />

      {/* screenshot image */}
      <div className="absolute -bottom-12 -left-36 z-[1] h-[30rem] w-[40rem] rotate-[-25deg] rounded-3xl border border-white">
        {/* TODO: add image here */}
      </div>
    </m.div>
  )
}
