import { UserRole, UserRoleName } from "@follow/constants"
import { useRoleEndAt, useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import type { ProductPurchase } from "expo-iap"
import { useIAP } from "expo-iap"
import { openURL } from "expo-linking"
import { useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Linking, Pressable, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInformationCell,
  GroupedInsetListCard,
} from "@/src/components/ui/grouped/GroupedList"
// Plan configuration types
import { Text } from "@/src/components/ui/typography/Text"
import { CheckLineIcon } from "@/src/icons/check_line"
import { PowerOutlineIcon } from "@/src/icons/power_outline"
import { TimeCuteReIcon } from "@/src/icons/time_cute_re"
import { apiClient } from "@/src/lib/api-fetch"
import { authClient } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { isIOS } from "@/src/lib/platform"
import { proxyEnv } from "@/src/lib/proxy-env"
import { accentColor } from "@/src/theme/colors"

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
  // Same tier as PrePro
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
const useReferralInfoQuery = () => {
  return useQuery({
    queryKey: ["referral", "info"],
    queryFn: () => apiClient.referrals.$get().then((res) => res.data),
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
        apiClient.referrals["verify-receipt"].$post({
          json: {
            appReceipt: result.receiptData,
          },
        })
      }
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }
  const navigation = useNavigation()
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const ruleLink = serverConfigs?.REFERRAL_RULE_LINK
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
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.plan.short")}
            icon={<PowerOutlineIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor={accentColor}
          >
            <Trans
              ns="settings"
              i18nKey="plan.description"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-3 text-left text-base leading-tight">
                  {children}
                </Text>
              )}
              components={{
                Link: (
                  <Text
                    className="text-accent"
                    onPress={() => {
                      if (ruleLink) {
                        Linking.openURL(ruleLink)
                      }
                    }}
                  >
                    Learn more
                  </Text>
                ),
              }}
            />
          </GroupedInformationCell>
        </GroupedInsetListCard>
      </View>

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
                role === plan.role ||
                (plan.role === UserRole.PrePro && role === UserRole.PreProTrial)
              }
            />
          )
        })}
      </View>

      <View className="bg-secondary-system-grouped-background mx-4 rounded-lg p-4">
        <View className="mb-4 flex-row items-center gap-2">
          <View className="bg-accent rounded-full p-2">
            <TimeCuteReIcon color="#fff" width={16} height={16} />
          </View>
          <View>
            <Text className="text-label font-medium">Current Status</Text>
            <Text className="text-label text-sm">
              {role === UserRole.PrePro
                ? "You have an active Pro Preview plan"
                : role === UserRole.PreProTrial
                  ? `Pro Preview trial expires ${dayjs(roleEndDate).format("MMMM D, YYYY")} (${daysLeft} days left)`
                  : "Start your journey with our referral program"}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-label font-medium">Referral Progress</Text>
          <Text className="text-label">
            {validInvitationsAmount} / {requiredInvitationsAmount}
          </Text>
        </View>
        <View className="bg-system-grouped-background h-2 w-full rounded-full">
          <View
            className="bg-accent h-2 rounded-full"
            style={{
              width: `${progress}%`,
            }}
          />
        </View>

        {role !== UserRole.PrePro && (
          <View className="mt-4 flex-row items-center gap-2 self-end">
            <Pressable
              className="bg-accent rounded-lg p-2"
              onPress={() => {
                navigation.pushControllerView(ReferralScreen)
              }}
            >
              <Text className="text-white">{`Invite ${serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3} friends`}</Text>
            </Pressable>
            <Text className="text-label">or</Text>
            <Pressable
              className="bg-accent rounded-lg p-2 disabled:opacity-50"
              disabled={upgradePlanMutation.isPending}
              onPress={() => {
                upgradePlanMutation.mutate()
              }}
            >
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
        "bg-secondary-system-grouped-background min-w-[160px] rounded-lg p-4 shadow-md",
        isCurrentPlan && "border-accent border-2",
        plan.isComingSoon && "opacity-75",
      )}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-label text-lg font-bold">{plan.title}</Text>
        <Text className="text-label text-lg font-bold">{plan.price}</Text>
      </View>

      {plan.features.map((feature, index) => (
        <View key={index} className="mb-2 flex-row items-center gap-2">
          <View className="bg-green/10 rounded-full p-[2px]">
            <CheckLineIcon width={16} height={16} color="rgb(40, 205, 65)" />
          </View>
          <Text className="text-label text-sm">{feature}</Text>
        </View>
      ))}

      {plan.isComingSoon ? (
        <Text className="text-label/40 border-opaque-separator/40 mt-2 rounded-lg border p-2 text-center text-sm">
          Coming soon
        </Text>
      ) : isCurrentPlan && daysLeft !== null ? (
        <Text className="text-label/40 border-opaque-separator/40 mt-2 rounded-lg border p-2 text-center text-sm">
          {`In Trial (${daysLeft} days left)`}
        </Text>
      ) : isCurrentPlan ? (
        <Text className="text-label/40 border-opaque-separator/40 mt-2 rounded-lg border p-2 text-center text-sm">
          Current Plan
        </Text>
      ) : (
        <Pressable className={cn(disabled && "opacity-50")} onPress={onUpgrade} disabled={disabled}>
          <Text className="text-label border-opaque-separator mt-2 rounded-lg border p-2 text-center text-sm">
            Upgrade
          </Text>
        </Pressable>
      )}
    </View>
  )
}
