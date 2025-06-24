import { Button } from "@follow/components/ui/button/index.js"
import { Card } from "@follow/components/ui/card/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { Progress } from "@follow/components/ui/progress/index.js"
import { UserRole, UserRoleName } from "@follow/constants"
import { env } from "@follow/shared/env.desktop"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useUserRole, useUserRoleEndDate } from "~/atoms/user"
import { subscription } from "~/lib/auth"
import { useReferralInfo } from "~/queries/referral"

export function SettingPlan() {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3
  const skipPrice = serverConfigs?.REFERRAL_PRO_PREVIEW_STRIPE_PRICE_IN_DOLLAR || 1
  const ruleLink = serverConfigs?.REFERRAL_RULE_LINK
  const { data: referralInfo } = useReferralInfo()
  const validInvitationsAmount = referralInfo?.invitations.length || 0
  const role = useUserRole()
  const roleEndDate = useUserRoleEndDate()
  const daysLeft = roleEndDate
    ? Math.ceil((roleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  return (
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <p>
          <Trans
            ns="settings"
            i18nKey="plan.description"
            values={{
              day: referralInfo?.referralCycleDays || 45,
            }}
            components={{
              Link: <a href={ruleLink} className="text-accent" target="_blank" />,
            }}
          />
        </p>
      </div>
      <Divider className="my-6" />
      <Card className="bg-background flex justify-center gap-4">
        <PlanItem
          className="flex-[0.7]"
          title={UserRoleName[UserRole.Free]}
          features={["50 feeds", "10 lists"]}
          price="$0"
        />
        <PlanItem
          title={UserRoleName[UserRole.PrePro]}
          features={["1000 feeds and lists", "10 inboxes", "10 actions", "100 webhooks"]}
          price="$1"
        />
        <PlanItem
          title={UserRoleName[UserRole.Pro]}
          features={[`Everything in ${UserRoleName[UserRole.PrePro]}`, "Advanced AI features"]}
          price="Coming soon"
        />
      </Card>
      <Card
        className={cn(
          "p-3",
          role === UserRole.PrePro
            ? "border-blue-100 bg-green-50 dark:border-green-900 dark:bg-green-950"
            : "border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
        )}
      >
        {role === UserRole.PrePro
          ? t("referral.pro_status.user")
          : role === UserRole.PreProTrial
            ? t("referral.pro_status.preview", {
                dateString: dayjs(roleEndDate).format("MMMM D, YYYY"),
                daysLeft,
              })
            : role === UserRole.Free || role === UserRole.FreeDeprecated
              ? t("referral.pro_status.trial")
              : ""}
      </Card>
      <div className="mt-4 space-y-2">
        <p>Referral Progress:</p>
        <div className="flex items-center gap-4">
          <Progress value={(validInvitationsAmount / requiredInvitationsAmount) * 100} />
          <span className="shrink-0">
            {validInvitationsAmount} / {requiredInvitationsAmount}
          </span>
        </div>
        {role === UserRole.PreProTrial && (
          <>
            <p>Alternatively:</p>
            <Button
              onClick={() => {
                subscription.upgrade({
                  plan: "folo pro preview",
                  successUrl: env.VITE_WEB_URL,
                  cancelUrl: env.VITE_WEB_URL,
                })
              }}
            >
              Pay ${skipPrice} to Extend Pro Preview Now
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

const PlanItem = ({
  className,
  title,
  features,
  price,
}: {
  className?: string
  title: string
  features: string[]
  price: string
}) => {
  return (
    <div className={cn("flex-1 space-y-2 p-6", className)}>
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-text-secondary text-sm">{price}</div>
      <div>
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm">
            <i className="i-mgc-check-cute-re" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
