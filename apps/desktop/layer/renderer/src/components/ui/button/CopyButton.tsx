import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"
import type { ClipboardContent } from "~/lib/clipboard"
import { copyToClipboard } from "~/lib/clipboard"

import { AnimatedCommandButton } from "./AnimatedCommandButton"

export const CopyButton: Component<{
  value: ClipboardContent
  style?: React.CSSProperties
  variant?: "solid" | "outline" | "ghost"
  /** Accessible name, "Copy" by default */
  label?: string
}> = ({ value, className, style, variant = "solid", label }) => {
  const { t } = useTranslation("common")
  const handleCopy = useCallback(() => {
    void copyToClipboard(value).catch(() => undefined)
  }, [value])
  return (
    <AnimatedCommandButton
      className={className}
      style={style}
      variant={variant}
      aria-label={label ?? t("words.copy")}
      icon={<m.i className="i-mgc-copy-2-cute-re size-4" />}
      onClick={handleCopy}
    />
  )
}
