import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { clsx } from "@follow/utils/utils"
import { m } from "framer-motion"
import { useTranslation } from "react-i18next"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import type { LoginRuntime } from "~/lib/auth"
import { loginHandler } from "~/lib/auth"
import { useAuthProviders } from "~/queries/users"

import { LoginWithPassword } from "./Form"

interface LoginModalContentProps {
  runtime: LoginRuntime
  canClose?: boolean
}

const overrideAuthProvidersClassName = {
  github: "!text-dark dark:!text-white",
  apple: "!text-[#1F2937] dark:!text-[#E5E7EB]",
}

export const LoginModalContent = (props: LoginModalContentProps) => {
  const modal = useCurrentModal()

  const { canClose = true, runtime } = props

  const { t } = useTranslation()
  const { data: authProviders } = useAuthProviders()

  const isMobile = useMobile()

  const providers = Object.entries(authProviders || []).filter(([key]) => key !== "credential")

  const Inner = (
    <>
      <div className="-mt-8 mb-4 flex items-center justify-center">
        <Logo className="size-14" />
      </div>
      <div className="mb-4 mt-6 text-center">
        <span className="text-2xl">
          {t("signin.sign_in_to")} <b>{APP_NAME}</b>
        </span>
      </div>

      <LoginWithPassword runtime={runtime} />
      {providers.length > 0 && (
        <div className="my-3 w-full space-y-2">
          <div className="flex items-center justify-center">
            <Divider className="flex-1" />
            <p className="text-muted-foreground px-4 text-center text-sm">{t("login.or")}</p>
            <Divider className="flex-1" />
          </div>
        </div>
      )}
      <div className="mb-3 flex items-center justify-center gap-4">
        {providers.map(([key, provider]) => (
          <Tooltip key={key} delayDuration={0}>
            <TooltipTrigger asChild>
              <MotionButtonBase
                onClick={() => {
                  loginHandler(key, "app")
                }}
              >
                <div
                  className={clsx(
                    "center hover:bg-muted inline-flex rounded-full border p-2.5 duration-200 [&_svg]:size-6",
                    overrideAuthProvidersClassName[key],
                  )}
                  dangerouslySetInnerHTML={{
                    __html: provider.icon,
                  }}
                  style={{
                    color: provider.color,
                  }}
                />
              </MotionButtonBase>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>
                {t("login.continueWith", { provider: provider.name })}
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        ))}
      </div>
    </>
  )
  if (isMobile) {
    return Inner
  }

  return (
    <div className="center flex h-full" onClick={canClose ? modal.dismiss : undefined}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10, transition: { type: "tween" } }}
        transition={{ type: "spring" }}
      >
        <div className="bg-background w-[25rem] rounded-xl border p-3 px-8 shadow-2xl shadow-stone-300 dark:border-neutral-700 dark:shadow-stone-800">
          {Inner}
        </div>
      </m.div>
    </div>
  )
}
