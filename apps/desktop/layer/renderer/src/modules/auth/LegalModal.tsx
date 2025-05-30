import { legalHtml } from "@follow/legal"
import { stopPropagation } from "@follow/utils/dom"
import { m } from "motion/react"
import type { FC } from "react"

type LegalModalProps = {
  type: "privacy" | "tos"
}

export const LegalModalContent: FC<LegalModalProps> = ({ type }) => {
  const content = type === "privacy" ? legalHtml.privacy : legalHtml.tos

  return (
    <m.div className="size-full overflow-hidden">
      <div className="bg-background size-full overflow-auto rounded-lg" onClick={stopPropagation}>
        <iframe
          sandbox="allow-scripts"
          srcDoc={content}
          title={type === "privacy" ? "Privacy Policy" : "Terms of Service"}
          className="size-full border-0"
        />
      </div>
    </m.div>
  )
}
