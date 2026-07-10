import { whoamiQueryKey } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { requireNativeModule } from "expo"
import type { ProductSubscription, Purchase } from "expo-iap"
import { ErrorCode, getTransactionJwsIOS, useIAP } from "expo-iap"
import type { PropsWithChildren } from "react"
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { followClient } from "@/src/lib/api-client"
import { proxyEnv } from "@/src/lib/proxy-env"
import { queryClient } from "@/src/lib/query-client"
import { toast } from "@/src/lib/toast"

const billingSubscriptionQueryKey = ["billingSubscription"]

type BillingSubscriptionResponse = {
  source: "stripe" | "apple" | null
  plan: string | null
  status: string | null
  productId: string | null
  periodEnd: string | null
  trialEnd: string | null
  canManage: boolean
}

type IAPPurchaseError = {
  code?: ErrorCode | string
  message?: string
}

type AppleIAPContextValue = {
  connected: boolean
  subscriptions: ProductSubscription[]
  isPurchasing: boolean
  isProcessingPurchase: boolean
  isRestoring: boolean
  loadSubscriptions: (skus: string[]) => Promise<void>
  requestSubscriptionPurchase: (input: {
    sku: string
    appAccountToken?: string | null
  }) => Promise<void>
  restoreSubscriptionPurchases: () => Promise<void>
}

const AppleIAPContext = createContext<AppleIAPContextValue | null>(null)

const refreshBillingState = async () => {
  await Promise.allSettled([
    userSyncService.whoami(),
    queryClient.invalidateQueries({ queryKey: whoamiQueryKey }),
    queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey }),
  ])
}

export const AppleIAPProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const knownSubscriptionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const plan of serverConfigs?.PAYMENT_PLAN_LIST ?? []) {
      if (plan.appleProductIdentifier) {
        ids.add(plan.appleProductIdentifier)
      }
      if (plan.appleProductIdentifierAnnual) {
        ids.add(plan.appleProductIdentifierAnnual)
      }
    }
    return ids
  }, [serverConfigs?.PAYMENT_PLAN_LIST])

  const availablePurchasesRef = useRef<Purchase[]>([])
  const processedTransactionsRef = useRef(new Set<string>())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null)
  const [currentPurchaseError, setCurrentPurchaseError] = useState<IAPPurchaseError | null>(null)

  const storeKitTestHelper = useMemo(() => {
    if (Platform.OS !== "ios" || !proxyEnv.API_URL.startsWith("http://localhost")) {
      return null
    }

    try {
      return requireNativeModule("StoreKitTestHelper") as {
        prepareLocalSubscriptions?: () => Promise<unknown>
        buyProduct?: (productId: string) => Promise<{ jwsRepresentation?: string }>
      }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    void storeKitTestHelper?.prepareLocalSubscriptions?.().catch(() => {})
  }, [storeKitTestHelper])

  const {
    connected,
    subscriptions,
    availablePurchases,
    fetchProducts,
    finishTransaction,
    requestPurchase,
    restorePurchases,
    validateReceipt,
  } = useIAP({
    onPurchaseError: (error) => {
      setCurrentPurchaseError({
        code: error.code,
        message: error.message,
      })
    },
    onPurchaseSuccess: setCurrentPurchase,
  })

  useEffect(() => {
    availablePurchasesRef.current = availablePurchases
  }, [availablePurchases])

  const verifyPurchase = useCallback(
    async (purchase: Purchase) => {
      const productId = purchase.id
      const jwsRepresentation =
        purchase.purchaseToken ||
        (await getTransactionJwsIOS(productId).catch(() => null)) ||
        (await validateReceipt({ apple: { sku: productId } })
          .then((result) => ("jwsRepresentation" in result ? result.jwsRepresentation : undefined))
          .catch(() => {}))

      if (!jwsRepresentation) {
        throw new Error(t("subscription.actions.upgrade_error"))
      }

      const response = await followClient.request<{
        code: number
        data: BillingSubscriptionResponse
      }>("/billing/apple/verify", {
        method: "POST",
        body: {
          signedTransactionInfo: jwsRepresentation,
        },
      })

      if (response.code !== 0) {
        throw new Error("Failed to verify Apple subscription")
      }
    },
    [t, validateReceipt],
  )

  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      !currentPurchase ||
      !knownSubscriptionIds.has(currentPurchase.id)
    ) {
      return
    }

    const transactionKey =
      currentPurchase.transactionId ||
      ("originalTransactionIdentifierIOS" in currentPurchase
        ? currentPurchase.originalTransactionIdentifierIOS
        : undefined) ||
      `${currentPurchase.id}:${currentPurchase.transactionDate}`

    if (processedTransactionsRef.current.has(transactionKey)) {
      return
    }

    processedTransactionsRef.current.add(transactionKey)
    setIsProcessingPurchase(true)
    setIsPurchasing(false)

    void (async () => {
      try {
        await verifyPurchase(currentPurchase)
        await finishTransaction({ purchase: currentPurchase })
        await refreshBillingState()
      } catch (error) {
        processedTransactionsRef.current.delete(transactionKey)
        toast.error(
          error instanceof Error ? error.message : t("subscription.actions.upgrade_error"),
        )
      } finally {
        setIsProcessingPurchase(false)
      }
    })()
  }, [currentPurchase, finishTransaction, knownSubscriptionIds, t, verifyPurchase])

  useEffect(() => {
    if (!currentPurchaseError) {
      return
    }

    setIsPurchasing(false)
    setIsProcessingPurchase(false)

    if (currentPurchaseError.code === ErrorCode.UserCancelled) {
      return
    }

    toast.error(currentPurchaseError.message || t("subscription.actions.upgrade_error"))
  }, [currentPurchaseError, t])

  const loadSubscriptions = useCallback(
    async (skus: string[]) => {
      if (Platform.OS !== "ios" || skus.length === 0) {
        return
      }

      await fetchProducts({ skus, type: "subs" })
    },
    [fetchProducts],
  )

  const requestSubscriptionPurchase = useCallback(
    async ({ sku, appAccountToken }: { sku: string; appAccountToken?: string | null }) => {
      if (Platform.OS !== "ios") {
        return
      }

      setIsPurchasing(true)
      try {
        if (storeKitTestHelper?.buyProduct) {
          setIsProcessingPurchase(true)
          try {
            const result = await storeKitTestHelper.buyProduct(sku)
            await followClient.request<{ code: number; data: BillingSubscriptionResponse }>(
              "/billing/apple/verify",
              {
                method: "POST",
                body: result?.jwsRepresentation
                  ? {
                      signedTransactionInfo: result.jwsRepresentation,
                    }
                  : {
                      productId: sku,
                    },
              },
            )
            await refreshBillingState()
            return
          } finally {
            setIsProcessingPurchase(false)
            setIsPurchasing(false)
          }
        }

        await requestPurchase({
          type: "subs",
          request: {
            apple: {
              sku,
              appAccountToken: appAccountToken ?? undefined,
              andDangerouslyFinishTransactionAutomatically: false,
            },
          },
        })
      } catch (error) {
        setIsPurchasing(false)
        throw error
      }
    },
    [requestPurchase, storeKitTestHelper],
  )

  const restoreSubscriptionPurchases = useCallback(async () => {
    if (Platform.OS !== "ios") {
      return
    }

    setIsRestoring(true)
    try {
      await restorePurchases()
      await new Promise((resolve) => setTimeout(resolve, 300))

      const restoredPurchases = availablePurchasesRef.current.filter((purchase) =>
        knownSubscriptionIds.has(purchase.id),
      )

      if (restoredPurchases.length === 0) {
        throw new Error(t("subscription.actions.restore_not_found"))
      }

      const sortedPurchases = [...restoredPurchases].sort((left, right) => {
        const leftExpires =
          ("expirationDateIOS" in left ? left.expirationDateIOS : undefined) ??
          left.transactionDate ??
          0
        const rightExpires =
          ("expirationDateIOS" in right ? right.expirationDateIOS : undefined) ??
          right.transactionDate ??
          0
        return rightExpires - leftExpires
      })

      let restored = false
      for (const purchase of sortedPurchases) {
        try {
          await verifyPurchase(purchase)
          restored = true
          break
        } catch {
          continue
        }
      }

      if (!restored) {
        throw new Error(t("subscription.actions.restore_error"))
      }

      await refreshBillingState()
      toast.success(t("subscription.actions.restore_success"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("subscription.actions.restore_error"))
    } finally {
      setIsRestoring(false)
    }
  }, [knownSubscriptionIds, restorePurchases, t, verifyPurchase])

  const contextValue = useMemo<AppleIAPContextValue>(
    () => ({
      connected,
      subscriptions,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
    }),
    [
      connected,
      subscriptions,
      isPurchasing,
      isProcessingPurchase,
      isRestoring,
      loadSubscriptions,
      requestSubscriptionPurchase,
      restoreSubscriptionPurchases,
    ],
  )

  return <AppleIAPContext value={contextValue}>{children}</AppleIAPContext>
}

export const useAppleIAP = () => {
  const context = use(AppleIAPContext)
  if (!context) {
    throw new Error("useAppleIAP must be used within AppleIAPProvider")
  }
  return context
}
