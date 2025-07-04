import { RiNftFill } from "@follow/components/icons/nft.jsx"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { styledButtonVariant } from "@follow/components/ui/button/variants.js"
import { Input } from "@follow/components/ui/input/Input.js"
import { LoadingCircle, LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { useOnce } from "@follow/hooks"
import type { ExtractBizResponse } from "@follow/models/types"
import { Chain } from "@follow/utils/chain"
import { cn } from "@follow/utils/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PrimitiveAtom } from "jotai"
import { atom, useStore } from "jotai"
import { nanoid } from "nanoid"
import type { FC, ReactNode } from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { LazyDotLottie } from "~/components/common/LazyDotLottie"
import { VideoPlayer } from "~/components/ui/media/VideoPlayer"
import { ScaleModal } from "~/components/ui/modal/stacked/custom-modal"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import achievementAnimationUri from "~/lottie/achievement.lottie?url"

const absoluteachievementAnimationUri = new URL(achievementAnimationUri, import.meta.url).href
enum AchievementsActionIdMap {
  FIRST_CLAIM_FEED = 0,
  FIRST_CREATE_LIST = 1,
  LIST_SUBSCRIBE_50 = 2,
  LIST_SUBSCRIBE_100 = 3,
  LIST_SUBSCRIBE_500 = 4,
  PRODUCT_HUNT_VOTE = 5,
  // TODO
  // FOLLOW_SPECIAL_FEED = 6,
  ALPHA_TESTER = 7,
  FEED_BOOSTER = 8,
}

const achievementActionIdMetaMap: Record<
  AchievementsActionIdMap,
  { title: I18nKeys; description: I18nKeys; video?: string }
> = {
  [AchievementsActionIdMap.FIRST_CLAIM_FEED]: {
    title: "achievement.first_claim_feed",
    description: "achievement.first_claim_feed_description",
    video: "https://assets.folo.is/FeedOwnerBadge.webm",
  },
  [AchievementsActionIdMap.FIRST_CREATE_LIST]: {
    title: "achievement.first_create_list",
    description: "achievement.first_create_list_description",
    video: "https://assets.folo.is/ListBadge.webm",
  },
  [AchievementsActionIdMap.LIST_SUBSCRIBE_50]: {
    title: "achievement.list_subscribe_50",
    description: "achievement.list_subscribe_50_description",
    video: "https://assets.folo.is/50Subs.webm",
  },
  [AchievementsActionIdMap.LIST_SUBSCRIBE_100]: {
    title: "achievement.list_subscribe_100",
    description: "achievement.list_subscribe_100_description",
    video: "https://assets.folo.is/100Subs.webm",
  },
  [AchievementsActionIdMap.LIST_SUBSCRIBE_500]: {
    title: "achievement.list_subscribe_500",
    description: "achievement.list_subscribe_500_description",
    video: "https://assets.folo.is/500Subs.webm",
  },
  [AchievementsActionIdMap.PRODUCT_HUNT_VOTE]: {
    title: "achievement.product_hunt_vote",
    description: "achievement.product_hunt_vote_description",
    video: "https://assets.folo.is/ProductHunt.webm",
  },
  // [AchievementsActionIdMap.FOLLOW_SPECIAL_FEED]: {
  //   title: "achievement.follow_special_feed",
  //   description: "achievement.follow_special_feed_description",
  // },
  [AchievementsActionIdMap.ALPHA_TESTER]: {
    title: "achievement.alpha_tester",
    description: "achievement.alpha_tester_description",
    video: "https://assets.folo.is/AlphaBadge.webm",
  },
  [AchievementsActionIdMap.FEED_BOOSTER]: {
    title: "achievement.feed_booster",
    description: "achievement.feed_booster_description",
  },
}

const prefetchVideos = () => {
  Object.values(achievementActionIdMetaMap).forEach(({ video }) => {
    if (video) {
      const link = document.createElement("link")
      link.rel = "prefetch"
      link.href = video
      document.head.append(link)
    }
  })
}

type Achievement = ExtractBizResponse<typeof apiClient.achievement.$get>["data"]
export const AchievementModalContent: FC = () => {
  const jotaiStore = useStore()

  useOnce(() => {
    prefetchVideos()
  })

  const defaultAchievements = useState(buildDefaultAchievements)[0]

  const {
    data: achievements,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["achievements"],
    meta: {
      persist: true,
    },
    queryFn: async () => {
      const res = await apiClient.achievement.$get({
        query: {
          type: "all",
        },
      })

      jotaiStore.set(achievementsDataAtom, res.data)
      return res.data
    },
    initialData: defaultAchievements as Achievement,
  })

  useEffect(() => {
    if (isLoading) return
    if (!achievements) return
    let shouldPolling = false
    const pollingChain = new Chain()
    for (const achievement of achievements) {
      if (achievement.type === "checking") {
        shouldPolling = true
        break
      }
    }

    if (shouldPolling) {
      pollingChain.wait(2000).next(() => {
        refetch()
      })
    }

    return () => {
      pollingChain.abort()
    }
  }, [achievements, isLoading, refetch])

  const achievementsDataAtom = useState(() => atom<typeof achievements>())[0]

  const t = useI18n()

  const sortedAchievements = useMemo(() => {
    return achievements?.sort((a, b) => {
      if (a.type === "received") return 1
      if (b.type === "received") return -1
      return 0
    })
  }, [achievements])
  const { present } = useModalStack()

  const presentBadgeVideo = (type: keyof typeof achievementActionIdMetaMap) => {
    const copy = achievementActionIdMetaMap[type]
    if (!copy) return
    const { video } = copy
    if (!video) return
    present({
      title: "Congratulations!",
      CustomModalComponent: ScaleModal,
      content: ({ dismiss }) => (
        <VideoPlayer
          variant="preview"
          onClick={dismiss}
          aria-label="Close video"
          src={video}
          autoPlay
          muted
          height={500}
          width={500}
          loop
        />
      ),

      overlay: true,
    })
  }

  return (
    <div className="relative flex w-full grow flex-col items-center">
      <LazyDotLottie
        className="mt-4 size-[100px] lg:mt-12"
        autoplay
        speed={2}
        src={absoluteachievementAnimationUri}
        loop={false}
      />

      <div className="mt-4 text-xl font-bold">{t("words.achievement")}</div>

      <small className="text-text-secondary mt-1 gap-1">
        {t("achievement.description")}
        <sup className="inline-block translate-y-1 text-xs">*</sup>
      </small>

      <ScrollArea
        rootClassName="lg:h-0 h-auto grow mt-10 w-[calc(100%+2rem)] -mx-4"
        viewportClassName="px-4"
      >
        <ul className="flex w-full flex-col gap-2">
          {isLoading ? (
            <div className="center pointer-events-none grow -translate-y-16">
              <LoadingWithIcon icon={<i className="i-mgc-trophy-cute-re" />} size="large" />
            </div>
          ) : (
            sortedAchievements?.map((achievement) => {
              const copy = achievementActionIdMetaMap[achievement.actionId]
              if (!copy) return null

              return (
                <li key={achievement.id} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-base font-bold">
                      {t(copy.title)}

                      {copy.video && achievement.type === "received" && (
                        <MotionButtonBase
                          className="hover:text-accent p-1 duration-200"
                          onClick={() => {
                            presentBadgeVideo(achievement.actionId)
                          }}
                        >
                          <RiNftFill className="size-4" />
                        </MotionButtonBase>
                      )}
                    </div>
                    <div className="text-text-secondary flex items-center text-sm">
                      {t(copy.description)}
                    </div>
                  </div>
                  {achievement.type === "checking" && (
                    <div
                      className={styledButtonVariant({
                        variant: "outline",
                        className: "pointer-events-none relative border-0",
                      })}
                    >
                      <LoadingCircle size="small" className="center absolute inset-0" />
                      <span className="select-none opacity-0">{t("words.mint")}</span>
                    </div>
                  )}
                  {achievement.type === "incomplete" && (
                    <IncompleteButton achievement={achievement} refetch={refetch} />
                  )}
                  {achievement.type === "received" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (copy.video) {
                          presentBadgeVideo(achievement.actionId)
                        }
                      }}
                      className={styledButtonVariant({
                        variant: "outline",
                        className: [
                          "dark:text-text relative gap-1 border-green-200 !bg-green-100/50 text-green-800 dark:border-green-200/20 dark:!bg-green-100/5",
                          copy.video ? "cursor-button" : "cursor-default",
                        ],
                      })}
                    >
                      {copy.video && achievement.type === "received" ? (
                        <>View Badge</>
                      ) : (
                        <>
                          <i className="i-mgc-check-filled" />
                          {t("achievement.all_done")}
                        </>
                      )}
                    </button>
                  )}

                  {achievement.type === "audit" && (
                    <div
                      className={styledButtonVariant({
                        variant: "outline",
                        className:
                          "dark:text-text relative cursor-not-allowed gap-1 border-zinc-200 !bg-zinc-100/50 text-zinc-800 dark:border-zinc-200/20 dark:!bg-zinc-100/5",
                      })}
                    >
                      Validating...
                    </div>
                  )}
                  {achievement.type === "completed" && (
                    <MintButton
                      onMinted={() => {
                        presentBadgeVideo(achievement.actionId)
                      }}
                      achievementsDataAtom={achievementsDataAtom}
                      achievement={achievement}
                    />
                  )}
                </li>
              )
            })
          )}
        </ul>
      </ScrollArea>

      <p className="text-text-tertiary mt-4 pb-4 text-xs">* {t("achievement.nft_coming_soon")}</p>
    </div>
  )
}

const buildDefaultAchievements = () => {
  return Object.keys(achievementActionIdMetaMap).map((key) => {
    return {
      id: nanoid(),
      actionId: Number(key),
      type: "checking",
    }
  })
}

const MintButton: FC<{
  achievementsDataAtom: PrimitiveAtom<Achievement | undefined>
  achievement: Achievement[number]
  onMinted: () => void
}> = ({ achievementsDataAtom, achievement, onMinted }) => {
  const { mutateAsync: mintAchievement, isPending: isMinting } = useMutation({
    mutationFn: async (actionId: number) => {
      return apiClient.achievement.$put({
        json: {
          actionId,
        },
      })
    },
  })

  const jotaiStore = useStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return (
    <Button
      isLoading={isMinting}
      variant="primary"
      onClick={async () => {
        const res = await mintAchievement(achievement.actionId)

        const currentData = jotaiStore.get(achievementsDataAtom)
        if (!currentData) return
        let shouldInvalidate = false
        const newData = currentData.map((item) => {
          if (item.id === achievement.id && res.data.result) {
            shouldInvalidate = true
            return {
              ...item,
              done: true,
              doneAt: new Date().toISOString(),
              type: "received",
            } as const
          }
          return item
        })
        jotaiStore.set(achievementsDataAtom, newData)

        if (shouldInvalidate) {
          queryClient.invalidateQueries({ queryKey: ["achievements"] })
        }
        onMinted()
      }}
    >
      {t("words.mint")}
    </Button>
  )
}

const IncompleteButton: FC<{
  achievement: Achievement[number]
  refetch: () => void
}> = ({ achievement, refetch }) => {
  const { mutateAsync: checkAchievement, isPending: checkPending } = useMutation({
    mutationFn: async (actionId: number) => {
      return apiClient.achievement.check.$post({
        json: {
          actionId,
        },
      })
    },
    onSuccess: () => {
      refetch()
    },
  })

  const { present } = useModalStack()
  let Content: ReactNode

  const { PRODUCT_HUNT_VOTE_URL } = useServerConfigs() || {}

  switch (achievement.actionId) {
    case AchievementsActionIdMap.PRODUCT_HUNT_VOTE: {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!PRODUCT_HUNT_VOTE_URL}
              onClick={() => {
                present({
                  title: "Validate Your Vote",
                  content: () => <VoteValidateModalContent refetch={refetch} />,
                })
              }}
            >
              Validate
            </Button>
          </TooltipTrigger>
          {!PRODUCT_HUNT_VOTE_URL && (
            <TooltipContent>Product Hunt Vote is not ready, We'll see.</TooltipContent>
          )}
        </Tooltip>
      )
    }
    default: {
      Content = (
        <>
          <div className="center absolute z-[1] opacity-0 duration-200 group-hover:opacity-100">
            <i
              className={cn(
                "i-mgc-refresh-2-cute-re text-accent size-5",
                checkPending && "animate-spin",
              )}
            />
          </div>
          <div className="duration-200 group-hover:opacity-30">
            <span className="center relative ml-2 inline-flex w-24 -translate-y-1 flex-col *:!m-0">
              <small className="text-text shrink-0 text-xs leading-tight">
                {achievement.progress} / {achievement.progressMax}
              </small>
              <span className="bg-accent/10 relative h-1 w-full overflow-hidden rounded-full">
                <span
                  className="bg-accent absolute -left-3 top-0 inline-block h-1 rounded-full"
                  style={{
                    width: `calc(${Math.min(
                      (achievement.progress / achievement.progressMax) * 100,
                      100,
                    )}% + 0.75rem)`,
                  }}
                />
              </span>
            </span>
          </div>
        </>
      )
    }
  }

  return (
    <button
      type="button"
      className={styledButtonVariant({
        variant: "ghost",
        className: "group relative cursor-pointer hover:bg-transparent",
      })}
      onClick={() => {
        checkAchievement(achievement.actionId)
      }}
    >
      {Content}
    </button>
  )
}
const VoteValidateModalContent: FC<{ refetch: () => void }> = ({ refetch }) => {
  const ref = useRef<HTMLInputElement>(null)
  const { dismiss } = useCurrentModal()
  const { present } = useModalStack()
  const { mutateAsync: audit, isPending } = useMutation({
    mutationFn: (username: string) => {
      return apiClient.achievement.audit.$post({
        json: {
          actionId: AchievementsActionIdMap.PRODUCT_HUNT_VOTE,
          payload: {
            username,
          },
        },
      })
    },
    onSuccess: () => {
      dismiss()

      refetch()
      present({
        title: "Thank you!",
        content: () => <div>Thank you for your vote. Please wait for our verification.</div>,
        clickOutsideToDismiss: true,
      })
    },
  })
  const { PRODUCT_HUNT_VOTE_URL } = useServerConfigs() || {}
  const id = useId()

  const openOnceRef = useRef(false)
  useEffect(() => {
    if (openOnceRef.current) return
    if (PRODUCT_HUNT_VOTE_URL) {
      window.open(PRODUCT_HUNT_VOTE_URL, "_blank")
      openOnceRef.current = true
    }
  }, [PRODUCT_HUNT_VOTE_URL])

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ref.current?.value) return
        audit(ref.current.value)
      }}
    >
      <label className="text-sm" htmlFor={id}>
        Please vote for {APP_NAME} on{" "}
        <a
          href={PRODUCT_HUNT_VOTE_URL}
          className="follow-link--underline"
          target="_blank"
          rel="noreferrer"
        >
          Product Hunt!
        </a>{" "}
        Then fill in your username here.
      </label>
      <div>
        <Input ref={ref} autoFocus id={id} placeholder="Your Product Hunt username" />
      </div>

      <div className="mt-2 flex justify-end">
        <Button isLoading={isPending} type="submit">
          Validate
        </Button>
      </div>
    </form>
  )
}
