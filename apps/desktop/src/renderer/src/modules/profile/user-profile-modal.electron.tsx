import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { getStorageNS } from "@follow/utils/ns"
import { clsx, cn } from "@follow/utils/utils"
import { throttle } from "es-toolkit/compat"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useAnimationControls } from "motion/react"
import type { FC } from "react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { UrlBuilder } from "~/lib/url-builder"
import { useUserSubscriptionsQuery } from "~/modules/profile/hooks"
import { useUserById } from "~/store/user"

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
export const UserProfileModalContent: FC<SubscriptionModalContentProps> = ({ userId, variant }) => {
  const { t } = useTranslation()
  const user = useAuthQuery(
    defineQuery(["profiles", userId], async () => {
      const res = await apiClient.profiles.$get({
        query: { id: userId! },
      })
      return res.data
    }),
  )
  const storeUser = useUserById(userId)

  const userInfo = user.data
    ? {
        avatar: user.data.image,
        name: user.data.name,
        handle: user.data.handle,
        id: user.data.id,
      }
    : storeUser
      ? {
          avatar: storeUser.image,
          name: storeUser.name,
          handle: storeUser.handle,
          id: storeUser.id,
        }
      : null

  const follow = useFollow()
  const subscriptions = useUserSubscriptionsQuery(user.data?.id)
  const modal = useCurrentModal()
  const controller = useAnimationControls()
  useEffect(() => {
    nextFrame(() => controller.start("enter"))
  }, [controller])

  const winHeight = useState(() => window.innerHeight)[0]

  const [scrollerRef, setScrollerRef] = useState<HTMLDivElement | null>(null)
  const [isHeaderSimple, setHeaderSimple] = useState(false)

  const currentVisibleRef = useRef<Set<string>>()
  useEffect(() => {
    const $ref = scrollerRef

    if (!$ref) return

    const initialHeaderHeight = 136

    const scrollHandler = throttle(() => {
      const currentH = $ref.scrollTop

      setHeaderSimple((current) => {
        if (!current) {
          return currentH > initialHeaderHeight
        } else {
          if (currentH === 0) return false
        }
        return current
      })
    }, 16)
    $ref.addEventListener("scroll", scrollHandler)

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
      $ref.removeEventListener("scroll", scrollHandler)

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
          "bg-theme-background relative flex flex-col items-center overflow-hidden rounded-xl border p-8 pb-0",
          variant === "drawer"
            ? "shadow-drawer-to-left h-full w-[60ch] max-w-full"
            : "h-[80vh] w-[800px] max-w-full shadow lg:max-h-[calc(100vh-10rem)]",
        )}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2 text-[20px] opacity-80">
          <ActionButton
            tooltip={t("user_profile.toggle_item_style")}
            onClick={() => {
              const currentVisible = currentVisibleRef.current
              const topOfCurrent = currentVisible?.values().next().value

              setItemStyle((current) => (current === "loose" ? "compact" : "loose"))
              if (!topOfCurrent) return

              nextFrame(() => {
                scrollerRef?.querySelector(`[data-feed-id="${topOfCurrent}"]`)?.scrollIntoView()
              })
            }}
          >
            <i
              className={cn(
                itemStyle === "loose" ? "i-mgc-list-check-3-cute-re" : "i-mgc-list-check-cute-re",
              )}
            />
          </ActionButton>
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
            <div
              className={cn(
                "center f-motion-reduce:duration-700 m-12 mb-4 flex shrink-0 flex-col",
                isHeaderSimple ? "mt-3 flex-row" : "flex-col",
              )}
            >
              <Avatar
                asChild
                className={cn("aspect-square", isHeaderSimple ? "size-12" : "size-16")}
              >
                <m.span layout transition={{ duration: 0.35 }}>
                  <AvatarImage
                    className="animate-in fade-in-0 duration-200"
                    asChild
                    src={replaceImgUrlIfNeed(userInfo.avatar || undefined)}
                  >
                    <m.img layout transition={{ duration: 0.35 }} />
                  </AvatarImage>
                  <AvatarFallback>{userInfo.name?.slice(0, 2)}</AvatarFallback>
                </m.span>
              </Avatar>

              <m.div
                layout
                transition={{ duration: 0.35 }}
                className={cn(
                  "relative flex cursor-text select-text flex-col items-center",
                  isHeaderSimple ? "ml-8 items-start" : "",
                )}
              >
                <m.div
                  className={cn(
                    "mb-1 flex items-center text-2xl font-bold",
                    isHeaderSimple ? "" : "mt-4",
                  )}
                >
                  <m.h1 layout>{userInfo.name}</m.h1>
                </m.div>
                <m.div
                  className={cn(
                    "text-sm text-zinc-500",
                    userInfo.handle ? "visible" : "hidden select-none",
                  )}
                  layout
                >
                  @{userInfo.handle}
                </m.div>
                <Button
                  buttonClassName={cn(
                    isHeaderSimple ? "absolute -right-full top-4 rounded-full p-2" : "mt-4",
                  )}
                  onClick={() => {
                    follow({
                      url: `rsshub://follow/profile/${userInfo.id}`,
                      isList: false,
                    })
                  }}
                >
                  <FollowIcon className={clsx("size-3", !isHeaderSimple ? "mr-1" : "")} />
                  {isHeaderSimple ? "" : t("feed_form.follow")}
                </Button>
              </m.div>
            </div>
            <ScrollArea.ScrollArea
              ref={setScrollerRef}
              rootClassName="grow max-w-full px-5 w-full"
              viewportClassName="[&>div]:space-y-4 pb-4"
            >
              <SubscriptionItems userId={userId} itemStyle={itemStyle} />
            </ScrollArea.ScrollArea>
          </Fragment>
        )}

        {!userInfo && <LoadingCircle size="large" className="center h-full" />}
      </m.div>
    </div>
  )
}
