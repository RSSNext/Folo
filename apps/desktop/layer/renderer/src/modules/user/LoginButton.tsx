import { LucideLogIn } from "@follow/components/icons/user.jsx"
import { ActionButton } from "@follow/components/ui/button/index.js"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { useLoginModal } from "~/hooks/common"

export interface LoginProps {
  method?: "redirect" | "modal"
}
export const LoginButton: FC<LoginProps> = (props) => {
  const { method } = props
  const presentLoginModal = useLoginModal()
  const { t } = useTranslation()
  const Content = (
    <ActionButton
      className="relative z-[1]"
      onClick={
        method === "modal"
          ? () => {
              presentLoginModal()
            }
          : undefined
      }
      tooltip={t("words.login")}
    >
      <LucideLogIn className="size-5 text-text-secondary" />
    </ActionButton>
  )
  return method === "modal" ? Content : <a href="/login">{Content}</a>
}
