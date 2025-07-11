import { CardDescription, CardHeader, CardTitle } from "@follow/components/ui/card/index.js"
import type { ReactNode } from "react"

export interface DisplayHeaderProps {
  title: string
  emoji: string
  description?: string
  children?: ReactNode
}

export const DisplayHeader = ({ title, emoji, description, children }: DisplayHeaderProps) => (
  <CardHeader>
    <CardTitle className="text-text flex items-center gap-2 text-xl font-semibold">
      <span className="text-lg">{emoji}</span>
      <span>{title}</span>
    </CardTitle>
    {description && <CardDescription>{description}</CardDescription>}
    {children}
  </CardHeader>
)
