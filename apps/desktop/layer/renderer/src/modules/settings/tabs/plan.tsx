import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { UserRole, UserRoleName } from "@follow/constants"
import { DEEPLINK_SCHEME, IN_ELECTRON } from "@follow/shared"
import { env } from "@follow/shared/env.desktop"
import { useRoleEndAt, useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Trans } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { subscription } from "~/lib/auth"
import { useReferralInfo } from "~/queries/referral"

import { useSetSettingTab } from "../modal/context"

// Plan configuration types
interface Plan {
  id: string
  title: string
  price: string
  period: string
  features: string[]
  isPopular?: boolean
  role: UserRole
  isComingSoon?: boolean
  tier: number // Add tier for hierarchy comparison
}

// Plan hierarchy: Free (1) < Pro Preview (2) < Pro (3)
const PLAN_TIER_MAP: Record<UserRole, number> = {
  [UserRole.Admin]: 4, // Admin has highest tier
  [UserRole.Free]: 1,
  [UserRole.Trial]: 1, // Same as Free (deprecated)
  [UserRole.PreProTrial]: 2, // Same tier as PrePro
  [UserRole.PrePro]: 2,
  [UserRole.Pro]: 3,
}

// Plan configurations
const PLAN_CONFIGS: Plan[] = [
  {
    id: "free",
    title: UserRoleName[UserRole.Free],
    price: "$0",
    period: "",
    features: ["50 feeds", "10 lists"],
    isPopular: false,
    role: UserRole.Free,
    tier: PLAN_TIER_MAP[UserRole.Free],
  },
  {
    id: "pro-preview",
    title: UserRoleName[UserRole.PrePro],
    price: "$1 or 3 invitations",
    period: "",
    features: ["1000 feeds and lists", "10 inboxes", "10 actions", "100 webhooks"],
    isPopular: false,
    role: UserRole.PrePro,
    tier: PLAN_TIER_MAP[UserRole.PrePro],
  },
  {
    id: "pro",
    title: UserRoleName[UserRole.Pro],
    price: "Coming soon",
    period: "",
    features: [`Everything in ${UserRoleName[UserRole.PrePro]}`, "Advanced AI features"],
    isPopular: false,
    role: UserRole.Pro,
    isComingSoon: true,
    tier: PLAN_TIER_MAP[UserRole.Pro],
  },
]

const useUpgradePlan = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await subscription.upgrade({
        plan: "folo pro preview",
        successUrl: IN_ELECTRON ? `${DEEPLINK_SCHEME}refresh` : env.VITE_WEB_URL,
        cancelUrl: env.VITE_WEB_URL,
        disableRedirect: IN_ELECTRON,
      })
      if (IN_ELECTRON && res.data?.url) {
        window.open(res.data.url, "_blank")
      }
    },
  })
}

export function SettingPlan() {
  const serverConfigs = useServerConfigs()
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3
  const skipPrice = serverConfigs?.REFERRAL_PRO_PREVIEW_STRIPE_PRICE_IN_DOLLAR || 1
  const ruleLink = serverConfigs?.REFERRAL_RULE_LINK
  const { data: referralInfo } = useReferralInfo()
  const validInvitationsAmount = referralInfo?.invitations.filter((i) => i.usedAt).length || 0
  const role = useUserRole()
  const roleEndDate = useRoleEndAt()
  const daysLeft = roleEndDate
    ? Math.ceil((roleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const upgradePlanMutation = useUpgradePlan()

  return (
    <section className="mt-4 space-y-8">
      {/* Description Section */}
      <p className="mb-4 space-y-2 text-sm">
        <Trans
          ns="settings"
          i18nKey="plan.description"
          values={{
            day: referralInfo?.referralCycleDays || 45,
          }}
          components={{
            Link: (
              <a
                href={ruleLink}
                className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
                target="_blank"
              />
            ),
          }}
        />
      </p>

      {/* Plans Grid */}
      <div className="@container">
        <div className="@md:grid-cols-2 @xl:grid-cols-3 grid grid-cols-1 gap-4">
          {PLAN_CONFIGS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentUserRole={role || null}
              daysLeft={daysLeft}
              isCurrentPlan={
                role === plan.role ||
                (plan.role === UserRole.PrePro && role === UserRole.PreProTrial)
              }
            />
          ))}
        </div>
      </div>

      <Divider />
      {/* Current Status Card */}
      <StatusCard
        role={role || UserRole.Free}
        roleEndDate={roleEndDate || null}
        daysLeft={daysLeft}
        validInvitationsAmount={validInvitationsAmount}
        requiredInvitationsAmount={requiredInvitationsAmount}
        skipPrice={skipPrice}
        onUpgrade={() => {
          upgradePlanMutation.mutate()
        }}
        isLoading={upgradePlanMutation.isPending}
      />
    </section>
  )
}

// Reusable StatusCard Component
interface StatusCardProps {
  role: UserRole
  roleEndDate: Date | null
  daysLeft: number | null
  validInvitationsAmount: number
  requiredInvitationsAmount: number
  skipPrice: number
  onUpgrade: () => void
  isLoading?: boolean
}

const StatusCard = ({
  role,
  roleEndDate,
  daysLeft,
  validInvitationsAmount,
  requiredInvitationsAmount,
  skipPrice,
  onUpgrade,
  isLoading,
}: StatusCardProps) => {
  const getStatusInfo = () => {
    if (role === UserRole.PrePro) {
      return {
        title: "You have an active Pro Preview plan",
        icon: "i-mgc-check-cute-fi",
        iconBg: "bg-green",
      }
    }
    if (role === UserRole.PreProTrial) {
      return {
        title: `Pro Preview trial expires ${dayjs(roleEndDate).format("MMMM D, YYYY")} (${daysLeft} days left)`,
        icon: "i-mgc-time-cute-re",
        iconBg: "bg-accent",
      }
    }
    return {
      title: "Start your journey with our referral program",
      icon: "i-mgc-time-cute-re",
      iconBg: "bg-accent",
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="border-fill-tertiary from-background to-fill-quaternary relative overflow-hidden rounded-xl border bg-gradient-to-br">
      <div className="from-accent/5 absolute inset-0 bg-gradient-to-br to-transparent" />
      <div className="relative p-6">
        <StatusHeader
          title="Current Status"
          description={statusInfo.title}
          icon={statusInfo.icon}
          iconBg={statusInfo.iconBg}
        />

        <ReferralProgress
          validInvitationsAmount={validInvitationsAmount}
          requiredInvitationsAmount={requiredInvitationsAmount}
        />

        {role !== UserRole.PrePro && (
          <UpgradeSection skipPrice={skipPrice} onUpgrade={onUpgrade} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}

// Reusable StatusHeader Component
interface StatusHeaderProps {
  title: string
  description: string
  icon: string
  iconBg: string
}

const StatusHeader = ({ title, description, icon, iconBg }: StatusHeaderProps) => (
  <div className="mb-4 flex items-center gap-3">
    <div className={cn("flex size-8 items-center justify-center rounded-full text-white", iconBg)}>
      <i className={cn("text-sm", icon)} />
    </div>
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  </div>
)

// Reusable ReferralProgress Component
interface ReferralProgressProps {
  validInvitationsAmount: number
  requiredInvitationsAmount: number
}

const ReferralProgress = ({
  validInvitationsAmount,
  requiredInvitationsAmount,
}: ReferralProgressProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Referral Progress</span>
      <span className="text-text-secondary text-sm">
        {validInvitationsAmount} / {requiredInvitationsAmount}
      </span>
    </div>

    <div className="relative">
      <div className="bg-fill-tertiary h-2 overflow-hidden rounded-full">
        <div
          className="from-accent to-accent/70 h-full bg-gradient-to-r transition-all duration-500 ease-out"
          style={{
            width: `${Math.min((validInvitationsAmount / requiredInvitationsAmount) * 100, 100)}%`,
          }}
        />
      </div>
      {validInvitationsAmount >= requiredInvitationsAmount && <CompletionBadge />}
    </div>
  </div>
)

// Reusable CompletionBadge Component
const CompletionBadge = () => (
  <div className="bg-green absolute -top-1 right-0 flex size-4 items-center justify-center rounded-full text-white">
    <i className="i-mgc-check-cute-re text-xs" />
  </div>
)

// Reusable UpgradeSection Component
interface UpgradeSectionProps {
  skipPrice: number
  onUpgrade: () => void
  isLoading?: boolean
}

const UpgradeSection = ({ skipPrice, onUpgrade, isLoading }: UpgradeSectionProps) => {
  const setTab = useSetSettingTab()

  return (
    <div className="border-fill-tertiary border-t pt-4">
      <div className="flex items-center justify-end gap-4">
        <Button
          size="sm"
          buttonClassName="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          onClick={() => {
            setTab("referral")
          }}
        >
          Invite 3 friends
        </Button>
        <span>or</span>
        <Button
          size="sm"
          buttonClassName="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          onClick={onUpgrade}
          isLoading={isLoading}
        >
          Pay ${skipPrice}
        </Button>
      </div>
    </div>
  )
}

// Reusable PlanCard Component
interface PlanCardProps {
  plan: Plan
  currentUserRole: UserRole | null
  isCurrentPlan: boolean
  daysLeft: number | null
}

const PlanCard = ({ plan, currentUserRole, isCurrentPlan, daysLeft }: PlanCardProps) => {
  const getPlanActionType = (): "current" | "upgrade" | "coming-soon" | "in-trial" | null => {
    if (plan.isComingSoon) return "coming-soon"

    if (!currentUserRole) {
      return plan.tier > PLAN_TIER_MAP[UserRole.Free] ? "upgrade" : "current"
    }

    const currentTier = PLAN_TIER_MAP[currentUserRole]
    const targetTier = plan.tier

    if (currentTier === targetTier) {
      if (currentUserRole === UserRole.PreProTrial) {
        return "in-trial"
      } else {
        return "current"
      }
    }
    if (targetTier > currentTier) return "upgrade"
    return null
  }

  const actionType = getPlanActionType()
  const upgradePlanMutation = useUpgradePlan()

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200",
        plan.isPopular
          ? "border-accent"
          : "border-fill-tertiary bg-background hover:border-fill-secondary",
        isCurrentPlan &&
          "ring-accent ring-offset-background from-accent/5 shadow-accent/10 bg-gradient-to-b to-transparent shadow-lg ring-2 ring-offset-2",
        plan.isComingSoon && "opacity-75",
      )}
    >
      <PlanBadges isPopular={plan.isPopular || false} />

      <div className="@md:p-5 flex h-full flex-col p-4">
        <div className="@md:space-y-4 flex-1 space-y-3">
          <PlanHeader title={plan.title} price={plan.price} period={plan.period} />
          <PlanFeatures features={plan.features} />
          <div />
        </div>

        <PlanAction
          isPopular={plan.isPopular || false}
          actionType={actionType}
          daysLeft={daysLeft}
          isLoading={upgradePlanMutation.isPending}
          onSelect={() => {
            if (
              !plan.isComingSoon &&
              !isCurrentPlan && // Handle plan selection logic
              plan.role === UserRole.PrePro
            ) {
              // Trigger upgrade to Pro Preview
              upgradePlanMutation.mutate()
            }
            // Add other plan selection logic as needed
          }}
        />
      </div>

      {/* Subtle gradient line at bottom */}
      <div className="via-fill-tertiary absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent" />
    </div>
  )
}

// Plan card sub-components
const PlanBadges = ({ isPopular }: { isPopular: boolean }) => (
  <>
    {isPopular && (
      <div className="absolute -top-px right-4 z-10">
        <div className="from-accent to-accent/80 text-caption rounded-b-lg bg-gradient-to-r px-1.5 py-1 font-medium text-white shadow-sm">
          Most Popular
        </div>
      </div>
    )}
  </>
)

const PlanHeader = ({ title, price, period }: { title: string; price: string; period: string }) => (
  <div className="space-y-1">
    <h3 className="@md:text-lg text-base font-semibold">{title}</h3>
    <div className="flex items-baseline gap-1">
      <span className="font-default text-xl font-bold">{price}</span>
      {period && <span className="text-text-secondary @md:text-sm text-xs">/{period}</span>}
    </div>
  </div>
)

const PlanFeatures = ({ features }: { features: string[] }) => (
  <div className="@md:space-y-2 space-y-1.5">
    {features.map((feature, index) => (
      <div key={index} className="@md:gap-3 flex items-start gap-2.5">
        <div className="bg-green/10 @md:size-4 mt-0.5 flex size-3.5 items-center justify-center rounded-full">
          <i className="i-mgc-check-cute-re text-green @md:text-xs text-[10px]" />
        </div>
        <span className="@md:text-sm text-xs leading-relaxed">{feature}</span>
      </div>
    ))}
  </div>
)

const PlanAction = ({
  isPopular,
  actionType,
  onSelect,
  isLoading,
  daysLeft,
}: {
  isPopular: boolean
  actionType: "current" | "upgrade" | "coming-soon" | "in-trial" | null
  onSelect?: () => void
  isLoading?: boolean
  daysLeft: number | null
}) => {
  const getButtonConfig = () => {
    switch (actionType) {
      case "coming-soon": {
        return {
          text: "Coming Soon",
          variant: "outline" as const,
          className: "w-full h-9 @md:h-10 text-xs @md:text-sm",
          disabled: true,
        }
      }
      case "current": {
        return {
          text: "Current Plan",
          variant: "outline" as const,
          className: "w-full h-9 @md:h-10 text-xs @md:text-sm text-text-secondary",
          disabled: true,
        }
      }
      case "in-trial": {
        return {
          text: `In Trial (${daysLeft} days left)`,
          variant: "outline" as const,
          className: "w-full h-9 @md:h-10 text-xs @md:text-sm",
          disabled: false,
        }
      }
      case "upgrade": {
        return {
          text: "Upgrade",
          variant: isPopular ? undefined : ("outline" as const),
          className: isPopular
            ? "w-full h-9 @md:h-10 text-xs @md:text-sm bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
            : "w-full h-9 @md:h-10 text-xs @md:text-sm",
          disabled: false,
        }
      }
      case null: {
        return null
      }
    }
  }

  const buttonConfig = getButtonConfig()

  if (!buttonConfig) {
    return null
  }

  return (
    <div>
      <Button
        variant={buttonConfig.variant}
        buttonClassName={buttonConfig.className}
        disabled={buttonConfig.disabled}
        onClick={buttonConfig.disabled ? undefined : onSelect}
        isLoading={isLoading}
      >
        {buttonConfig.text}
      </Button>
    </div>
  )
}
