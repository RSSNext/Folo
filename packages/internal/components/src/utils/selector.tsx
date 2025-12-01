import { useMobile } from "@follow/components/hooks/useMobile.js"
import { useViewport } from "@follow/components/hooks/useViewport.js"
import type { ComponentType, ReactNode, RefAttributes } from "react"
import { lazy, Suspense } from "react"

export function withResponsiveComponent<P extends object>(
  desktopImport: () => Promise<{ default: ComponentType<P> }>,
  mobileImport: () => Promise<{ default: ComponentType<P> }>,
  fallbackElement?: ReactNode,
): ComponentType<P>
export function withResponsiveComponent<P extends object>(
  desktopImport: () => Promise<{ default: ComponentType<P> }>,
  mobileImport: () => Promise<{ default: ComponentType<P> }>,
  breakpointFn: (w: number) => boolean,
  fallbackElement?: ReactNode,
): ComponentType<P>
export function withResponsiveComponent<P extends object>(
  desktopImport: () => Promise<{ default: ComponentType<P> }>,
  mobileImport: () => Promise<{ default: ComponentType<P> }>,
  fallbackElementOrBreakpointFn?: ReactNode | ((w: number) => boolean),
  fallbackElement?: ReactNode,
) {
  const LazyDesktopLayout = lazy(desktopImport) as unknown as ComponentType<P>
  const LazyMobileLayout = lazy(mobileImport) as unknown as ComponentType<P>

  // Check if the third parameter is a function (breakpoint function) or ReactNode (fallback)
  const isBreakpointFn = typeof fallbackElementOrBreakpointFn === "function"
  const breakpointFn = isBreakpointFn ? fallbackElementOrBreakpointFn : undefined
  const fallback = isBreakpointFn ? fallbackElement : fallbackElementOrBreakpointFn

  return function ResponsiveLayout(props: P) {
    const isMobile = useViewport(({ w: viewport }) =>
      breakpointFn ? breakpointFn(viewport) : viewport < 1024 && viewport !== 0,
    )

    return (
      <Suspense fallback={fallback}>
        {isMobile ? <LazyMobileLayout {...props} /> : <LazyDesktopLayout {...props} />}
      </Suspense>
    )
  }
}

export function withResponsiveSyncComponent<P extends object, R = any>(
  DesktopComponent: ComponentType<P & RefAttributes<R>>,
  MobileComponent: ComponentType<P & RefAttributes<R>>,
) {
  return function ResponsiveLayout({
    ref,
    ...props
  }: P & { ref?: React.Ref<R | null> | ((node: R | null) => void) }) {
    const isMobile = useMobile()
    const componentProps = { ...props } as P & RefAttributes<R>

    return isMobile ? (
      <MobileComponent {...componentProps} ref={ref} />
    ) : (
      <DesktopComponent {...componentProps} ref={ref} />
    )
  }
}
