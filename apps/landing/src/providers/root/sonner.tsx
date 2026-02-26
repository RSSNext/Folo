import { Toaster as Sonner } from 'sonner'

import { useIsDark } from '~/hooks/common/use-is-dark'

type ToasterProps = React.ComponentProps<typeof Sonner>

export const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useIsDark() ? 'dark' : 'light'

  return (
    <Sonner
      theme={theme}
      richColors
      expand
      closeButton
      duration={3500}
      offset="16px"
      className="toaster group"
      toastOptions={{
        classNames: {
          // Card shell - using material colors for glass morphism effect
          toast:
            'group pointer-events-auto flex gap-3 rounded-xl border border-border bg-material-opaque backdrop-blur supports-[backdrop-filter]:bg-material-medium shadow-lg shadow-black/5 ring-1 ring-border',
          // Title & description - using semantic text colors
          title: 'text-text font-medium',
          description: 'text-text-secondary text-sm leading-relaxed',
          // Icon & close button - using accent and text colors
          icon: 'text-accent size-4',
          closeButton:
            'text-text-tertiary hover:text-text transition-opacity duration-200',
          // Action buttons - using primary and fill colors
          actionButton:
            'rounded-md bg-accent text-background px-2.5 py-1 text-xs font-medium hover:bg-accent/90',
          cancelButton:
            'rounded-md border border-border bg-fill px-2.5 py-1 text-xs font-medium text-text hover:bg-fill-secondary',
        },
      }}
      {...props}
    />
  )
}
