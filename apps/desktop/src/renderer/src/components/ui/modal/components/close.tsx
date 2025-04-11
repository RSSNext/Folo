import { useTranslation } from "react-i18next"

import { PeekModalBaseButton } from "./base"

export const FixedModalCloseButton: Component<{
  onClick: () => void
  className?: string
}> = ({ onClick, className }) => {
  const { t } = useTranslation("common")
  return (
    <PeekModalBaseButton
      onClick={onClick}
      className={className}
      label={t("words.close")}
      icon={<i className="i-mgc-close-cute-re text-lg" />}
    />
  )
}
