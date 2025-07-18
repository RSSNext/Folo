import type { SVGProps } from "react"

export function PhCloudWarning(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M15.198 3.198a8.81 8.81 0 0 0-7.873 4.868 6.401 6.401 0 1 0-.929 12.736h8.802a8.802 8.802 0 0 0 0-17.604m0 16.004H6.396a4.801 4.801 0 0 1 0-9.603c.11 0 .22 0 .33.011a8.8 8.8 0 0 0-.33 2.39.8.8 0 0 0 1.6 0 7.202 7.202 0 1 1 7.202 7.202m-.8-7.202V8a.8.8 0 0 1 1.6 0v4a.8.8 0 0 1-1.6 0m2 3.6a1.2 1.2 0 1 1-1.2-1.2 1.2 1.2 0 0 1 1.2 1.2"
      />
    </svg>
  )
}
