import { Button } from "@follow/components/ui/button/index.js"
import { UserRole, UserRoleName } from "@follow/constants"
import { DEEPLINK_SCHEME, IN_ELECTRON } from "@follow/shared"
import { env } from "@follow/shared/env.desktop"
import { useRoleEndAt, useUserRole, useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Trans } from "react-i18next"
import { toast } from "sonner"

import { subscription } from "~/lib/auth"

// Plan configuration types
interface Plan {
  id: string
  title: string
  monthlyPrice: number
  yearlyPrice: number
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
  [UserRole.PreProTrial]: 2,
  [UserRole.Pro]: 3,
}

// Plan configurations
const PLAN_CONFIGS: Plan[] = [
  {
    id: "free",
    title: UserRoleName[UserRole.Free],
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["50 feeds", "10 lists"],
    isPopular: false,
    role: UserRole.Free,
    tier: PLAN_TIER_MAP[UserRole.Free],
  },
  {
    id: "folo pro",
    title: UserRoleName[UserRole.Pro],
    monthlyPrice: 20,
    yearlyPrice: 180,
    features: [
      "1000 feeds and lists",
      "10 inboxes",
      "10 actions",
      "100 webhooks",
      "Advanced AI features",
    ],
    isPopular: true,
    role: UserRole.Pro,
    tier: PLAN_TIER_MAP[UserRole.Pro],
  },
]

// AI Token configuration types
interface AITokenPlan {
  id: string
  title: string
  price: number
  tokens: number
  isPopular?: boolean
}
const AI_TOKEN_IN_PRO_PLAN = 15_000_000
const AI_TOKEN_IN_PRO_PLAN_PER_DOLLAR = AI_TOKEN_IN_PRO_PLAN / 10
// AI Token configurations
const AI_TOKEN_CONFIGS: AITokenPlan[] = [
  {
    id: "folo ai token ($5)",
    title: "Folo AI Token ($5)",
    price: 5,
    tokens: AI_TOKEN_IN_PRO_PLAN_PER_DOLLAR * 5,
    isPopular: false,
  },
  {
    id: "folo ai token ($10)",
    title: "Folo AI Token ($10)",
    price: 10,
    tokens: AI_TOKEN_IN_PRO_PLAN_PER_DOLLAR * 10,
    isPopular: true,
  },
  {
    id: "folo ai token ($20)",
    title: "Folo AI Token ($20)",
    price: 20,
    tokens: AI_TOKEN_IN_PRO_PLAN_PER_DOLLAR * 20,
    isPopular: false,
  },
]

const useUpgradePlan = ({ plan, annual }: { plan: string; annual: boolean }) => {
  return useMutation({
    mutationFn: async () => {
      const res = await subscription.upgrade({
        plan,
        annual,
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

const usePurchaseAITokens = ({ tokenPlan }: { tokenPlan: string }) => {
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement AI token purchase API call
      const res = await subscription.upgrade({
        plan: tokenPlan,
        annual: false,
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

const useActiveSubscription = () => {
  const userId = useWhoami()?.id
  return useQuery({
    queryKey: ["activeSubscription"],
    queryFn: async () => {
      const { data } = await subscription.list()
      return data
    },
    enabled: !!userId,
  })
}

const useCancelPlan = () => {
  const activeSubscription = useActiveSubscription()
  const latestSubscription = activeSubscription.data?.at(-1)
  const subscriptionId = latestSubscription?.id
  const cancelAtPeriodEnd = latestSubscription?.cancelAtPeriodEnd

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscriptionId) {
        toast.error("No active subscription found.")
        return
      }

      await subscription.cancel({
        subscriptionId,
        returnUrl: IN_ELECTRON ? `${DEEPLINK_SCHEME}refresh` : env.VITE_WEB_URL,
        fetchOptions: {
          onError(context) {
            toast.error(context.error.message)
          },
        },
      })
    },
  })

  if (cancelAtPeriodEnd) {
    return null
  } else {
    return cancelMutation
  }
}

export function SettingPlan() {
  const role = useUserRole()
  const roleEndDate = useRoleEndAt()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")

  const daysLeft = roleEndDate
    ? Math.ceil((roleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <section className="mt-4 space-y-8">
      {/* Description Section */}
      <p className="mb-4 space-y-2 text-sm">
        <Trans ns="settings" i18nKey="plan.description" />
      </p>

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-fill-secondary p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all",
              billingPeriod === "monthly"
                ? "bg-background text-text shadow-sm"
                : "text-text-secondary hover:text-text",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all",
              billingPeriod === "yearly"
                ? "bg-background text-text shadow-sm"
                : "text-text-secondary hover:text-text",
            )}
          >
            <span>Yearly</span>
            <span className="ml-2 text-xs font-medium text-green">Save 25%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3">
          {PLAN_CONFIGS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              currentUserRole={role || null}
              daysLeft={daysLeft}
              isCurrentPlan={role === plan.role}
            />
          ))}
        </div>
      </div>

      {/* AI Tokens Section */}
      <div className="space-y-4">
        <div className="border-b border-fill-secondary pb-2">
          <h2 className="text-lg font-semibold">AI Tokens</h2>
          <p className="text-sm text-text-secondary">
            Purchase additional AI tokens for enhanced content processing and analysis.
          </p>
        </div>

        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-3">
            {AI_TOKEN_CONFIGS.map((tokenPlan) => (
              <AITokenCard key={tokenPlan.id} tokenPlan={tokenPlan} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Reusable PlanCard Component
interface PlanCardProps {
  plan: Plan
  billingPeriod: "monthly" | "yearly"
  currentUserRole: UserRole | null
  isCurrentPlan: boolean
  daysLeft: number | null
}

const PlanCard = ({
  plan,
  billingPeriod,
  currentUserRole,
  isCurrentPlan,
  daysLeft,
}: PlanCardProps) => {
  const getPlanActionType = (): "current" | "upgrade" | "coming-soon" | "in-trial" | null => {
    if (plan.isComingSoon) return "coming-soon"

    if (!currentUserRole) {
      return plan.tier > PLAN_TIER_MAP[UserRole.Free] ? "upgrade" : "current"
    }

    const currentTier = PLAN_TIER_MAP[currentUserRole]
    const targetTier = plan.tier

    if (currentTier === targetTier) {
      // if (currentUserRole === UserRole.PreProTrial) {
      //   return "in-trial"
      // } else {
      //   return "current"
      // }
      return "current"
    }
    if (targetTier > currentTier) return "upgrade"
    return null
  }

  const actionType = getPlanActionType()
  const upgradePlanMutation = useUpgradePlan({
    plan: "folo pro",
    annual: billingPeriod === "yearly",
  })
  const cancelPlanMutation = useCancelPlan()

  // Calculate price and period based on billing period
  const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
  const formattedPrice = price === 0 ? "$0" : `$${price}`
  const period = plan.role === UserRole.Free ? "" : billingPeriod === "yearly" ? "year" : "month"

  // Calculate savings for yearly plan
  const yearlyTotalPrice = plan.yearlyPrice
  const monthlyTotalPrice = plan.monthlyPrice * 12
  const savingsPercentage =
    plan.monthlyPrice > 0 && plan.yearlyPrice > 0
      ? Math.round(((monthlyTotalPrice - yearlyTotalPrice) / monthlyTotalPrice) * 100)
      : 0

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200",
        plan.isPopular
          ? "border-accent"
          : "border-fill-tertiary bg-background hover:border-fill-secondary",
        isCurrentPlan &&
          "bg-gradient-to-b from-accent/5 to-transparent shadow-lg shadow-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-background",
        plan.isComingSoon && "opacity-75",
      )}
    >
      <PlanBadges isPopular={plan.isPopular || false} />

      <div className="flex h-full flex-col p-4 @md:p-5">
        <div className="flex-1 space-y-3 @md:space-y-4">
          <PlanHeader
            title={plan.title}
            price={formattedPrice}
            period={period}
            billingPeriod={billingPeriod}
            monthlyPrice={plan.monthlyPrice}
            yearlyPrice={plan.yearlyPrice}
            savingsPercentage={savingsPercentage}
          />
          <PlanFeatures features={plan.features} />
          <div />
        </div>

        <PlanAction
          isPopular={plan.isPopular || false}
          actionType={actionType}
          daysLeft={daysLeft}
          isLoading={upgradePlanMutation.isPending || cancelPlanMutation?.isPending}
          onSelect={
            !plan.isComingSoon && !isCurrentPlan
              ? () => {
                  upgradePlanMutation.mutate()
                }
              : undefined
          }
          onCancel={
            isCurrentPlan && plan.role !== UserRole.Free && cancelPlanMutation
              ? () => {
                  cancelPlanMutation.mutate()
                }
              : undefined
          }
        />
      </div>

      {/* Subtle gradient line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fill-tertiary to-transparent" />
    </div>
  )
}

// Plan card sub-components
const PlanBadges = ({ isPopular }: { isPopular: boolean }) => (
  <>
    {isPopular && (
      <div className="absolute -top-px right-4 z-10">
        <div className="rounded-b-lg bg-gradient-to-r from-accent to-accent/80 px-1.5 py-1 text-caption font-medium text-white shadow-sm">
          Most Popular
        </div>
      </div>
    )}
  </>
)

const PlanHeader = ({
  title,
  price,
  period,
  billingPeriod,
  monthlyPrice,
  yearlyPrice,
  savingsPercentage,
}: {
  title: string
  price: string
  period: string
  billingPeriod: "monthly" | "yearly"
  monthlyPrice: number
  yearlyPrice: number
  savingsPercentage: number
}) => (
  <div className="space-y-1">
    <h3 className="text-base font-semibold @md:text-lg">{title}</h3>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold">{price}</span>
      {period && <span className="text-xs text-text-secondary @md:text-sm">/{period}</span>}
    </div>
    <div className="h-7 space-y-0.5 @md:h-8">
      {billingPeriod === "yearly" &&
        monthlyPrice > 0 &&
        yearlyPrice > 0 &&
        savingsPercentage > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-tertiary line-through">
              ${(monthlyPrice * 12).toFixed(0)}/year
            </span>
            <span className="font-medium text-green">Save {savingsPercentage}%</span>
          </div>
        )}
      {billingPeriod === "yearly" && monthlyPrice > 0 && yearlyPrice > 0 && (
        <div className="text-xs text-text-secondary">
          ${(yearlyPrice / 12).toFixed(1)}/month billed annually
        </div>
      )}
    </div>
  </div>
)

const PlanFeatures = ({ features }: { features: string[] }) => (
  <div className="space-y-1.5 @md:space-y-2">
    {features.map((feature) => (
      <div key={feature} className="flex items-start gap-2.5 @md:gap-3">
        <div className="mt-0.5 flex size-3.5 items-center justify-center rounded-full bg-green/10 @md:size-4">
          <i className="i-mgc-check-cute-re text-[10px] text-green @md:text-xs" />
        </div>
        <span className="text-xs leading-relaxed @md:text-sm">{feature}</span>
      </div>
    ))}
  </div>
)

const PlanAction = ({
  isPopular,
  actionType,
  onSelect,
  onCancel,
  isLoading,
  daysLeft,
}: {
  isPopular: boolean
  actionType: "current" | "upgrade" | "coming-soon" | "in-trial" | null
  onSelect?: () => void
  onCancel?: () => void
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
          text: typeof daysLeft === "number" ? `${daysLeft} days left` : "Current Plan",
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
    <div className="space-y-2">
      <Button
        variant={buttonConfig.variant}
        buttonClassName={buttonConfig.className}
        disabled={buttonConfig.disabled}
        onClick={buttonConfig.disabled ? undefined : onSelect}
        isLoading={isLoading}
      >
        {buttonConfig.text}
      </Button>

      {actionType === "current" && typeof daysLeft === "number" && onCancel && (
        <Button
          variant="ghost"
          buttonClassName="w-full h-8 text-xs text-text-tertiary hover:text-red"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      )}
    </div>
  )
}

// AI Token Card Component
interface AITokenCardProps {
  tokenPlan: AITokenPlan
}

const AITokenCard = ({ tokenPlan }: AITokenCardProps) => {
  const purchaseTokensMutation = usePurchaseAITokens({
    tokenPlan: tokenPlan.id,
  })

  // Format tokens display
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`
    }
    return tokens.toString()
  }

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200",
        tokenPlan.isPopular
          ? "border-accent"
          : "border-fill-tertiary bg-background hover:border-fill-secondary",
      )}
    >
      {/* Popular badge */}
      {tokenPlan.isPopular && (
        <div className="absolute -top-px right-4 z-10">
          <div className="rounded-b-lg bg-gradient-to-r from-accent to-accent/80 px-1.5 py-1 text-caption font-medium text-white shadow-sm">
            Most Popular
          </div>
        </div>
      )}

      <div className="flex h-full flex-col p-4 @md:p-5">
        <div className="flex-1 space-y-3 @md:space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-base font-semibold @md:text-lg">{tokenPlan.title}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">${tokenPlan.price}</span>
              <span className="text-xs text-text-secondary @md:text-sm">one-time</span>
            </div>
          </div>

          {/* Token amount */}
          <div className="space-y-1.5 @md:space-y-2">
            <div className="flex items-start gap-2.5 @md:gap-3">
              <div className="mt-0.5 flex size-3.5 items-center justify-center rounded-full bg-blue/10 @md:size-4">
                <i className="i-mgc-ai-cute-re text-[10px] text-blue @md:text-xs" />
              </div>
              <span className="text-xs leading-relaxed @md:text-sm">
                {formatTokens(tokenPlan.tokens)} AI tokens
              </span>
            </div>
            <div className="flex items-start gap-2.5 @md:gap-3">
              <div className="mt-0.5 flex size-3.5 items-center justify-center rounded-full bg-green/10 @md:size-4">
                <i className="i-mgc-check-cute-re text-[10px] text-green @md:text-xs" />
              </div>
              <span className="text-xs leading-relaxed @md:text-sm">Never expires</span>
            </div>
          </div>
          <div />
        </div>

        {/* Purchase button */}
        <Button
          variant={tokenPlan.isPopular ? undefined : "outline"}
          buttonClassName={
            tokenPlan.isPopular
              ? "w-full h-9 @md:h-10 text-xs @md:text-sm bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
              : "w-full h-9 @md:h-10 text-xs @md:text-sm"
          }
          onClick={() => purchaseTokensMutation.mutate()}
          isLoading={purchaseTokensMutation.isPending}
        >
          Purchase
        </Button>
      </div>

      {/* Subtle gradient line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fill-tertiary to-transparent" />
    </div>
  )
}
