import { Button } from "@follow/components/ui/button/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.jsx"
import { UserRole } from "@follow/constants"
import { DEEPLINK_SCHEME, IN_ELECTRON } from "@follow/shared"
import { env } from "@follow/shared/env.desktop"
import { useUserRole, useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import NumberFlow from "@number-flow/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { PaymentFeature, PaymentPlan } from "~/atoms/server-configs"
import { useIsPaymentEnabled, useServerConfigs } from "~/atoms/server-configs"
import { subscription } from "~/lib/auth"
import { ipcServices } from "~/lib/client"

const AI_MODEL_SELECTION_VALUE_LABELS = {
  none: {
    translationKey: "plan.featureValues.AI_MODEL_SELECTION.none",
    fallback: "—",
  },
  curated: {
    translationKey: "plan.featureValues.AI_MODEL_SELECTION.curated",
    fallback: "Curated best-value models",
  },
  high_performance: {
    translationKey: "plan.featureValues.AI_MODEL_SELECTION.high_performance",
    fallback: "All high-performance models",
  },
} as const

const formatFeatureValue = (
  key: keyof PaymentFeature,
  value: PaymentFeature[keyof PaymentFeature] | null | undefined,
  t?: TFunction<"settings">,
): string => {
  if (value == null || value === undefined) {
    return "—"
  }

  if (key === "AI_MODEL_SELECTION" && typeof value === "string") {
    const selectionValue =
      AI_MODEL_SELECTION_VALUE_LABELS[value as keyof typeof AI_MODEL_SELECTION_VALUE_LABELS]
    if (selectionValue) {
      return t?.(selectionValue.translationKey) ?? selectionValue.fallback
    }
  }

  if (typeof value === "boolean") {
    return value ? "✓" : "—"
  }

  if (value === Number.MAX_SAFE_INTEGER) {
    return "Unlimited"
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(" ") : "—"
  }

  return value
}

const useUpgradePlan = ({ plan, annual }: { plan: string | undefined; annual: boolean }) => {
  return useMutation({
    mutationFn: async () => {
      if (!plan) {
        return
      }

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

const useActiveSubscription = () => {
  const userId = useWhoami()?.id
  return useQuery({
    queryKey: ["activeSubscription"],
    queryFn: async () => {
      const { data } = await subscription.list()
      // We used to allow one time purchases, so we need to check for active subscriptions
      return data?.find(
        (sub) => (sub.status === "active" || sub.status === "trialing") && sub.stripeSubscriptionId,
      )
    },
    enabled: !!userId,
  })
}

const useIAPProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["iap-products", id],
    queryFn: async () => {
      if (!id) {
        return null
      }
      const res = await ipcServices?.iap.getProducts([id])
      return res?.at(0) || null
    },
  })
}

const usePurchaseIAPProduct = () => {
  const appleAppAccountToken = useWhoami()?.appleAppAccountToken
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!appleAppAccountToken) {
        toast.error("Unable to purchase: missing account token.")
        return
      }
      await ipcServices?.iap.purchaseProduct(productId, { username: appleAppAccountToken })
    },
  })
}

export function SettingPlan() {
  const isPaymentEnabled = useIsPaymentEnabled()
  const role = useUserRole()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")

  const serverConfig = useServerConfigs()
  const plans = serverConfig?.PAYMENT_PLAN_LIST || []
  const currentPlan = plans.find((plan) => plan.role === role)
  const currentTier = currentPlan?.tier || 0

  // Calculate average savings percentage across all paid plans
  const averageSavings = Math.round(
    plans
      .filter((plan) => plan.priceInDollars > 0 && plan.priceInDollarsAnnual > 0)
      .reduce((acc, plan) => {
        const monthlyTotal = plan.priceInDollars * 12
        const yearlyTotal = plan.priceInDollarsAnnual
        const savings = ((monthlyTotal - yearlyTotal) / monthlyTotal) * 100
        return acc + savings
      }, 0) / plans.filter((plan) => plan.priceInDollars > 0).length,
  )
  if (!isPaymentEnabled) {
    return null
  }

  return (
    <section className="mt-4 space-y-8">
      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <SegmentGroup
          value={billingPeriod}
          onValueChanged={(value) => setBillingPeriod(value as "monthly" | "yearly")}
        >
          <SegmentItem value="monthly" label="Monthly" />
          <SegmentItem
            value="yearly"
            label={
              <span className="flex items-center gap-2">
                <span>Yearly</span>
                {averageSavings > 0 && (
                  <span className="text-xs font-semibold text-green">Save {averageSavings}%</span>
                )}
              </span>
            }
          />
        </SegmentGroup>
      </div>

      {/* Plans Grid */}
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-3">
          {plans
            .filter((plan) => plan.priceInDollars > 0)
            .map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                billingPeriod={billingPeriod}
                isCurrentPlan={role === plan.role}
                currentTier={currentTier}
              />
            ))}
        </div>
      </div>

      {/* Comparison Table */}
      <PlanComparisonTable plans={plans} />
    </section>
  )
}

// Reusable PlanCard Component
interface PlanCardProps {
  plan: PaymentPlan
  billingPeriod: "monthly" | "yearly"
  isCurrentPlan: boolean
  currentTier: number
}

const PlanCard = ({ plan, billingPeriod, isCurrentPlan, currentTier }: PlanCardProps) => {
  const { data: iapProduct } = useIAPProduct(
    billingPeriod === "yearly" ? plan.appleProductIdentifierAnnual : plan.appleProductIdentifier,
  )
  const purchaseIAPMutation = usePurchaseIAPProduct()
  const { t } = useTranslation("settings")
  const getPlanActionType = ():
    | "current"
    | "upgrade"
    | "coming-soon"
    | "in-trial"
    | "switch"
    | "new"
    | null => {
    if (plan.isComingSoon) return "coming-soon"
    switch (true) {
      case isCurrentPlan: {
        return "current"
      }
      case plan.tier > currentTier && !!plan.planID && currentTier !== 0: {
        return "upgrade"
      }
      case plan.tier > currentTier && !!plan.planID && currentTier === 0: {
        return "new"
      }
      // case plan.tier < currentTier && !!plan.planID: {
      //   return "switch"
      // }
      default: {
        return null
      }
    }
  }

  const actionType = getPlanActionType()
  const upgradePlanMutation = useUpgradePlan({
    plan: plan.planID,
    annual: billingPeriod === "yearly",
  })

  // Calculate price and period based on billing period
  const regularPrice =
    billingPeriod === "yearly" ? plan.priceInDollarsAnnual / 12 : plan.priceInDollars
  const discountPrice =
    billingPeriod === "yearly"
      ? (plan.priceInDollarsInDiscountAnnual || 0) / 12
      : plan.priceInDollarsInDiscount
  const period = plan.role === UserRole.Free ? "" : "month"

  // Calculate discount percentage from prices
  const hasDiscount =
    discountPrice &&
    discountPrice > 0 &&
    discountPrice < regularPrice &&
    discountPrice !== regularPrice

  // Use discount price if available, otherwise use regular price
  const finalPrice = hasDiscount ? discountPrice : regularPrice
  const regularPriceForStrike = hasDiscount && regularPrice > 0 ? regularPrice : undefined

  // Get plan description from i18n
  const planDescriptionKey = `plan.descriptions.${plan.role}` as const
  const planDescription = t(planDescriptionKey, { defaultValue: "" })

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200",
        actionType === "upgrade"
          ? "border-accent/40 bg-background shadow-sm hover:border-accent/60 hover:shadow-md"
          : "border-fill-tertiary bg-background hover:border-fill-secondary",
        plan.isComingSoon && "opacity-75",
        isCurrentPlan && "border-blue/30",
      )}
    >
      <PlanBadges isPopular={plan.isPopular || false} />

      <div className="flex h-full flex-col justify-between gap-4 p-4 @md:p-5">
        <PlanHeader
          title={plan.name}
          price={finalPrice}
          regularPrice={regularPriceForStrike}
          period={period}
          description={planDescription}
          discountDescription={plan.discountDescription}
        />

        <PlanAction
          actionType={actionType}
          upgradeButtonText={plan.upgradeButtonText}
          isLoading={upgradePlanMutation.isPending || purchaseIAPMutation.isPending}
          onSelect={
            !plan.isComingSoon && !isCurrentPlan
              ? () => {
                  if (iapProduct) {
                    purchaseIAPMutation.mutate(iapProduct.productIdentifier)
                    return
                  }
                  upgradePlanMutation.mutate()
                }
              : undefined
          }
        />
      </div>

      {/* Subtle bottom accent line */}
      {actionType === "upgrade" && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      )}
    </div>
  )
}

// Plan card sub-components
const PlanBadges = ({ isPopular }: { isPopular: boolean }) => (
  <>
    {isPopular && (
      <div className="absolute -top-px right-4 z-10">
        <div className="rounded-b-lg bg-gradient-to-r from-accent to-accent/90 px-2.5 py-1 text-caption font-medium text-white shadow-sm">
          Most Popular
        </div>
      </div>
    )}
  </>
)

const PlanHeader = ({
  title,
  price,
  regularPrice,
  period,
  description,
  discountDescription,
}: {
  title: string
  price: number
  regularPrice?: number
  period: string
  description?: string
  discountDescription?: string
}) => (
  <div className="space-y-2.5">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <NumberFlow
          className="text-2xl font-bold"
          value={price}
          locales="en-US"
          format={{ style: "currency", currency: "USD", trailingZeroDisplay: "stripIfInteger" }}
        />
        {period && <span className="text-xs text-text-secondary @md:text-sm">/{period}</span>}

        {typeof regularPrice === "number" && regularPrice > 0 && (
          <span className="relative inline-block text-sm text-text-tertiary after:absolute after:inset-x-0 after:top-1/2 after:h-px after:w-full after:translate-y-1/2 after:bg-text-tertiary after:content-['']">
            <NumberFlow
              value={regularPrice}
              locales="en-US"
              format={{ style: "currency", currency: "USD", trailingZeroDisplay: "stripIfInteger" }}
            />
          </span>
        )}
      </div>
      {typeof regularPrice === "number" && regularPrice > 0 && !!discountDescription && (
        <span className="inline-flex items-center gap-1 rounded-md bg-green/10 px-1.5 py-0.5 text-xs font-medium text-green">
          {discountDescription}
        </span>
      )}
    </div>
    {description && <p className="text-xs leading-relaxed text-text-secondary">{description}</p>}
  </div>
)

const PlanAction = ({
  actionType,
  upgradeButtonText,
  onSelect,
  isLoading,
}: {
  actionType: "current" | "upgrade" | "coming-soon" | "in-trial" | "switch" | "new" | null
  upgradeButtonText?: string
  onSelect?: () => void
  isLoading?: boolean
}) => {
  const { data: activeSubscription } = useActiveSubscription()
  const serverConfig = useServerConfigs()
  const stripePortalLink = serverConfig?.STRIPE_PORTAL_LINK
  const canManageSubscription = !!activeSubscription && !!stripePortalLink

  const getButtonConfig = () => {
    switch (actionType) {
      case "coming-soon": {
        return {
          text: "Coming Soon",
          icon: "i-mgc-time-cute-re",
          variant: "outline" as const,
          disabled: true,
        }
      }
      case "current": {
        return {
          text: canManageSubscription ? "Manage Subscription" : "Current Plan",
          icon: undefined,
          variant: "outline" as const,
          className: !canManageSubscription ? "text-text-secondary" : undefined,
          disabled: !canManageSubscription,
        }
      }
      case "in-trial": {
        return {
          text: "In Trial",
          icon: "i-mgc-stopwatch-cute-re",
          variant: "outline" as const,
          disabled: false,
        }
      }
      case "new": {
        return {
          text: upgradeButtonText || "Upgrade",
          icon: "i-mgc-arrow-up-cute-re",
          className:
            "bg-gradient-to-r from-accent to-accent/90 text-white hover:from-accent/95 hover:to-accent/85",
          disabled: false,
        }
      }
      case "upgrade": {
        return {
          text: "Upgrade",
          icon: "i-mgc-arrow-up-cute-re",
          className:
            "bg-gradient-to-r from-accent to-accent/90 text-white hover:from-accent/95 hover:to-accent/85",
          disabled: false,
        }
      }
      case "switch": {
        return {
          text: "Switch Plan",
          icon: "i-mgc-transfer-cute-re",
          className:
            "bg-gradient-to-r from-accent to-accent/90 text-white font-semibold hover:from-accent/95 hover:to-accent/85",
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
    <Button
      variant={buttonConfig.variant}
      buttonClassName={cn(
        "w-full h-9 text-sm font-medium transition-all duration-200",
        buttonConfig.className,
      )}
      disabled={buttonConfig.disabled}
      onClick={
        actionType === "current" && canManageSubscription
          ? () => window.open(stripePortalLink, "_blank")
          : onSelect
      }
      isLoading={isLoading}
    >
      <span className="flex items-center justify-center gap-1.5">
        {buttonConfig.icon && <i className={cn(buttonConfig.icon, "text-sm")} />}
        <span>{buttonConfig.text}</span>
      </span>
    </Button>
  )
}

const PlanComparisonTable = ({ plans }: { plans: PaymentPlan[] }) => {
  const { t } = useTranslation("settings")

  // Get all unique feature keys
  const allFeatureKeys = Array.from(
    new Set(plans.flatMap((plan) => Object.keys(plan.limit))),
  ) as (keyof PaymentFeature)[]

  // Filter out features that are all false/0/null
  const visibleFeatureKeys = allFeatureKeys.filter((key) =>
    plans.some((plan) => {
      const value = plan.limit[key]
      if (value == null) return false
      if (typeof value === "boolean" && !value) return false
      if (typeof value === "number" && value === 0) return false
      return true
    }),
  )

  return (
    <div className="overflow-hidden rounded-xl border border-fill-tertiary bg-background">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-fill-tertiary bg-fill-secondary/50">
              <th className="sticky left-0 z-10 w-44 bg-fill-secondary/50 px-4 py-3 text-left text-sm font-semibold">
                Features
              </th>
              {plans.map((plan) => (
                <th key={plan.name} className="px-4 py-3 text-center text-sm font-semibold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleFeatureKeys.map((featureKey, index) => (
              <tr
                key={featureKey}
                className={cn(
                  "border-b border-fill-tertiary transition-colors hover:bg-fill-secondary/30",
                  index % 2 === 0 ? "bg-background" : "bg-fill-secondary/20",
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium">
                  {t(`plan.features.${featureKey}`, { defaultValue: featureKey })}
                </td>
                {plans.map((plan) => {
                  const value = plan.limit[featureKey]
                  const formattedValue = formatFeatureValue(featureKey, value, t)

                  return (
                    <td
                      key={`${plan.name}-${featureKey}`}
                      className="px-4 py-3 text-center text-sm"
                    >
                      <span
                        className={cn(
                          "font-medium",
                          formattedValue === "—" && "text-text-tertiary",
                          formattedValue === "✓" && "text-green",
                          (formattedValue === "Unlimited" ||
                            formattedValue.startsWith("×") ||
                            formattedValue.startsWith("All")) &&
                            "text-accent",
                          formattedValue.length > 10 && "text-xs",
                        )}
                      >
                        {formattedValue}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
