import { cn } from "@follow/utils/utils"
import { lazy, Suspense, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useWhoami } from "~/atoms/user"
import { WEB_URL } from "~/constants/env"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { sendVerificationEmail } from "~/lib/auth"
import { settings } from "~/queries/settings"

const LazyNewUserGuideModal = lazy(() =>
  import("~/modules/new-user-guide/modal").then((m) => ({ default: m.NewUserGuideModal })),
)

export function NewUserGuide() {
  const user = useWhoami()
  const { data: remoteSettings, isLoading } = useAuthQuery(settings.get(), {})
  const isNewUser =
    !isLoading && remoteSettings && Object.keys(remoteSettings.updated ?? {}).length === 0

  useEffect(() => {
    if (user?.email && !user.emailVerified) {
      toast.error(<EmailVerificationToast user={user} />, {
        id: "email-verification",
        duration: Infinity,
        closeButton: true,
      })
    }
  }, [user?.emailVerified])

  return user && isNewUser ? (
    <Suspense>
      <LazyNewUserGuideModal />
    </Suspense>
  ) : null
}

function EmailVerificationToast({
  user,
}: {
  user: {
    email: string
  }
}) {
  const { t } = useTranslation("settings")
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false)
  return (
    <div data-content className="flex w-full flex-col gap-2">
      <div data-title>
        {t("profile.email.verify_email", {
          email_address: user.email,
        })}
      </div>
      <button
        type="button"
        data-button="true"
        data-action="true"
        className={cn(
          "font-sans font-medium",
          isEmailVerificationSent && "!cursor-progress opacity-50",
        )}
        disabled={isEmailVerificationSent}
        onClick={async () => {
          setIsEmailVerificationSent(true)
          await sendVerificationEmail({
            email: user.email,
            callbackURL: `${WEB_URL}/login`,
          })
          toast.dismiss("email-verification")
          // Wait for the toast to dismiss before showing the success toast
          // To have a better user experience
          setTimeout(() => {
            toast.success(t("profile.email.verification_sent"))
          }, 800)
        }}
      >
        {t("profile.email.send_verification")}
      </button>
    </div>
  )
}
