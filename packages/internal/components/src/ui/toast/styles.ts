export const toastStyles = {
  toast: tw`
    group relative flex w-full items-center justify-between gap-3 rounded-2xl p-4
    backdrop-blur-2xl duration-300 ease-out
    max-w-md min-w-[320px]
    font-theme
    [&]:border [&]:border-solid
    [&]:data-[type=default]:border-[rgba(255,92,0,0.2)]
    [&]:data-[type=success]:border-[rgba(40,205,65,0.2)]
    [&]:data-[type=error]:border-[rgba(255,69,58,0.2)]
    [&]:data-[type=warning]:border-[rgba(255,149,0,0.2)]
    [&]:data-[type=info]:border-[rgba(0,122,255,0.2)]
    [&]:data-[type=loading]:border-[rgba(142,142,147,0.2)]
    [&]:shadow-[0_8px_32px_rgba(255,92,0,0.08),0_4px_16px_rgba(255,92,0,0.06),0_2px_8px_rgba(0,0,0,0.1)]
    [&]:data-[type=success]:shadow-[0_8px_32px_rgba(40,205,65,0.08),0_4px_16px_rgba(40,205,65,0.06),0_2px_8px_rgba(0,0,0,0.1)]
    [&]:data-[type=error]:shadow-[0_8px_32px_rgba(255,69,58,0.08),0_4px_16px_rgba(255,69,58,0.06),0_2px_8px_rgba(0,0,0,0.1)]
    [&]:data-[type=warning]:shadow-[0_8px_32px_rgba(255,149,0,0.08),0_4px_16px_rgba(255,149,0,0.06),0_2px_8px_rgba(0,0,0,0.1)]
    [&]:data-[type=info]:shadow-[0_8px_32px_rgba(0,122,255,0.08),0_4px_16px_rgba(0,122,255,0.06),0_2px_8px_rgba(0,0,0,0.1)]
    [&]:data-[type=loading]:shadow-[0_8px_32px_rgba(142,142,147,0.08),0_4px_16px_rgba(142,142,147,0.06),0_2px_8px_rgba(0,0,0,0.1)]
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
    shrink-0
    h-6
    px-2.5 text-xs font-medium rounded-md
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
    h-6
    px-2.5 text-xs font-medium rounded-md
    bg-fill-secondary text-text-secondary
    hover:bg-fill-tertiary hover:text-text
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-fill/50 focus:ring-offset-1
  `,
  closeButton: tw`
    absolute -top-2 -right-2 w-6 h-6 rounded-full
    flex items-center justify-center
    text-text
    border border-border
    backdrop-blur-background
    bg-material-ultra-thick
    transition-all duration-200
    opacity-0 group-hover:opacity-100
    focus:outline-none focus:ring-2
    group-data-[type=default]:focus:ring-[rgba(255,92,0,0.5)]
    group-data-[type=success]:focus:ring-[rgba(40,205,65,0.5)]
    group-data-[type=error]:focus:ring-[rgba(255,69,58,0.5)]
    group-data-[type=warning]:focus:ring-[rgba(255,149,0,0.5)]
    group-data-[type=info]:focus:ring-[rgba(0,122,255,0.5)]
    group-data-[type=loading]:focus:ring-[rgba(142,142,147,0.5)]
    focus:opacity-100
  `,
}
