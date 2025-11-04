import { UserRole, UserRoleName } from "@follow/constants"
import { useRoleEndAt, useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import type { StatusConfigs } from "@follow-app/client-sdk"
import { useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"
import { openURL } from "expo-linking"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { LayoutChangeEvent } from "react-native"
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Text } from "@/src/components/ui/typography/Text"
import { CheckLineIcon } from "@/src/icons/check_line"
import { authClient } from "@/src/lib/auth"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { proxyEnv } from "@/src/lib/proxy-env"
import { toast } from "@/src/lib/toast"
import { useColor } from "@/src/theme/colors"

type PaymentPlan = NonNullable<StatusConfigs["PAYMENT_PLAN_LIST"]>[number]
type PaymentFeature = PaymentPlan["limit"]
type BillingPeriod = "monthly" | "yearly"

const BILLING_SEGMENTS: BillingPeriod[] = ["monthly", "yearly"]

type SegmentLayout = {
  width: number
  x: number
}

const styles = StyleSheet.create({
  billingSegmentIndicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    borderRadius: 9999,
  },
})

type UpgradeVariables = {
  planId: string
  annual: boolean
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  trailingZeroDisplay: "stripIfInteger",
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const formatFeatureValue = (
  key: keyof PaymentFeature,
  value: PaymentFeature[keyof PaymentFeature] | undefined | null,
): string => {
  if (value == null) {
    return "—"
  }

  if (typeof value === "boolean") {
    return value ? "✓" : "—"
  }

  if (key === "PRIORITY_SUPPORT" && typeof value === "number") {
    return "⭐️".repeat(value)
  }

  if (value === Number.MAX_SAFE_INTEGER) {
    return "Unlimited"
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

const isFeatureValueVisible = (value: PaymentFeature[keyof PaymentFeature] | null | undefined) => {
  if (value == null) {
    return false
  }

  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value > 0
  }

  return true
}

export const SubscriptionScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const role = useUserRole()
  const roleEndAt = useRoleEndAt()

  const plans = useMemo(() => serverConfigs?.PAYMENT_PLAN_LIST ?? [], [serverConfigs])
  const isPaymentEnabled = serverConfigs?.PAYMENT_ENABLED

  const defaultBillingPeriod: BillingPeriod = "yearly"
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(defaultBillingPeriod)

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
  }, [plans])

  const currentPlan = useMemo(() => {
    return sortedPlans.find((plan) => plan.role === role) ?? null
  }, [sortedPlans, role])

  const daysLeft = useMemo(() => {
    if (!roleEndAt) {
      return null
    }

    const difference = dayjs(roleEndAt).diff(dayjs(), "day")
    return Math.max(difference, 0)
  }, [roleEndAt])

  const averageSavings = useMemo(() => {
    const paidPlans = sortedPlans.filter(
      (plan) => (plan.priceInDollars ?? 0) > 0 && (plan.priceInDollarsAnnual ?? 0) > 0,
    )

    if (paidPlans.length === 0) {
      return 0
    }

    const total = paidPlans.reduce((acc, plan) => {
      const monthlyTotal = (plan.priceInDollars ?? 0) * 12
      const yearlyTotal = plan.priceInDollarsAnnual ?? 0
      if (monthlyTotal === 0) {
        return acc
      }
      const savings = ((monthlyTotal - yearlyTotal) / monthlyTotal) * 100
      return acc + savings
    }, 0)

    return Math.round(total / paidPlans.length)
  }, [sortedPlans])

  const upgradeMutation = useMutation<void, Error, UpgradeVariables>({
    mutationFn: async ({ planId, annual }) => {
      const response = await authClient.subscription.upgrade({
        plan: planId,
        annual,
        successUrl: "folo://refresh",
        cancelUrl: proxyEnv.WEB_URL,
        disableRedirect: true,
      })

      const redirectUrl =
        typeof response === "object" && response && "data" in response && response.data
          ? (response.data as { url?: string }).url
          : undefined

      if (redirectUrl) {
        await openURL(redirectUrl)
      }
    },
    onError: (error) => {
      const message = error.message?.trim() || t("subscription.actions.upgrade_error")
      toast.error(message)
    },
  })

  if (!isPaymentEnabled || sortedPlans.length === 0) {
    return (
      <SafeNavigationScrollView
        className="bg-system-grouped-background"
        Header={<NavigationBlurEffectHeaderView title={t("titles.subscription.long")} />}
      >
        <View className="flex-1 items-center justify-center px-6 py-12">
          <Text className="text-center text-base text-secondary-label">
            {t("subscription.unavailable")}
          </Text>
        </View>
      </SafeNavigationScrollView>
    )
  }

  const summaryTitle = currentPlan
    ? t("subscription.summary.current", { plan: currentPlan.name })
    : t("subscription.summary.free")

  let summarySubtitle = t("subscription.summary.free_description")
  if (role === UserRole.Pro || role === UserRole.Plus) {
    summarySubtitle = t("subscription.summary.active")
  } else if (daysLeft && daysLeft > 0 && role && role !== UserRole.Free) {
    summarySubtitle = t("subscription.summary.trial_expiring", {
      date: dayjs(roleEndAt).format("MMMM D, YYYY"),
      days: daysLeft,
    })
  }

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.subscription.long")} />}
    >
      <View className="gap-6 px-4 pb-10 pt-6">
        <View className="rounded-3xl bg-secondary-system-grouped-background p-5 shadow-sm">
          <Text className="text-xs font-semibold uppercase text-secondary-label">
            {t("subscription.summary.title")}
          </Text>
          <Text className="mt-2 text-2xl font-semibold text-label">{summaryTitle}</Text>
          <Text className="mt-2 text-sm leading-relaxed text-secondary-label">
            {summarySubtitle}
          </Text>
        </View>

        <BillingToggle
          value={billingPeriod}
          onChange={setBillingPeriod}
          averageSavings={averageSavings}
        />

        <View className="gap-4">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = plan.role === role
            const isProcessing =
              upgradeMutation.isPending && upgradeMutation.variables?.planId === plan.planID

            return (
              <PlanCard
                key={plan.planID ?? plan.name}
                plan={plan}
                billingPeriod={billingPeriod}
                isCurrentPlan={isCurrentPlan}
                onUpgrade={
                  plan.planID
                    ? () =>
                        upgradeMutation.mutate({
                          planId: plan.planID as string,
                          annual: billingPeriod === "yearly",
                        })
                    : undefined
                }
                isProcessing={isProcessing}
              />
            )
          })}
        </View>
      </View>
    </SafeNavigationScrollView>
  )
}

const BillingToggle = ({
  value,
  onChange,
  averageSavings,
}: {
  value: BillingPeriod
  onChange: (value: BillingPeriod) => void
  averageSavings: number
}) => {
  const { t } = useTranslation("settings")
  const activeBackground = useColor("systemBackground")
  const indicatorTranslate = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const segmentLayouts = useRef<Partial<Record<BillingPeriod, SegmentLayout>>>({})
  const [indicatorReady, setIndicatorReady] = useState(false)

  const animateIndicator = useCallback(
    (period: BillingPeriod, animated: boolean) => {
      const layout = segmentLayouts.current[period]
      if (!layout) return

      if (!animated) {
        indicatorTranslate.setValue(layout.x)
        indicatorWidth.setValue(layout.width)
        return
      }

      Animated.spring(indicatorTranslate, {
        toValue: layout.x,
        useNativeDriver: false,
        damping: 18,
        stiffness: 180,
      }).start()

      Animated.timing(indicatorWidth, {
        toValue: layout.width,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    },
    [indicatorTranslate, indicatorWidth],
  )

  const handleLayout = useCallback(
    (period: BillingPeriod) => (event: LayoutChangeEvent) => {
      const { width, x } = event.nativeEvent.layout
      segmentLayouts.current[period] = { width, x }
      const measuredAll = BILLING_SEGMENTS.every((option) => segmentLayouts.current[option])
      if (measuredAll && !indicatorReady) {
        setIndicatorReady(true)
        animateIndicator(value, false)
      }
    },
    [animateIndicator, indicatorReady, value],
  )

  useEffect(() => {
    if (indicatorReady) {
      animateIndicator(value, true)
    }
  }, [animateIndicator, indicatorReady, value])

  return (
    <View className="relative flex-row rounded-full bg-secondary-system-grouped-background p-1">
      {indicatorReady ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.billingSegmentIndicator,
            {
              backgroundColor: activeBackground,
              transform: [{ translateX: indicatorTranslate }],
              width: indicatorWidth,
            },
          ]}
        />
      ) : null}
      {BILLING_SEGMENTS.map((option) => {
        const selected = value === option
        const showSavings = option === "yearly" && averageSavings > 0
        const savingsLabel = t("subscription.billing.yearly_savings", { value: averageSavings })

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            onPress={() => {
              if (!selected) {
                onChange(option)
              }
            }}
            onLayout={handleLayout(option)}
            className="flex-1 items-center justify-center rounded-full px-4 py-3"
          >
            <View className="items-center">
              <Text
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-label" : "text-secondary-label",
                )}
              >
                <Text>
                  {option === "monthly"
                    ? t("subscription.billing.monthly")
                    : t("subscription.billing.yearly")}
                </Text>
                <Text
                  className={cn(
                    "text-center text-xs font-semibold text-green",
                    !showSavings && "opacity-0",
                  )}
                >
                  {" "}
                  {showSavings ? savingsLabel : " "}
                </Text>
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const PlanCard = ({
  plan,
  billingPeriod,
  isCurrentPlan,
  onUpgrade,
  isProcessing,
}: {
  plan: PaymentPlan
  billingPeriod: BillingPeriod
  isCurrentPlan: boolean
  onUpgrade?: () => void
  isProcessing?: boolean
}) => {
  const { t } = useTranslation("settings")

  const isPaidPlan = plan.role !== UserRole.Free

  const regularPrice = isPaidPlan
    ? billingPeriod === "yearly"
      ? (plan.priceInDollarsAnnual ?? 0) / 12
      : (plan.priceInDollars ?? 0)
    : 0

  const discountPrice = isPaidPlan
    ? billingPeriod === "yearly"
      ? (plan.priceInDollarsInDiscountAnnual ?? 0) / 12
      : (plan.priceInDollarsInDiscount ?? 0)
    : 0

  const hasDiscount = isPaidPlan && discountPrice > 0 && discountPrice < regularPrice

  const displayPrice = !isPaidPlan ? 0 : hasDiscount ? discountPrice : regularPrice
  const formattedPrice = isPaidPlan ? formatCurrency(displayPrice) : t("subscription.price.free")

  const formattedRegularPrice =
    hasDiscount && regularPrice > 0 ? formatCurrency(regularPrice) : undefined
  const discountPercentage = hasDiscount
    ? Math.round(((regularPrice - discountPrice) / regularPrice) * 100)
    : 0
  const discountLabel =
    discountPercentage > 0
      ? t("subscription.discount.tag", { value: discountPercentage })
      : undefined

  const priceAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    priceAnimation.setValue(0)
    Animated.spring(priceAnimation, {
      toValue: 1,
      useNativeDriver: false,
      damping: 14,
      stiffness: 180,
    }).start()
  }, [priceAnimation, displayPrice])

  const priceScale = priceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  })

  const priceTranslateY = priceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  })

  const periodLabel = !isPaidPlan
    ? ""
    : billingPeriod === "yearly"
      ? t("subscription.price.per_month_billed_yearly")
      : t("subscription.price.per_month")

  const planDescription = t(`plan.descriptions.${plan.role}` as const, { defaultValue: "" })

  const features = useMemo(() => {
    return (
      Object.entries(plan.limit || {}) as Array<
        [keyof PaymentFeature, PaymentFeature[keyof PaymentFeature]]
      >
    )
      .filter(([, value]) => isFeatureValueVisible(value))
      .slice(0, 6)
  }, [plan.limit])

  const actionType = useMemo(() => {
    if (plan.isComingSoon) {
      return "coming-soon" as const
    }
    if (isCurrentPlan) {
      return "current" as const
    }
    if (plan.planID) {
      return "upgrade" as const
    }
    return null
  }, [plan.isComingSoon, plan.planID, isCurrentPlan])

  const planNameFallback = plan.name || (plan.role ? UserRoleName[plan.role as UserRole] : "")

  return (
    <View
      className={cn(
        "rounded-3xl bg-secondary-system-grouped-background p-5",
        isCurrentPlan && "border border-accent/50 shadow-lg",
        plan.isComingSoon && "opacity-70",
      )}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-semibold text-label">{planNameFallback}</Text>
          {planDescription ? (
            <Text className="mt-1 text-sm leading-snug text-secondary-label">
              {planDescription}
            </Text>
          ) : null}
        </View>
        {plan.isPopular ? (
          <View className="rounded-full bg-accent px-2 py-1">
            <Text className="text-xs font-semibold text-white">
              {t("subscription.badge.popular")}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-4">
        <View className="flex-row items-baseline gap-2">
          <Animated.View
            style={{
              opacity: priceAnimation,
              transform: [{ scale: priceScale }, { translateY: priceTranslateY }],
            }}
          >
            <Text className="text-2xl font-bold text-label">{formattedPrice}</Text>
          </Animated.View>
          {periodLabel ? <Text className="text-xs text-secondary-label">{periodLabel}</Text> : null}
        </View>
        {formattedRegularPrice ? (
          <Text className="mt-1 text-xs text-secondary-label line-through">
            {formattedRegularPrice}
          </Text>
        ) : null}
        {discountLabel ? (
          <Text className="mt-1 text-xs font-semibold text-green">{discountLabel}</Text>
        ) : null}
      </View>

      <View className="mt-4 gap-2">
        {features.map(([featureKey, value]) => {
          const formattedValue = formatFeatureValue(featureKey, value)
          const showValue = !(typeof value === "boolean" && value)
          return (
            <View key={featureKey as string} className="flex-row items-center gap-3">
              <View className="rounded-full bg-green/15 p-1">
                <CheckLineIcon width={14} height={14} color="rgb(40, 205, 65)" />
              </View>
              <Text className="flex-1 text-sm text-label">
                {t(`plan.features.${featureKey}` as const, { defaultValue: featureKey })}
              </Text>
              {showValue ? (
                <Text
                  className={cn(
                    "text-sm font-medium",
                    formattedValue === "Unlimited" ? "text-accent" : "text-secondary-label",
                  )}
                >
                  {formattedValue === "✓" ? t("subscription.feature.included") : formattedValue}
                </Text>
              ) : (
                <Text className="text-sm font-medium text-secondary-label">
                  {t("subscription.feature.included")}
                </Text>
              )}
            </View>
          )
        })}
      </View>

      <PlanAction actionType={actionType} onUpgrade={onUpgrade} isProcessing={isProcessing} />
    </View>
  )
}

const PlanAction = ({
  actionType,
  onUpgrade,
  isProcessing,
}: {
  actionType: "current" | "upgrade" | "coming-soon" | null
  onUpgrade?: () => void
  isProcessing?: boolean
}) => {
  const { t } = useTranslation("settings")

  if (actionType === "coming-soon") {
    return (
      <Text className="mt-5 rounded-full border border-opaque-separator/60 px-4 py-2 text-center text-sm text-secondary-label">
        {t("subscription.actions.comingSoon")}
      </Text>
    )
  }

  if (actionType === "current") {
    return (
      <Text className="mt-5 rounded-full border border-opaque-separator/60 px-4 py-2 text-center text-sm text-secondary-label">
        {t("subscription.actions.current")}
      </Text>
    )
  }

  if (actionType === "upgrade" && onUpgrade) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onUpgrade}
        disabled={isProcessing}
        className="mt-5 h-11 items-center justify-center rounded-full bg-accent disabled:opacity-70"
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {t("subscription.actions.upgrade")}
          </Text>
        )}
      </Pressable>
    )
  }

  return null
}
