import { useIsDark } from "@follow/hooks"
import { Toaster as Sonner } from "sonner"

import { ZIndexProvider } from "../z-index"

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
          classNames: {
            toast: tw`
              group relative flex w-full items-center justify-between gap-3 rounded-2xl p-4 shadow-lg
              backdrop-blur-xl border border-border/50
              bg-material-ultra-thick
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl
              data-[type=success]:border-green/30 data-[type=success]:bg-green/5
              data-[type=error]:border-red/30 data-[type=error]:bg-red/5
              data-[type=warning]:border-orange/30 data-[type=warning]:bg-orange/5
              data-[type=info]:border-blue/30 data-[type=info]:bg-blue/5
              data-[type=loading]:border-gray/30 data-[type=loading]:bg-gray/5
              max-w-md min-w-[320px]
              font-theme
            `,
            title: tw`
              text-sm font-medium text-text
              leading-tight
            `,
            description: tw`
              text-xs text-text-secondary
              leading-relaxed mt-1
            `,
            content: tw`
              flex-1 min-w-0
            `,
            icon: tw`
              flex-shrink-0 mt-0.5 size-5
              [li[data-type="success"]_&]:text-green
              [li[data-type="error"]_&]:text-red  
              [li[data-type="warning"]_&]:text-orange
              [li[data-type="info"]_&]:text-blue
              [li[data-type="loading"]_&]:text-gray
            `,
            actionButton: tw`
              px-2.5 py-1 text-xs font-medium rounded-md
              transition-all duration-200
              focus:outline-none focus:shadow-lg bg-accent
              group-data-[type=success]:bg-green group-data-[type=success]:text-white group-data-[type=success]:hover:bg-green/90 group-data-[type=success]:focus:shadow-green/50
              group-data-[type=error]:bg-red group-data-[type=error]:text-white group-data-[type=error]:hover:bg-red/90 group-data-[type=error]:focus:shadow-red/50
              group-data-[type=warning]:bg-orange group-data-[type=warning]:text-white group-data-[type=warning]:hover:bg-orange/90 group-data-[type=warning]:focus:shadow-orange/50
              group-data-[type=info]:bg-blue group-data-[type=info]:text-white group-data-[type=info]:hover:bg-blue/90 group-data-[type=info]:focus:shadow-blue/50
              group-data-[type=loading]:bg-gray group-data-[type=loading]:text-white group-data-[type=loading]:hover:bg-gray/90 group-data-[type=loading]:focus:shadow-gray/50
              hover:shadow-md active:scale-95
            `,
            cancelButton: tw`
              px-2.5 py-1 text-xs font-medium rounded-md
              bg-fill-secondary text-text-secondary
              hover:bg-fill-tertiary hover:text-text
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-fill/50 focus:ring-offset-1
            `,
            closeButton: tw`
              absolute top-2 right-2 w-6 h-6 rounded-full
              flex items-center justify-center
              bg-fill text-text-tertiary
              hover:bg-fill-secondary hover:text-text-secondary
              active:bg-fill-tertiary active:text-text
              transition-all duration-200
              opacity-0 group-hover:opacity-100
              focus:outline-none focus:ring-2 focus:ring-accent/50
              focus:opacity-100
            `,
          },
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
