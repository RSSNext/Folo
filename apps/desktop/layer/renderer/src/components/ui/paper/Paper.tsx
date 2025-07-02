import { cn } from "@follow/utils/utils"
import type { JSX } from "react"

export const Paper: Component<{
  as?: keyof JSX.IntrinsicElements | Component
}> = ({ children, className, as: As = "main" }) => (
  <As
    className={cn(
      "bg-background relative md:col-start-1 lg:col-auto",
      "-m-4 p-[2rem_1rem] md:m-0 lg:p-[30px_45px]",
      "border-border rounded-lg lg:border",
      "shadow-perfect perfect-sm",
      "min-w-0",
      "print:!border-none print:!bg-transparent print:!shadow-none",
      className,
    )}
  >
    {children}
  </As>
)
