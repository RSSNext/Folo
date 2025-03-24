import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import { cn } from "@follow/utils/utils"
import { AnimatePresence, m } from "framer-motion"
import type { ComponentProps, FunctionComponentElement } from "react"
import { createElement, useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { mountLottie } from "~/components/ui/lottie-container"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { useI18n } from "~/hooks/common"
import confettiUrl from "~/lottie/confetti.lottie?url"
import { MyWalletSection } from "~/modules/power/my-wallet-section"
import { settings } from "~/queries/settings"

import { ActivationModalContent } from "../activation/ActivationModalContent"
import { DiscoverImport } from "../discover/import"
import { ProfileSettingForm } from "../profile/profile-setting-form"
import { settingSyncQueue } from "../settings/helper/sync-queue"
import { LanguageSelector } from "../settings/tabs/general"
import { BehaviorGuide } from "./steps/behavior"
import { RSSHubGuide } from "./steps/rsshub"

const RSSHubIcon = `data:image/png;base64,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`
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
    <div className="max-w-[50ch] space-y-4 text-balance text-center">
      <Logo className="mx-auto size-20" />
      <p className="mt-5 text-xl font-bold">{t("new_user_guide.intro.title")}</p>
      <p className="text-lg">{t("new_user_guide.intro.description")}</p>
      <LanguageSelector contentClassName="z-10" />
    </div>
  )
}

function Outtro() {
  const { t } = useTranslation("app")
  return (
    <div className="max-w-[50ch] space-y-4 text-balance text-center">
      <Logo className="mx-auto size-20" />
      <p className="mt-5 text-xl font-semibold">{t("new_user_guide.outro.title")}</p>
      <p className="text-lg">{t("new_user_guide.outro.description")}</p>
    </div>
  )
}
const absoluteConfettiUrl = new URL(confettiUrl, import.meta.url).href

export function GuideModalContent({ onClose }: { onClose: () => void }) {
  const t = useI18n()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const lang = useGeneralSettingKey("language")
  const defaultLang = ["zh-CN", "zh-HK", "zh-TW"].includes(lang ?? "") ? "zh-CN" : "en"

  const guideSteps = useMemo(
    () =>
      [
        {
          title: t.app("new_user_guide.step.migrate.profile"),
          content: (
            <ProfileSettingForm
              className="w-[500px] max-w-full"
              buttonClassName="text-center !mt-8"
            />
          ),
          icon: "i-mgc-user-setting-cute-re",
        },
        {
          title: t.app("new_user_guide.step.activation.title"),
          description: t.app("new_user_guide.step.activation.description"),
          content: <ActivationModalContent className="w-full max-w-[500px]" hideDescription />,
          icon: "i-mgc-love-cute-re",
        },
        {
          title: t.app("new_user_guide.step.migrate.wallet"),
          content: <MyWalletSection className="w-full max-w-[600px]" />,
          icon: <i className="i-mgc-power text-accent" />,
        },
        {
          title: t.app("new_user_guide.step.behavior.unread_question.content"),
          description: t.app("new_user_guide.step.behavior.unread_question.description"),
          content: createElement(BehaviorGuide),
          icon: tw`i-mgc-cursor-3-cute-re`,
        },
        {
          title: t.app("new_user_guide.step.migrate.title"),
          content: createElement(DiscoverImport, {
            isInit: true,
          }),
          icon: "i-mgc-file-import-cute-re",
        },
        {
          title: t.app("new_user_guide.step.rsshub.title"),
          description: t.app("new_user_guide.step.rsshub.info"),
          content: createElement(RSSHubGuide, {
            categories: "popular",
            lang: defaultLang,
          }),
          icon: <img src={RSSHubIcon} className="size-[22px]" />,
        },
        {
          title: t.app("new_user_guide.step.shortcuts.title"),
          content: (
            <div className="space-y-2">
              <p>{t.app("new_user_guide.step.shortcuts.description1")}</p>
              <p>
                <Trans
                  i18nKey="new_user_guide.step.shortcuts.description2"
                  components={{
                    kbd: <Kbd>H</Kbd>,
                  }}
                />
              </p>
            </div>
          ),
          icon: "i-mgc-hotkey-cute-re",
        },
      ].filter((i) => !!i) as {
        title: string
        icon: React.ReactNode
        content: FunctionComponentElement<object>
        description?: string
      }[],
    [t, defaultLang],
  )

  const totalSteps = useMemo(() => guideSteps.length, [guideSteps])

  const status = useMemo(
    () => (step === 0 ? "initial" : step > 0 && step <= totalSteps ? "active" : "complete"),
    [step, totalSteps],
  )

  const title = useMemo(() => guideSteps[step - 1]?.title, [guideSteps, step])

  const [isLottieAnimating, setIsLottieAnimating] = useState(false)

  const finishGuide = useCallback(() => {
    settingSyncQueue.replaceRemote().then(() => {
      settings.get().invalidate()
    })
  }, [])

  return (
    <m.div
      layout
      className="bg-theme-background relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden sm:min-h-[80%] sm:w-4/5 sm:rounded-xl sm:shadow-xl"
    >
      <div className="center relative mx-auto w-full">
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
            className="min-w-0 px-6 sm:mt-12"
          >
            {!!title && (
              <div className="mb-6">
                <h1 className="mb-2 flex w-full items-center justify-center gap-2 text-xl font-bold">
                  {typeof guideSteps[step - 1]!.icon === "string" ? (
                    <i className={cn(guideSteps[step - 1]!.icon, "size-[22px]")} />
                  ) : (
                    guideSteps[step - 1]!.icon
                  )}
                  {title}
                </h1>
                {!!guideSteps[step - 1]!.description && (
                  <div className="text-theme-vibrancyFg flex justify-center text-center text-sm">
                    <Markdown className="prose max-w-[100ch] text-left text-sm">
                      {guideSteps[step - 1]!.description!}
                    </Markdown>
                  </div>
                )}
              </div>
            )}
            {status === "initial" ? (
              <Intro />
            ) : status === "active" ? (
              guideSteps[step - 1]!.content
            ) : status === "complete" ? (
              <Outtro />
            ) : null}
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

      <div className="absolute inset-x-0 bottom-4 z-[1] flex w-full items-center justify-between px-6">
        <div className={cn("flex h-fit gap-3 max-sm:hidden", step === 0 && "invisible")}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
            <Step key={i} step={i} currentStep={step} />
          ))}
        </div>
        <div className="grow" />
        <div className="flex gap-2">
          {step !== 0 && (
            <Button
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
                    onClose()
                  },
                })
              }
            }}
          >
            {step <= totalSteps
              ? t.app("new_user_guide.actions.next")
              : t.app("new_user_guide.actions.finish")}
          </Button>
        </div>
      </div>
    </m.div>
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
            color: "hsl(var(--fo-foreground) / 0.2)",
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
