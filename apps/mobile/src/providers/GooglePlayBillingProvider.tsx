import { useWhoami, whoamiQueryKey } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { FollowAPIError } from "@follow-app/client-sdk"
import { applicationId } from "expo-application"
import type { Purchase } from "expo-iap"
import { deepLinkToSubscriptions, ErrorCode, getAvailablePurchases, useIAP } from "expo-iap"
import type { PropsWithChildren } from "react"
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { followClient } from "@/src/lib/api-client"
import { queryClient } from "@/src/lib/query-client"
import { toast } from "@/src/lib/toast"

import type { GooglePlaySubscriptionProduct } from "./google-play-purchase"
import { getGooglePlayProductIds, toGooglePlaySubscriptionProduct } from "./google-play-purchase"

const billingSubscriptionQueryKey = ["billingSubscription"]

type GooglePlayBillingContextValue = {
  connected: boolean
  products: ReadonlyMap<string, GooglePlaySubscriptionProduct>
  isPurchasing: boolean
  isProcessingPurchase: boolean
  isRestoring: boolean
  loadSubscriptions: (skus: string[]) => Promise<void>
  requestSubscriptionPurchase: (input: {
    sku: string
    accountToken?: string | null
    // The Google Play product the user subscribes to now, replaced by an upgrade
    replacingProductId?: string | null
  }) => Promise<void>
  restoreSubscriptionPurchases: () => Promise<void>
  openSubscriptionManagement: (productId?: string | null) => Promise<void>
}

const GooglePlayBillingContext = createContext<GooglePlayBillingContextValue | null>(null)

const refreshBillingState = async () => {
  await Promise.allSettled([
    userSyncService.whoami(),
    queryClient.invalidateQueries({ queryKey: whoamiQueryKey }),
    queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey }),
  ])
}

// API errors carry the request after the server message; only the message is meant for people
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof FollowAPIError) {
    return error.message.split("\nRequest:")[0]?.trim() || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

const openSubscriptionManagement = async (productId?: string | null) => {
  await deepLinkToSubscriptions({
    packageNameAndroid: applicationId,
    skuAndroid: productId ?? undefined,
  })
}

// Fails when the device has no usable Play Store, e.g. no Google account is signed in
const getOwnedPurchases = async (unavailableMessage: string) => {
  try {
    return await getAvailablePurchases()
  } catch {
    throw new Error(unavailableMessage)
  }
}

const isAcknowledged = (purchase: Purchase) =>
  "isAcknowledgedAndroid" in purchase && purchase.isAcknowledgedAndroid === true

/**
 * Google Play Billing for Android installs from Google Play. The server verifies and acknowledges
 * each purchase with the Google Play Developer API before the app acknowledges it as well.
 */
export const GooglePlayBillingProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const whoami = useWhoami()
  const userId = whoami?.id

  const knownProductIds = useMemo(
    () => new Set(getGooglePlayProductIds(serverConfigs?.PAYMENT_PLAN_LIST)),
    [serverConfigs?.PAYMENT_PLAN_LIST],
  )

  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const processingTokensRef = useRef(new Set<string>())
  const handlePurchaseRef = useRef<(purchase: Purchase) => void>(() => {})
  const restorePurchasesRef = useRef<() => Promise<void>>(async () => {})

  const { connected, subscriptions, fetchProducts, finishTransaction, requestPurchase } = useIAP({
    onPurchaseSuccess: (purchase) => handlePurchaseRef.current(purchase),
    onPurchaseError: (error) => {
      setIsPurchasing(false)
      // The Google account already has this subscription, so link it instead of buying it again
      if (error.code === ErrorCode.AlreadyOwned) {
        void restorePurchasesRef.current()
        return
      }
      if (error.code !== ErrorCode.UserCancelled) {
        toast.error(error.message || t("subscription.actions.upgrade_error"))
      }
    },
  })

  const products = useMemo(() => {
    const map = new Map<string, GooglePlaySubscriptionProduct>()
    for (const subscription of subscriptions) {
      const product = toGooglePlaySubscriptionProduct(subscription)
      if (product) {
        map.set(product.id, product)
      }
    }
    return map
  }, [subscriptions])

  const verifyPurchase = useCallback(
    async (purchase: Purchase) => {
      const response = await followClient.request<{ code: number; message?: string }>(
        "/billing/google/verify",
        {
          method: "POST",
          body: { purchaseToken: purchase.purchaseToken, productId: purchase.productId },
        },
      )
      if (response.code !== 0) {
        throw new Error(response.message || t("subscription.actions.upgrade_error"))
      }
    },
    [t],
  )

  // The server acknowledges every purchase it verifies; acknowledging here only covers a failed call
  const acknowledgePurchase = useCallback(
    (purchase: Purchase) => finishTransaction({ purchase, isConsumable: false }).catch(() => {}),
    [finishTransaction],
  )

  const processPurchase = useCallback(
    async (purchase: Purchase, { silent }: { silent: boolean }) => {
      const { purchaseToken } = purchase
      if (
        !purchaseToken ||
        !knownProductIds.has(purchase.productId) ||
        processingTokensRef.current.has(purchaseToken)
      ) {
        return
      }

      if (purchase.purchaseState === "pending") {
        if (!silent) {
          toast.info(t("subscription.actions.purchase_pending"))
        }
        return
      }
      if (purchase.purchaseState !== "purchased") {
        return
      }

      processingTokensRef.current.add(purchaseToken)
      if (!silent) {
        setIsProcessingPurchase(true)
      }
      try {
        await verifyPurchase(purchase)
        await acknowledgePurchase(purchase)
        await refreshBillingState()
      } catch (error) {
        if (!silent) {
          toast.error(getErrorMessage(error, t("subscription.actions.upgrade_error")))
        }
      } finally {
        processingTokensRef.current.delete(purchaseToken)
        if (!silent) {
          setIsProcessingPurchase(false)
        }
      }
    },
    [acknowledgePurchase, knownProductIds, t, verifyPurchase],
  )

  useEffect(() => {
    handlePurchaseRef.current = (purchase) => {
      setIsPurchasing(false)
      void processPurchase(purchase, { silent: false })
    }
  }, [processPurchase])

  // A purchase can finish while the app is closed, or after a pending payment clears
  useEffect(() => {
    if (!connected || !userId || knownProductIds.size === 0) {
      return
    }

    void (async () => {
      const purchases = await getAvailablePurchases().catch(() => [])
      for (const purchase of purchases) {
        if (!isAcknowledged(purchase)) {
          await processPurchase(purchase, { silent: true })
        }
      }
    })()
  }, [connected, knownProductIds, processPurchase, userId])

  const loadSubscriptions = useCallback(
    async (skus: string[]) => {
      if (skus.length > 0) {
        await fetchProducts({ skus, type: "subs" })
      }
    },
    [fetchProducts],
  )

  const requestSubscriptionPurchase = useCallback<
    GooglePlayBillingContextValue["requestSubscriptionPurchase"]
  >(
    async ({ sku, accountToken, replacingProductId }) => {
      const product = products.get(sku)
      if (!product) {
        throw new Error(t("subscription.actions.google_play_unavailable"))
      }

      let replacement: {
        purchaseToken: string
        subscriptionProductReplacementParams: {
          oldProductId: string
          replacementMode: "with-time-proration"
        }
      } | null = null
      if (replacingProductId && replacingProductId !== sku) {
        const currentPurchase = (
          await getOwnedPurchases(t("subscription.actions.google_play_not_connected"))
        ).find((purchase) => purchase.productId === replacingProductId && purchase.purchaseToken)
        // Google Play can only change a subscription owned by the signed-in Google account
        if (!currentPurchase?.purchaseToken) {
          throw new Error(t("subscription.actions.google_play_other_account"))
        }
        replacement = {
          purchaseToken: currentPurchase.purchaseToken,
          subscriptionProductReplacementParams: {
            oldProductId: replacingProductId,
            replacementMode: "with-time-proration",
          },
        }
      }

      setIsPurchasing(true)
      try {
        await requestPurchase({
          type: "subs",
          request: {
            google: {
              skus: [sku],
              subscriptionOffers: [{ sku, offerToken: product.offerToken }],
              obfuscatedAccountId: accountToken ?? undefined,
              ...replacement,
            },
          },
        })
      } catch (error) {
        setIsPurchasing(false)
        throw error
      }
    },
    [products, requestPurchase, t],
  )

  const restoreSubscriptionPurchases = useCallback(async () => {
    if (!connected) {
      toast.error(t("subscription.actions.google_play_not_connected"))
      return
    }

    setIsRestoring(true)
    try {
      const purchases = (
        await getOwnedPurchases(t("subscription.actions.google_play_not_connected"))
      )
        .filter(
          (purchase) =>
            purchase.purchaseToken &&
            purchase.purchaseState === "purchased" &&
            knownProductIds.has(purchase.productId),
        )
        .sort((left, right) => right.transactionDate - left.transactionDate)
      if (purchases.length === 0) {
        throw new Error(t("subscription.actions.restore_not_found_google"))
      }

      let lastError: unknown
      let restored = false
      for (const purchase of purchases) {
        try {
          await verifyPurchase(purchase)
          await acknowledgePurchase(purchase)
          restored = true
        } catch (error) {
          lastError = error
        }
      }
      if (!restored) {
        throw lastError ?? new Error(t("subscription.actions.restore_error"))
      }

      await refreshBillingState()
      toast.success(t("subscription.actions.restore_success"))
    } catch (error) {
      toast.error(getErrorMessage(error, t("subscription.actions.restore_error")))
    } finally {
      setIsRestoring(false)
    }
  }, [acknowledgePurchase, connected, knownProductIds, t, verifyPurchase])

  useEffect(() => {
    restorePurchasesRef.current = restoreSubscriptionPurchases
  }, [restoreSubscriptionPurchases])

  const contextValue = useMemo<GooglePlayBillingContextValue>(
    () => ({
      connected,
      products,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
      openSubscriptionManagement,
    }),
    [
      connected,
      products,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
    ],
  )

  return <GooglePlayBillingContext value={contextValue}>{children}</GooglePlayBillingContext>
}

// Null outside Google Play installs, which do not mount the provider
export const useGooglePlayBilling = () => use(GooglePlayBillingContext)
