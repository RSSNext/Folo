import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { AnimatePresence, m } from "motion/react"
import type { ComponentProps, FunctionComponentElement } from "react"
import { createElement, useEffect, useMemo, useRef, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { mountLottie } from "~/components/ui/lottie-container"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { useI18n } from "~/hooks/common"
import confettiUrl from "~/lottie/confetti.lottie?url"
import { settings } from "~/queries/settings"

import { DiscoverImport } from "../discover/DiscoverImport"
import { ProfileSettingForm } from "../profile/profile-setting-form"
import { settingSyncQueue } from "../settings/helper/sync-queue"
import { LanguageSelector } from "../settings/tabs/general"
import { Trending } from "../trending"
import { BehaviorGuide } from "./steps/behavior"

const containerWidth = 600
const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? containerWidth : -containerWidth,
      opacity: 0,
    }
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? containerWidth : -containerWidth,
      opacity: 0,
    }
  },
}

function Intro() {
  const { t } = useTranslation("app")
  return (
    <div className="max-w-[50ch] space-y-8 text-balance text-center">
      <Logo className="mx-auto size-20" />
      <p className="mt-5 text-2xl font-bold">{t("new_user_guide.intro.title")}</p>
      <p className="text-lg">{t("new_user_guide.intro.description")}</p>
      <LanguageSelector contentClassName="z-10" showDescription={false} />
    </div>
  )
}

function Outtro() {
  const { t } = useTranslation("app")
  return (
    <div className="max-w-[50ch] space-y-8 text-balance text-center">
      <Logo className="mx-auto size-20" />
      <p className="mt-5 text-2xl font-semibold">{t("new_user_guide.outro.title")}</p>
      <p className="text-lg">{t("new_user_guide.outro.description")}</p>

      <div className="space-y-2 text-sm opacity-80">
        <p>Tip: {t("new_user_guide.step.shortcuts.description1")}</p>
        <p>
          <Trans
            i18nKey="new_user_guide.step.shortcuts.description2"
            components={{
              kbd: <Kbd>?</Kbd>,
            }}
          />
        </p>
      </div>
    </div>
  )
}
const absoluteConfettiUrl = new URL(confettiUrl, import.meta.url).href

export function GuideModalContent({ onClose }: { onClose: () => void }) {
  const t = useI18n()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const guideSteps = useMemo(
    () =>
      [
        {
          title: t.app("new_user_guide.step.migrate.title"),
          description: t.app("new_user_guide.step.migrate.description"),
          content: createElement(DiscoverImport),
          icon: "i-mgc-file-import-cute-re",
        },
        {
          title: t.app("new_user_guide.step.discover.title"),
          description: t.app("new_user_guide.step.discover.description"),
          content: (
            <div className="overflow-scroll">
              <Trending center limit={50} />
            </div>
          ),
          icon: "i-mgc-emoji-2-cute-re",
        },
        {
          title: t.app("new_user_guide.step.profile.title"),
          description: t.app("new_user_guide.step.profile.description"),
          content: (
            <ProfileSettingForm
              className="w-[500px] max-w-full"
              buttonClassName="text-center !mt-8"
            />
          ),
          icon: "i-mgc-user-setting-cute-re",
        },
        {
          title: t.app("new_user_guide.step.behavior.unread_question.content"),
          description: t.app("new_user_guide.step.profile.description"),
          content: createElement(BehaviorGuide),
          icon: tw`i-mgc-cursor-3-cute-re`,
        },
      ].filter((i) => !!i) as {
        title: string
        icon: React.ReactNode
        content: FunctionComponentElement<object>
        description?: string
      }[],
    [t],
  )

  const totalSteps = useMemo(() => guideSteps.length, [guideSteps])

  const status = useMemo(
    () => (step === 0 ? "initial" : step > 0 && step <= totalSteps ? "active" : "complete"),
    [step, totalSteps],
  )

  useEffect(() => {
    tracker.onBoarding({
      step,
      done: status === "complete",
    })
  }, [status, step])
  const title = useMemo(() => guideSteps[step - 1]?.title, [guideSteps, step])

  const [isLottieAnimating, setIsLottieAnimating] = useState(false)

  const finishGuide = useRef(() => {
    settingSyncQueue.replaceRemote().then(() => {
      settings.get().invalidate()
    })
  }).current

  return (
    <div className="bg-theme-background center relative flex size-full flex-col items-center justify-center overflow-hidden pb-14 sm:size-4/5 sm:rounded-xl sm:shadow-xl">
      <div className="relative mx-auto flex max-h-full w-full justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <m.div
            key={step - 1}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.1 },
            }}
            className="flex min-w-0 flex-col px-6 sm:mt-12"
          >
            {!!title && (
              <div className="mb-8">
                <h1 className="mb-2 flex w-full items-center justify-center gap-2 text-2xl font-bold">
                  {typeof guideSteps[step - 1]!.icon === "string" ? (
                    <i className={cn(guideSteps[step - 1]!.icon, "text-accent")} />
                  ) : (
                    guideSteps[step - 1]!.icon
                  )}
                  {title}
                </h1>
                {!!guideSteps[step - 1]!.description && (
                  <div className="text-text-secondary mx-auto mt-4 flex max-w-prose justify-center text-center text-sm">
                    <Markdown className="prose max-w-[100ch] text-left text-sm">
                      {guideSteps[step - 1]!.description!}
                    </Markdown>
                  </div>
                )}
              </div>
            )}
            <ScrollArea.ScrollArea viewportClassName="px-6">
              {status === "initial" ? (
                <Intro />
              ) : status === "active" ? (
                guideSteps[step - 1]!.content
              ) : status === "complete" ? (
                <Outtro />
              ) : null}
            </ScrollArea.ScrollArea>
          </m.div>
        </AnimatePresence>
      </div>
      <div
        className={cn(
          "absolute left-4 top-4 flex h-fit gap-3 sm:hidden",
          step === 0 && "invisible",
        )}
      >
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <Step key={i} step={i} currentStep={step} />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-8 z-[1] flex w-full items-center justify-between px-8">
        <div className={cn("flex h-fit gap-3 max-sm:hidden", step === 0 && "invisible")}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
            <Step key={i} step={i} currentStep={step} />
          ))}
        </div>
        <div className="grow" />
        <div className="flex gap-2">
          {step !== 0 && (
            <Button
              size="lg"
              onClick={() => {
                if (step > 0) {
                  setStep((prev) => prev - 1)
                  setDirection(-1)
                }
              }}
              variant={"outline"}
            >
              {t.app("new_user_guide.actions.back")}
            </Button>
          )}
          <Button
            size="lg"
            disabled={isLottieAnimating}
            onClick={(e) => {
              if (step <= totalSteps) {
                setStep((prev) => prev + 1)
                setDirection(1)
              } else {
                finishGuide()

                const target = e.target as HTMLElement
                const { x, y } = target.getBoundingClientRect()
                setIsLottieAnimating(true)
                mountLottie(absoluteConfettiUrl, {
                  x: x - 40,
                  y: y - 80,

                  height: 120,
                  width: 120,

                  speed: 2,

                  onComplete() {
                    setIsLottieAnimating(false)
                  },
                })

                setTimeout(() => {
                  onClose()
                }, 50)
              }
            }}
          >
            {step <= totalSteps
              ? t.app("new_user_guide.actions.next")
              : t.app("new_user_guide.actions.finish")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Step({ step, currentStep }: { step: number; currentStep: number }) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete"

  return (
    <m.div animate={status} className="relative">
      <m.div
        variants={{
          active: {
            scale: 1,
            transition: {
              delay: 0,
              duration: 0.2,
            },
          },
          complete: {
            scale: 1.25,
          },
        }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          type: "tween",
          ease: "circOut",
        }}
        className="bg-theme-accent/20 absolute inset-0 rounded-full"
      />

      <m.div
        initial={false}
        variants={{
          inactive: {
            backgroundColor: "var(--fo-background)",
            borderColor: "hsl(var(--border) / 0.5)",
            color: "#bbb",
          },
          active: {
            backgroundColor: "var(--fo-background)",
            borderColor: "hsl(var(--fo-a) / 1)",
            color: "hsl(var(--fo-a) / 1)",
          },
          complete: {
            backgroundColor: "hsl(var(--fo-a) / 1)",
            borderColor: "hsl(var(--fo-a) / 1)",
            color: "hsl(var(--fo-a) / 1)",
          },
        }}
        transition={{ duration: 0.2 }}
        className="relative flex size-7 items-center justify-center rounded-full border text-xs font-semibold"
      >
        <div className="flex items-center justify-center">
          {status === "complete" ? (
            <AnimatedCheckIcon className="size-4 text-white" />
          ) : (
            <span>{step}</span>
          )}
        </div>
      </m.div>
    </m.div>
  )
}

function AnimatedCheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <m.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.2,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
        strokeWidth={2}
        d="M3.514 11.83a22.927 22.927 0 0 1 5.657 5.656c2.75-5.025 6.289-8.563 11.314-11.314"
      />
    </svg>
  )
}
