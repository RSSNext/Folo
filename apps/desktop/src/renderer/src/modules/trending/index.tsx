import { isMobile, useMobile } from "@follow/components/hooks/useMobile.js"
import { PhUsersBold } from "@follow/components/icons/users.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { FeedModel, Models, UserModel } from "@follow/models"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { getTrendingAggregates } from "~/api/trending"
import { DrawerModalLayout } from "~/components/ui/modal/stacked/custom-modal"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"

import { usePresentUserProfileModal } from "../profile/hooks"

interface TrendingProps {
  language: string
}
export const TrendingButton = ({ language, className }: TrendingProps & { className?: string }) => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return (
    <Button
      variant={"outline"}
      onClick={() => {
        present({
          title: (
            <div className="flex items-center gap-2">
              <i className="i-mingcute-trending-up-line text-2xl" />
              <span>{t("words.trending")}</span>
            </div>
          ),
          content: () => <TrendContent language={language} />,
          CustomModalComponent: !isMobile() ? DrawerModalLayout : undefined,
        })
      }}
      buttonClassName={cn("rounded px-2 h-8", className)}
    >
      <i className="i-mgc-trending-up-cute-re mr-1" />
      {t("words.trending")}
    </Button>
  )
}
const TrendContent: FC<TrendingProps> = ({ language }) => {
  const isMobile = useMobile()

  const { data } = useQuery({
    queryKey: ["trending", language],
    queryFn: () => {
      return getTrendingAggregates({ language })
    },
  })

  const { t } = useTranslation()
  const { dismiss } = useCurrentModal()
  if (!data)
    return (
      <div className={isMobile ? "mx-auto" : "center absolute inset-0"}>
        <LoadingWithIcon
          icon={<i className="i-mingcute-trending-up-line text-3xl" />}
          size="large"
        />
      </div>
    )
  return (
    <div className="flex size-full grow flex-col gap-4">
      {!isMobile && (
        <div className="-mt-4 flex w-full items-center justify-center gap-2 text-2xl">
          <i className="i-mingcute-trending-up-line text-3xl" />
          <span className="font-bold">{t("words.trending")}</span>
        </div>
      )}
      <ActionButton
        className="absolute right-4 top-4"
        onClick={dismiss}
        tooltip={t("words.close", { ns: "common" })}
      >
        <i className="i-mgc-close-cute-re" />
      </ActionButton>
      <ScrollArea.ScrollArea
        rootClassName="flex h-0 w-[calc(100%+8px)] min-h-[50vh] grow flex-col overflow-visible"
        viewportClassName="pb-4 [&>div]:!block"
        scrollbarClassName="-mr-6"
      >
        <TrendingUsers data={data.trendingUsers} />
        <TrendingLists data={data.trendingLists} />
        <TrendingFeeds data={data.trendingFeeds} />

        <TrendingEntries data={data.trendingEntries} />
      </ScrollArea.ScrollArea>
    </div>
  )
}
const TrendingLists: FC<{
  data: Models.TrendingList[]
}> = ({ data }) => {
  const follow = useFollow()
  const { t } = useTranslation()
  return (
    <section className="mt-8 w-full text-left">
      <h2 className="my-2 text-xl font-bold">{t("trending.list")}</h2>

      <ul className="mt-4 flex flex-col gap-3 pb-4">
        {data.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={"group relative flex w-full min-w-0 items-center pl-2"}
              onClick={() => {
                follow({ isList: true, id: item.id })
              }}
            >
              <div className="group-hover:bg-theme-item-hover absolute -inset-y-1 inset-x-0 z-[-1] rounded-lg duration-200" />
              <FeedIcon feed={item as any} size={40} />

              <div className={cn("ml-1 flex w-full flex-col text-left")}>
                <div className="flex items-end gap-2">
                  <div className={cn("truncate text-base font-medium")}>{item.title}</div>

                  {!!item.subscriberCount && <UserCount count={item.subscriberCount} />}
                </div>
                {!!item.description && (
                  <div className={"line-clamp-2 text-xs"}>{item.description}</div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const UserCount: Component<{ count: number }> = ({ count, className }) => {
  return (
    <span className={cn("flex items-center gap-0.5 text-xs tabular-nums opacity-60", className)}>
      <PhUsersBold className="size-3" />
      <span>{count}</span>
    </span>
  )
}

interface TopUserAvatarProps {
  user: UserModel
  position: string
}

const TopUserAvatar: React.FC<TopUserAvatarProps> = ({ user, position }) => (
  <div className={`absolute ${position} group flex w-[50px] flex-col`}>
    <div className="group-hover:bg-theme-item-hover absolute -inset-x-4 -inset-y-2 rounded-lg duration-200" />
    <Avatar className="border-border ring-background block aspect-square size-[50px] overflow-hidden rounded-full border ring-1">
      <AvatarImage src={user?.image || undefined} />
      <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
    </Avatar>

    {user.name && (
      <EllipsisHorizontalTextWithTooltip className="mt-2 text-xs font-medium">
        <span>{user.name}</span>
      </EllipsisHorizontalTextWithTooltip>
    )}
  </div>
)

const TrendingUsers: FC<{ data: UserModel[] }> = ({ data }) => {
  const profile = usePresentUserProfileModal("dialog")
  const { t } = useTranslation()
  return (
    <section className="w-full text-left">
      <h2 className="my-2 text-xl font-bold">{t("trending.user")}</h2>
      <div className="relative h-[100px]">
        <div className="text-accent absolute left-[calc(50%+15px)] top-[8px] rotate-45 text-[20px]">
          <i className="i-mgc-vip-2-cute-fi" />
        </div>

        <div className="text-accent/80 absolute left-[calc(33%+15px)] top-[calc(theme(spacing.3))] rotate-45 text-[20px]">
          <i className="i-mgc-vip-2-cute-re" />
        </div>

        {data.slice(0, 3).map((user, index: number) => (
          <button
            onFocusCapture={stopPropagation}
            type="button"
            onClick={() => {
              profile(user.id)
            }}
            key={user.id}
          >
            <TopUserAvatar
              user={user}
              position={
                index === 0
                  ? "left-1/2 -translate-x-1/2"
                  : index === 1
                    ? "left-1/3 top-6 -translate-x-1/2"
                    : "left-2/3 top-6 -translate-x-1/2"
              }
            />
          </button>
        ))}
      </div>

      {data.length > 3 && (
        <ul className="mt-8 flex flex-col gap-4 pl-2">
          {data.slice(3).map((user) => (
            <li key={user.id}>
              <button
                onFocusCapture={stopPropagation}
                className="group relative flex w-full items-center gap-3"
                type="button"
                onClick={() => {
                  profile(user.id)
                }}
              >
                <div className="group-hover:bg-theme-item-hover absolute -inset-2 right-0 z-[-1] rounded-lg duration-200" />
                <Avatar className="border-border ring-background block aspect-square size-[40px] overflow-hidden rounded-full border ring-1">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const TrendingFeeds = ({ data }: { data: FeedModel[] }) => {
  const follow = useFollow()
  const { t } = useTranslation()
  return (
    <section className="mt-8 w-full text-left">
      <h2 className="my-2 text-xl font-bold">{t("trending.feed")}</h2>

      <ul className="mt-2 flex flex-col">
        {data.map((feed) => {
          return (
            <li
              className={cn(
                "hover:bg-theme-item-hover group flex w-full items-center gap-1 rounded-md py-0.5 pl-2 duration-200",
                "relative",
              )}
              key={feed.id}
            >
              <a
                target="_blank"
                href={UrlBuilder.shareFeed(feed.id)}
                className="flex grow items-center gap-1 py-1"
              >
                <FeedIcon feed={feed} size={24} className="rounded" />

                <div className="flex w-full min-w-0 grow items-center">
                  <div className={"truncate"}>{feed.title}</div>
                </div>
              </a>

              <div className="pr-2">
                <UserCount
                  className="-mr-2 group-hover:opacity-0"
                  count={(feed as any).subscriberCount}
                />

                <Button
                  type="button"
                  buttonClassName={
                    "absolute inset-y-0.5 right-0 font-medium opacity-0 duration-200 group-hover:opacity-100"
                  }
                  onClick={() => {
                    follow({ isList: false, id: feed.id })
                  }}
                >
                  {t("feed_form.follow")}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const TrendingEntries = ({ data }: { data: Models.TrendingEntry[] }) => {
  const { t } = useTranslation()
  const filteredData = data.filter((entry) => !entry.url.startsWith("https://x.com"))
  return (
    <section className="mt-8 w-full text-left">
      <h2 className="my-2 text-xl font-bold">{t("trending.entry")}</h2>

      {filteredData.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {filteredData.map((entry) => {
            return (
              <li
                key={entry.id}
                className="marker:text-accent relative grid w-full grid-cols-[1fr_auto] gap-2 whitespace-nowrap py-0.5"
              >
                <div className="m-0 min-w-0 truncate p-0">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="follow-link--underline truncate text-sm"
                  >
                    {entry.title}
                  </a>
                </div>
                <span className="flex items-center gap-0.5 text-xs tabular-nums opacity-60">
                  <i className="i-mingcute-book-2-line" />
                  <span>{entry.readCount}</span>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-2 text-center text-sm opacity-80">{t("trending.entry_no_results")}</div>
      )}
    </section>
  )
}
