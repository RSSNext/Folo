import { cn } from "@follow/utils/utils"
import type { SVGProps } from "react"

export function SimpleIconsCubox({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("rounded", className)}
      {...props}
    >
      <path d="M0 0 H100 V100 H0 Z" fill="currentColor" />
      <path d="M10,100 A40,40 0 0,1 90,100 Z" fill="black" />

      <circle cx="40" cy="75" r="8" fill="white" />
      <circle cx="42" cy="75" r="3" fill="black" />

      <circle cx="60" cy="75" r="8" fill="white" />
      <circle cx="62" cy="75" r="3" fill="black" />
    </svg>
  )
}
