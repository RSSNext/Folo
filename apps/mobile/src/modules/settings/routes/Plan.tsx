import { UserRole, UserRoleName } from "@follow/constants"
import { useRoleEndAt, useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import type { ProductPurchase } from "expo-iap"
import { useIAP } from "expo-iap"
import { openURL } from "expo-linking"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
// Plan configuration types
import { Text } from "@/src/components/ui/typography/Text"
import { CheckLineIcon } from "@/src/icons/check_line"
import { TimeCuteReIcon } from "@/src/icons/time_cute_re"
import { followClient } from "@/src/lib/api-client"
import { authClient } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { isIOS } from "@/src/lib/platform"
import { proxyEnv } from "@/src/lib/proxy-env"

import { ReferralScreen } from "./Referral"

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
  [UserRole.Admin]: 4,
  // Admin has highest tier
  [UserRole.Free]: 1,
  [UserRole.Trial]: 1,
  // Same as Free (deprecated)
  [UserRole.PreProTrial]: 2,
  [UserRole.Pro]: 3,
  [UserRole.Plus]: 4,
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
    title: UserRoleName[UserRole.Pro],
    price: "$1 or 3 invitations",
    period: "",
    features: ["1000 feeds and lists", "10 inboxes", "10 actions", "100 webhooks"],
    isPopular: false,
    role: UserRole.Pro,
    tier: PLAN_TIER_MAP[UserRole.Pro],
  },
  {
    id: "pro",
    title: UserRoleName[UserRole.Pro],
    price: "Coming soon",
    period: "",
    features: [`Everything in ${UserRoleName[UserRole.Pro]}`, "Advanced AI features"],
    isPopular: false,
    role: UserRole.Pro,
    isComingSoon: true,
    tier: PLAN_TIER_MAP[UserRole.Pro],
  },
]
const useReferralInfoQuery = () => {
  return useQuery({
    queryKey: ["referral", "info"],
    queryFn: () => followClient.api.referrals.getReferrals().then((res) => res.data),
  })
}
export const PlanScreen: NavigationControllerView = () => {
  const { connected, getProducts, requestPurchase, validateReceipt } = useIAP({
    onPurchaseSuccess: (purchase) => {
      validatePurchase(purchase)
    },
    onPurchaseError: (error) => {
      console.error("Purchase failed:", error)
    },
  })
  useEffect(() => {
    if (connected) {
      getProducts(["is.follow.propreview"])
    }
  }, [connected])
  const validatePurchase = async (purchase: ProductPurchase) => {
    if (!purchase.transactionId) {
      return
    }
    try {
      const result = await validateReceipt(purchase.transactionId)
      if (result.isValid) {
        followClient.api.referrals.verifyReceipt({
          appReceipt: result.receiptData,
        })
      }
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }
  const navigation = useNavigation()
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3
  const { data: referralInfo } = useReferralInfoQuery()
  const validInvitationsAmount = referralInfo?.invitations.filter((i) => i.usedAt).length || 0
  const role = useUserRole()
  const roleEndDate = useRoleEndAt()
  const daysLeft = roleEndDate
    ? Math.ceil((roleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const progress = (validInvitationsAmount / requiredInvitationsAmount) * 100
  const upgradePlanMutation = useMutation({
    mutationFn: async () => {
      if (isIOS) {
        await requestPurchase({
          request: {
            sku: "is.follow.propreview",
          },
        })
      } else {
        const res = await authClient.subscription.upgrade({
          plan: "folo pro preview",
          successUrl: "folo://refresh",
          cancelUrl: proxyEnv.WEB_URL,
          disableRedirect: true,
        })
        if (res.data?.url) {
          openURL(res.data.url)
        }
      }
    },
  })
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.plan.long")} />}
    >
      <View className="gap-4 p-4">
        {PLAN_CONFIGS.map((plan) => {
          const isProPreview = plan.id === "pro-preview"
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentUserRole={role || null}
              daysLeft={isProPreview ? daysLeft : null}
              onUpgrade={isProPreview ? () => upgradePlanMutation.mutate() : undefined}
              disabled={isProPreview && upgradePlanMutation.isPending}
              isCurrentPlan={
                role === plan.role || (plan.role === UserRole.Pro && role === UserRole.PreProTrial)
              }
            />
          )
        })}
      </View>

      <View className="mx-4 rounded-lg bg-secondary-system-grouped-background p-4">
        <View className="mb-4 flex-row items-center gap-2">
          <View className="rounded-full bg-accent p-2">
            <TimeCuteReIcon color="#fff" width={16} height={16} />
          </View>
          <View>
            <Text className="font-medium text-label">Current Status</Text>
            <Text className="text-sm text-label">
              {role === UserRole.Pro
                ? "You have an active Pro plan"
                : role === UserRole.PreProTrial
                  ? `Pro Preview trial expires ${dayjs(roleEndDate).format("MMMM D, YYYY")} (${daysLeft} days left)`
                  : "Start your journey with our referral program"}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-medium text-label">Referral Progress</Text>
          <Text className="text-label">
            {validInvitationsAmount} / {requiredInvitationsAmount}
          </Text>
        </View>
        <View className="h-2 w-full rounded-full bg-system-grouped-background">
          <View
            className="h-2 rounded-full bg-accent"
            style={{
              width: `${progress}%`,
            }}
          />
        </View>

        {role !== UserRole.Pro && (
          <View className="mt-4 flex-row items-center gap-2 self-end">
            <Pressable
              className="rounded-lg bg-accent p-2"
              onPress={() => {
                navigation.pushControllerView(ReferralScreen)
              }}
            >
              <Text className="text-white">{`Invite ${serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3} friends`}</Text>
            </Pressable>
            <Text className="text-label">or</Text>
            <Pressable
              className="rounded-lg bg-accent p-2 disabled:opacity-50"
              disabled={upgradePlanMutation.isPending}
              onPress={() => {
                upgradePlanMutation.mutate()
              }}
            >
              {/* TODO current not return back this value */}
              {/* @ts-expect-error current not return back this value */}
              <Text className="text-white">{`Pay $${serverConfigs?.REFERRAL_PRO_PREVIEW_STRIPE_PRICE_IN_DOLLAR || 1}`}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeNavigationScrollView>
  )
}
interface PlanCardProps {
  plan: Plan
  currentUserRole: UserRole | null
  isCurrentPlan: boolean
  daysLeft: number | null
  onUpgrade?: () => void
  disabled?: boolean
}
function PlanCard({ plan, isCurrentPlan, daysLeft, onUpgrade, disabled }: PlanCardProps) {
  return (
    <View
      className={cn(
        "min-w-[160px] rounded-lg bg-secondary-system-grouped-background p-4 shadow-md",
        isCurrentPlan && "border-2 border-accent",
        plan.isComingSoon && "opacity-75",
      )}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-label">{plan.title}</Text>
        <Text className="text-lg font-bold text-label">{plan.price}</Text>
      </View>

      {plan.features.map((feature, index) => (
        <View key={index} className="mb-2 flex-row items-center gap-2">
          <View className="rounded-full bg-green/10 p-[2px]">
            <CheckLineIcon width={16} height={16} color="rgb(40, 205, 65)" />
          </View>
          <Text className="text-sm text-label">{feature}</Text>
        </View>
      ))}

      {plan.isComingSoon ? (
        <Text className="mt-2 rounded-lg border border-opaque-separator/40 p-2 text-center text-sm text-label/40">
          Coming soon
        </Text>
      ) : isCurrentPlan && daysLeft !== null ? (
        <Text className="mt-2 rounded-lg border border-opaque-separator/40 p-2 text-center text-sm text-label/40">
          {`In Trial (${daysLeft} days left)`}
        </Text>
      ) : isCurrentPlan ? (
        <Text className="mt-2 rounded-lg border border-opaque-separator/40 p-2 text-center text-sm text-label/40">
          Current Plan
        </Text>
      ) : (
        <Pressable className={cn(disabled && "opacity-50")} onPress={onUpgrade} disabled={disabled}>
          <Text className="mt-2 rounded-lg border border-opaque-separator p-2 text-center text-sm text-label">
            Upgrade
          </Text>
        </Pressable>
      )}
    </View>
  )
}
