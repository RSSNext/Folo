import { Spring } from "@follow/components/constants/spring.js"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { usePrefetchUser, useUserById, useWhoami } from "@follow/store/user/hooks"
import { getAvatarUrl } from "@follow/utils"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { getStorageNS } from "@follow/utils/ns"
import { cn } from "@follow/utils/utils"
import type { ListWithStats } from "@follow-app/client-sdk"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useAnimationControls } from "motion/react"
import type { FC } from "react"
import { Fragment, memo, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { followClient } from "~/lib/api-client"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"

import { getSocialLink, socialCopyMap, socialIconClassNames } from "./constants"
import type { SubscriptionModalContentProps } from "./shared"
import { SubscriptionItems } from "./shared"

type ItemVariant = "loose" | "compact"
const itemVariantAtom = atomWithStorage(
  getStorageNS("item-variant"),
  "loose" as ItemVariant,
  undefined,
  {
    getOnInit: true,
  },
)

const pickUserData = <
  T extends {
    image?: Nullable<string>
    name?: Nullable<string>
    handle?: Nullable<string>
    id: string
    bio?: Nullable<string>
    website?: Nullable<string>
    socialLinks?: Nullable<Record<string, string>>
  },
>(
  user: T,
) => {
  return {
    image: user.image,
    name: user.name,
    handle: user.handle,
    id: user.id,
    bio: user.bio,
    website: user.website,
    socialLinks: user.socialLinks,
  }
}

const ListCard = memo(({ list }: { list: ListWithStats }) => {
  return (
    <div className="group/card relative overflow-hidden rounded-lg border border-fill bg-material-ultra-thin transition-all duration-200 hover:border-fill-secondary">
      <a
        className="block h-full cursor-pointer"
        href={UrlBuilder.shareList(list.id)}
        target="_blank"
      >
        {/* Main Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <FeedIcon
                fallback
                target={list as any}
                className="size-10 rounded-lg border border-fill-secondary"
                noMargin
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-text transition-colors duration-200 group-hover/card:text-accent">
                {list.title}
              </h3>
              {list.description && (
                <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{list.description}</p>
              )}
            </div>
            {/* Hover indicator */}
            <div className="opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
              <i className="i-mingcute-arrow-right-line size-4 text-text-tertiary" />
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        {(typeof list.subscriptionCount === "number" ||
          (typeof list.fee === "number" && list.fee > 0)) && (
          <div className="border-t border-fill-secondary px-4 py-2.5">
            <div className="flex items-center justify-between text-xs">
              {typeof list.subscriptionCount === "number" && (
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <i className="i-mingcute-group-2-line size-3" />
                  <span>
                    {list.subscriptionCount}
                    <span className="ml-1 hidden sm:inline">
                      {list.subscriptionCount > 1 ? "subscribers" : "subscriber"}
                    </span>
                  </span>
                </div>
              )}
              {typeof list.fee === "number" && list.fee > 0 && (
                <div className="flex items-center gap-1.5">
                  <i className="i-mgc-power size-3 text-folo" />
                  <span className="font-medium">{list.fee}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </a>
    </div>
  )
})
ListCard.displayName = "ListCard"

export const UserProfileModalContent: FC<SubscriptionModalContentProps> = ({ userId, variant }) => {
  const { t } = useTranslation()
  const user = usePrefetchUser(userId)
  const storeUser = useUserById(userId)

  const userInfo = user.data ? pickUserData(user.data) : storeUser ? pickUserData(storeUser) : null

  const modal = useCurrentModal()
  const controller = useAnimationControls()
  useEffect(() => {
    nextFrame(() => controller.start("enter"))
  }, [controller])

  const winHeight = useMemo(() => window.innerHeight, [])

  const modalVariant = useMemo(() => {
    switch (variant) {
      case "drawer": {
        return {
          enter: {
            x: 0,
            opacity: 1,
          },
          initial: {
            x: 700,
            opacity: 0.9,
          },
          exit: {
            x: 750,
            opacity: 0,
          },
        }
      }

      case "dialog": {
        return {
          enter: {
            y: 0,
            opacity: 1,
          },
          initial: {
            y: "100%",
            opacity: 0.9,
          },
          exit: {
            y: winHeight,
          },
        }
      }
    }
  }, [variant, winHeight])

  return (
    <div
      className={variant === "drawer" ? "h-full" : "container center h-full"}
      onPointerDown={variant === "dialog" ? modal.dismiss : undefined}
      onClick={stopPropagation}
    >
      <m.div
        onPointerDown={stopPropagation}
        tabIndex={-1}
        initial="initial"
        animate={controller}
        variants={modalVariant}
        transition={Spring.presets.snappy}
        exit="exit"
        layout="size"
        className={cn(
          "relative flex flex-col overflow-hidden rounded-xl border bg-theme-background",
          variant === "drawer"
            ? "shadow-drawer-to-left h-full w-[60ch] max-w-full"
            : "h-[80vh] w-[800px] max-w-full shadow lg:max-h-[calc(100vh-10rem)]",
        )}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2 text-[20px] opacity-80">
          <ActionButton
            tooltip={t("user_profile.share")}
            onClick={() => {
              if (!user.data) return
              window.open(UrlBuilder.profile(user.data.handle ?? user.data.id))
            }}
          >
            <i className="i-mgc-share-forward-cute-re" />
          </ActionButton>
          <ActionButton tooltip={t("user_profile.close")} onClick={modal.dismiss}>
            <i className="i-mgc-close-cute-re" />
          </ActionButton>
        </div>

        {userInfo && <Content userInfo={userInfo} />}

        {!userInfo && <LoadingCircle size="large" className="center h-full" />}
      </m.div>
    </div>
  )
}

type PickedUser = ReturnType<typeof pickUserData>

const UserInfo = ({ userInfo }: { userInfo: PickedUser }) => {
  const whoami = useWhoami()
  const follow = useFollow()

  // It's a string value when it's from the store
  if (typeof userInfo.socialLinks === "string") {
    userInfo.socialLinks = JSON.parse(userInfo.socialLinks)
  }

  return (
    <div className="relative flex flex-col bg-material-medium p-8 pb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-14 shrink-0 shadow-lg ring-4 ring-white/10">
              <AvatarImage src={getAvatarUrl(userInfo)} className="bg-material-ultra-thick" />
              <AvatarFallback className="bg-gradient-to-br from-blue to-purple text-2xl font-bold uppercase text-white">
                {userInfo.name?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {whoami?.id !== userInfo.id && (
              <Button
                buttonClassName="absolute -bottom-1 -right-1 size-6 rounded-full"
                onClick={() => {
                  follow({
                    url: `rsshub://follow/profile/${userInfo.id}`,
                    isList: false,
                  })
                }}
                size="sm"
              >
                <i className="i-mgc-add-cute-re size-4" />
              </Button>
            )}
          </div>
          <div className="flex-1">
            <h1 className="max-w-[200px] truncate text-xl font-bold tracking-tight text-text">
              {userInfo.name}
            </h1>
            <p
              className={cn(
                "text-sm font-medium text-text-secondary",
                userInfo.handle ? "visible" : "hidden select-none",
              )}
            >
              @{userInfo.handle}
            </p>
          </div>
        </div>
        {userInfo.bio && (
          <p className="text-sm leading-relaxed text-text-secondary">{userInfo.bio}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {userInfo.website && (
            <a
              href={userInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-auto inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-accent"
            >
              <i className="i-mgc-link-cute-re" />
              <span className="text-base leading-relaxed">
                {userInfo.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
          {userInfo.socialLinks &&
            Object.values(userInfo.socialLinks).filter(Boolean).length > 0 && (
              <>
                {Object.entries(userInfo.socialLinks).map(([platform, id]) => {
                  if (!id || !(platform in socialIconClassNames) || typeof id !== "string")
                    return null

                  return (
                    <Tooltip key={platform}>
                      <TooltipTrigger asChild>
                        <a
                          href={getSocialLink(platform as keyof typeof socialIconClassNames, id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-theme-item-hover"
                        >
                          <i
                            className={cn(
                              socialIconClassNames[platform as keyof typeof socialIconClassNames],
                              "text-base text-text-secondary",
                            )}
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs font-medium">
                        {socialCopyMap[platform as keyof typeof socialCopyMap]}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </>
            )}
        </div>
      </div>
    </div>
  )
}

const Subscriptions = ({ userId }: { userId: string }) => {
  const { t } = useTranslation()
  const [itemStyle, setItemStyle] = useAtom(itemVariantAtom)

  return (
    <>
      <div className="-mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{t("user_profile.subscriptions")}</h2>
        <ActionButton
          tooltip={t("user_profile.toggle_item_style")}
          onClick={() => {
            setItemStyle((current) => (current === "loose" ? "compact" : "loose"))
          }}
        >
          <i
            className={cn(
              itemStyle === "loose" ? "i-mgc-list-check-3-cute-re" : "i-mgc-list-check-cute-re",
            )}
          />
        </ActionButton>
      </div>

      <SubscriptionItems userId={userId} itemStyle={itemStyle} />
    </>
  )
}

const useUserListsQuery = (userId: string) => {
  return useQuery({
    queryKey: ["lists", userId],
    queryFn: async () => {
      const res = await followClient.api.lists.list({ userId })
      return res.data
    },
  })
}

const Lists = ({ lists }: { lists: ListWithStats[] }) => {
  const { t } = useTranslation()
  if (!lists || lists.length === 0) return null
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{t("user_profile.created_lists")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 @[500px]:grid-cols-2 @[700px]:grid-cols-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </div>
  )
}

const Content = ({ userInfo }: { userInfo: PickedUser }) => {
  const lists = useUserListsQuery(userInfo.id)
  return (
    <Fragment>
      <UserInfo userInfo={userInfo} />
      <ScrollArea.ScrollArea
        rootClassName="grow max-w-full w-full bg-material-ultra-thin/30 "
        viewportClassName="[&>div]:!flex [&>div]:flex-col"
      >
        {!lists.isLoading && (
          <div className="flex flex-col space-y-4 px-8 py-6 @container">
            {/* Lists Section */}
            {lists.data && lists.data.length > 0 && <Lists lists={lists.data} />}
            {/* Subscriptions Section */}
            <Subscriptions userId={userInfo.id} />
          </div>
        )}
      </ScrollArea.ScrollArea>
    </Fragment>
  )
}
