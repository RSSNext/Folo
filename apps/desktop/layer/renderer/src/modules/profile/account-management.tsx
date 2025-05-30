import { Button } from "@follow/components/ui/button/index.js"
import { authProvidersConfig } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { linkSocial, unlinkAccount } from "~/lib/auth"
import { auth, useSocialAccounts } from "~/queries/auth"
import { useAuthProviders } from "~/queries/users"

function AuthProviderButton({ provider }: { provider: string }) {
  const { t } = useTranslation("settings")
  const { data: accounts } = useSocialAccounts()
  const unlinkAccountMutation = useMutation({
    mutationFn: async () => {
      const account = accounts?.find((account) => account.provider === provider)
      if (!account) throw new Error("Account not found")
      const res = await unlinkAccount({ providerId: provider, accountId: account.accountId })
      if (res.error) throw new Error(res.error.message)
    },
    onSuccess: () => {
      toast.success(t("profile.link_social.unlink.success"))
      auth.getAccounts().invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const account = accounts?.find((account) => account.provider === provider)
  if (!account && IN_ELECTRON) return null

  return (
    <Button
      key={provider}
      variant={"outline"}
      onClick={() => {
        if (!account) {
          linkSocial({
            provider: provider as any,
          })
          return
        }
        unlinkAccountMutation.mutate()
      }}
      isLoading={unlinkAccountMutation.isPending}
    >
      <div className="flex items-center gap-2">
        <i className={cn("text-xl", authProvidersConfig[provider]?.iconClassName)} />
        <span>
          {account
            ? account.profile?.email || account.profile?.name
            : t("profile.link_social.link")}
        </span>
        {account && <i className="i-mgc-delete-2-cute-re" />}
      </div>
    </Button>
  )
}

export function AccountManagement() {
  const { t } = useTranslation("settings")

  const { data: providers } = useAuthProviders()

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t("profile.link_social.authentication")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {Object.keys(providers || {})
          .filter((provider) => provider !== "credential")
          .map((provider) => (
            <AuthProviderButton key={provider} provider={provider} />
          ))}
      </div>
    </div>
  )
}
