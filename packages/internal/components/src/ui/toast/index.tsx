import { useIsDark } from "@follow/hooks"
import { Toaster as Sonner } from "sonner"

import { ZIndexProvider } from "../z-index"
import { toastStyles } from "./styles"

type ToasterProps = React.ComponentProps<typeof Sonner>
const TOAST_Z_INDEX = 999999999

export const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = useIsDark()

  return (
    <ZIndexProvider zIndex={TOAST_Z_INDEX}>
      <Sonner
        theme={isDark ? "dark" : "light"}
        gap={12}
        toastOptions={{
          unstyled: true,
          classNames: toastStyles,
        }}
        icons={{
          success: <i className="i-mgc-check-circle-cute-re" />,
          error: <i className="i-mgc-close-cute-re" />,
          warning: <i className="i-mgc-warning-cute-re" />,
          info: <i className="i-mgc-information-cute-re" />,
          loading: <i className="i-mgc-loading-3-cute-re animate-spin" />,
        }}
        {...props}
      />
    </ZIndexProvider>
  )
}
