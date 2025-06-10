import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { usePrefetchUser, useUserById } from "@follow/store/user/hooks"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { getStorageNS } from "@follow/utils/ns"
import { cn } from "@follow/utils/utils"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useAnimationControls } from "motion/react"
import type { FC } from "react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { m } from "~/components/common/Motion"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { UrlBuilder } from "~/lib/url-builder"
import { useUserSubscriptionsQuery } from "~/modules/profile/hooks"

import { getSocialLink, socialCopyMap, socialIconClassNames } from "./user-profile-modal.constants"
import type { SubscriptionModalContentProps } from "./user-profile-modal.shared"
import { SubscriptionItems } from "./user-profile-modal.shared"

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
    avatar?: string
    name?: string | null
    handle?: string | null
    id: string
    bio?: string | null
    website?: string | null
    socialLinks?: Record<string, string> | null
  },
>(
  user: T,
) => {
  return {
    avatar: user.avatar,
    name: user.name,
    handle: user.handle,
    id: user.id,
    bio: user.bio,
    website: user.website,
    socialLinks: user.socialLinks,
  }
}
export const UserProfileModalContent: FC<SubscriptionModalContentProps> = ({ userId, variant }) => {
  const { t } = useTranslation()
  const user = usePrefetchUser(userId)
  const storeUser = useUserById(userId)

  const userInfo = user.data ? pickUserData(user.data) : storeUser ? pickUserData(storeUser) : null
  const whoami = useWhoami()
  const follow = useFollow()
  const subscriptions = useUserSubscriptionsQuery(user.data?.id)
  const modal = useCurrentModal()
  const controller = useAnimationControls()
  useEffect(() => {
    nextFrame(() => controller.start("enter"))
  }, [controller])

  const winHeight = useMemo(() => window.innerHeight, [])

  const [scrollerRef, setScrollerRef] = useState<HTMLDivElement | null>(null)

  const currentVisibleRef = useRef<Set<string>>(undefined)
  useEffect(() => {
    const $ref = scrollerRef

    if (!$ref) return

    const currentVisible = new Set<string>()
    const ob = new IntersectionObserver((en) => {
      en.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.feedId as string
        if (!id) return
        if (entry.isIntersecting) {
          currentVisible.add(id)
        } else {
          currentVisible.delete(id)
        }
      })

      if (currentVisible.size === 0) return
      currentVisibleRef.current = currentVisible
    })

    $ref.querySelectorAll("[data-feed-id]").forEach((el) => {
      ob.observe(el)
    })
    return () => {
      ob.disconnect()
    }
  }, [scrollerRef, subscriptions])

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

  const [itemStyle, setItemStyle] = useAtom(itemVariantAtom)

  return (
    <div
      className={variant === "drawer" ? "h-full" : "center container h-full"}
      onPointerDown={variant === "dialog" ? modal.dismiss : undefined}
      onClick={stopPropagation}
    >
      <m.div
        onPointerDown={stopPropagation}
        tabIndex={-1}
        initial="initial"
        animate={controller}
        variants={modalVariant}
        transition={{
          type: "spring",
          mass: 0.4,
          tension: 100,
          friction: 1,
        }}
        exit="exit"
        layout="size"
        className={cn(
          "bg-theme-background relative flex flex-col overflow-hidden rounded-xl border",
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

        {userInfo && (
          <Fragment>
            <div className="flex flex-col p-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20">
                  <AvatarImage
                    className="animate-in fade-in-0 duration-200"
                    src={replaceImgUrlIfNeed(userInfo.avatar || undefined)}
                  />
                  <AvatarFallback className="text-3xl uppercase">
                    {userInfo.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{userInfo.name}</h1>
                  <p
                    className={cn(
                      "text-text-secondary text-sm",
                      userInfo.handle ? "visible" : "hidden select-none",
                    )}
                  >
                    @{userInfo.handle}
                  </p>
                </div>
                {whoami?.id !== userInfo.id && (
                  <Button
                    onClick={() => {
                      follow({
                        url: `rsshub://follow/profile/${userInfo.id}`,
                        isList: false,
                      })
                    }}
                    buttonClassName="mt-4"
                  >
                    <FollowIcon className="mr-1 size-3" />
                    {t("feed_form.follow")}
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea.ScrollArea
              ref={setScrollerRef}
              rootClassName="grow max-w-full w-full"
              viewportClassName="[&>div]:!flex [&>div]:flex-col"
            >
              <div className="flex flex-col gap-4 px-6 pb-6">
                {/* Bio, Website, Social Links Section */}
                {(user.data?.bio || user.data?.website || user.data?.socialLinks) && (
                  <div className="bg-material-medium -mx-6 px-6 py-3">
                    <h2 className="text-text-secondary text-sm font-medium">
                      {t("user_profile.about", "About")}
                    </h2>
                    {user.data.bio && (
                      <p className="text-text-secondary/80 mt-2 text-sm">{user.data.bio}</p>
                    )}
                    <div className="mt-3">
                      {user.data.website && (
                        <a
                          href={user.data.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 inline-flex items-center gap-2 text-sm transition-colors"
                        >
                          <i className="i-mgc-link-cute-re text-base" />
                          <span className="truncate">
                            {user.data.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      )}
                      {user.data.socialLinks && (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          {Object.entries(user.data.socialLinks).map(([platform, id]) => {
                            if (!id || !(platform in socialIconClassNames)) return null

                            return (
                              <Tooltip key={platform}>
                                <TooltipTrigger asChild>
                                  <a
                                    href={getSocialLink(
                                      platform as keyof typeof socialIconClassNames,
                                      id,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-secondary hover:text-accent group flex items-center justify-center rounded-full transition-colors"
                                  >
                                    <i
                                      className={cn(
                                        socialIconClassNames[
                                          platform as keyof typeof socialIconClassNames
                                        ],
                                        "text-lg",
                                      )}
                                    />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent className="text-sm">
                                  {socialCopyMap[platform as keyof typeof socialCopyMap]}
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Subscriptions Section */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-text-secondary -mb-2 text-lg font-medium">
                      {t("user_profile.subscriptions", "Subscriptions")}
                    </h2>
                    <ActionButton
                      tooltip={t("user_profile.toggle_item_style")}
                      onClick={() => {
                        const currentVisible = currentVisibleRef.current
                        const topOfCurrent = currentVisible?.values().next().value

                        setItemStyle((current) => (current === "loose" ? "compact" : "loose"))
                        if (!topOfCurrent) return

                        nextFrame(() => {
                          scrollerRef
                            ?.querySelector(`[data-feed-id="${topOfCurrent}"]`)
                            ?.scrollIntoView()
                        })
                      }}
                    >
                      <i
                        className={cn(
                          itemStyle === "loose"
                            ? "i-mgc-list-check-3-cute-re"
                            : "i-mgc-list-check-cute-re",
                        )}
                      />
                    </ActionButton>
                  </div>
                  <div className="space-y-4">
                    <SubscriptionItems userId={userId} itemStyle={itemStyle} />
                  </div>
                </div>
              </div>
            </ScrollArea.ScrollArea>
          </Fragment>
        )}

        {!userInfo && <LoadingCircle size="large" className="center h-full" />}
      </m.div>
    </div>
  )
}
