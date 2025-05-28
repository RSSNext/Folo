import { jotaiStore } from "@follow/utils"
import { EventEmitter } from "expo"
import { atom } from "jotai"

import type { ChainNavigationContextType, Route } from "./ChainNavigationContext"
import type {
  NavigationControllerView,
  NavigationControllerViewExtraProps,
  NavigationControllerViewType,
} from "./types"

export class Navigation {
  private ctxValue: ChainNavigationContextType
  constructor(ctxValue: ChainNavigationContextType) {
    this.ctxValue = ctxValue

    this.pushControllerView = this.pushControllerView.bind(this)
    this.presentControllerView = this.presentControllerView.bind(this)
    this.dismiss = this.dismiss.bind(this)
    this.back = this.back.bind(this)
    this.popToRoot = this.popToRoot.bind(this)
  }

  __dangerous_getCtxValue() {
    return this.ctxValue
  }

  private viewIdCounter = 0

  static readonly rootNavigation: Navigation = new Navigation({
    routesAtom: atom<Route[]>([]),
  })

  private __push(route: Route) {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    const hasRoute = routes.some((r) => r.id === route.id)
    if (hasRoute && routes.at(-1)?.id === route.id) {
      console.warn(`Top of stack is already ${route.id}`)
      return
    } else if (hasRoute) {
      route.id = `${route.id}-${this.viewIdCounter++}`
    }
    jotaiStore.set(this.ctxValue.routesAtom, [...routes, route])
    this.emit("screenChange", { screenId: route.id, type: "appear", route })
  }

  private resolveScreenOptions<T>(
    view: NavigationControllerView<T>,
  ): Required<NavigationControllerViewExtraProps> {
    return {
      transparent: view.transparent ?? false,
      id: view.id ?? view.name ?? `view-${this.viewIdCounter++}`,
      title: view.title ?? "",
      // Form Sheet
      sheetAllowedDetents: view.sheetAllowedDetents ?? "fitToContents",
      sheetCornerRadius: view.sheetCornerRadius ?? 16,
      sheetExpandsWhenScrolledToEdge: view.sheetExpandsWhenScrolledToEdge ?? true,
      sheetElevation: view.sheetElevation ?? 24,
      sheetGrabberVisible: view.sheetGrabberVisible ?? true,
      sheetInitialDetentIndex: view.sheetInitialDetentIndex ?? 0,
      sheetLargestUndimmedDetentIndex: view.sheetLargestUndimmedDetentIndex ?? "medium",
      // Transition-related props
      stackAnimation: view.stackAnimation ?? "default",
      // Default to "pop" but we specified it as "push" making it more intuitive
      replaceAnimation: view.replaceAnimation ?? "push",
      transitionDuration: view.transitionDuration ?? 500,
    }
  }

  pushControllerView<T>(view: NavigationControllerView<T>, props?: T) {
    const screenOptions = this.resolveScreenOptions(view)
    this.__push({
      id: screenOptions.id,
      type: "push",
      Component: view,
      props,
      screenOptions,
    })
  }

  replaceControllerView<T>(
    view: NavigationControllerView<T>,
    props?: T,
    extractScreenOptions?: NavigationControllerViewExtraProps,
  ) {
    const screenOptions = this.resolveScreenOptions(view)
    this.__replace({
      id: screenOptions.id,
      type: "push",
      Component: view,
      props,
      screenOptions: {
        ...screenOptions,
        ...extractScreenOptions,
      },
    })
  }

  presentControllerView<T>(
    view: NavigationControllerView<T>,
    props?: T,
    type: Exclude<NavigationControllerViewType, "push"> = "modal",
  ) {
    const screenOptions = this.resolveScreenOptions(view)
    this.__push({
      id: screenOptions.id,
      type,
      Component: view,
      props,
      screenOptions,
    })
  }

  private __pop() {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    const lastRoute = routes.at(-1)
    if (!lastRoute) {
      return
    }
    jotaiStore.set(this.ctxValue.routesAtom, routes.slice(0, -1))
    this.emit("screenChange", { screenId: lastRoute.id, type: "disappear", route: lastRoute })
  }

  private __replace(route: Route) {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    const hasRoute = routes.some((r) => r.id === route.id)
    if (hasRoute) {
      route.id = `${route.id}-${this.viewIdCounter++}`
    }
    jotaiStore.set(this.ctxValue.routesAtom, [...routes.slice(0, -1), route])
    this.emit("screenChange", { screenId: route.id, type: "appear", route })
  }

  /**
   * Dismiss the current modal.
   */
  dismiss() {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    const lastModalIndex = routes.findLastIndex((r) => r.type !== "push")
    if (lastModalIndex === -1) {
      return
    }
    jotaiStore.set(this.ctxValue.routesAtom, routes.slice(0, lastModalIndex))
  }

  back() {
    return this.__pop()
  }

  __internal_dismiss(routeId: string) {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    const lastModalIndex = routes.findLastIndex((r) => r.id === routeId)
    if (lastModalIndex === -1) {
      return
    }
    jotaiStore.set(this.ctxValue.routesAtom, routes.slice(0, lastModalIndex))
  }

  // eslint-disable-next-line unicorn/prefer-event-target
  private bus = new EventEmitter<{
    willAppear: (payload: LifecycleEventPayload) => void
    didAppear: (payload: LifecycleEventPayload) => void
    willDisappear: (payload: LifecycleEventPayload) => void
    didDisappear: (payload: LifecycleEventPayload) => void
  }>()
  on(event: "willAppear", callback: (payload: LifecycleEventPayload) => void): Disposer
  on(event: "didAppear", callback: (payload: LifecycleEventPayload) => void): Disposer
  on(event: "willDisappear", callback: (payload: LifecycleEventPayload) => void): Disposer
  on(event: "didDisappear", callback: (payload: LifecycleEventPayload) => void): Disposer
  on(event: "screenChange", callback: (payload: ScreenChangeEventPayload) => void): Disposer
  on(event: string, callback: (payload: any) => void): Disposer {
    const subscription = this.bus.addListener(event as any, callback)
    return () => {
      subscription.remove()
    }
  }

  emit(event: "willAppear", payload: LifecycleEventPayload): void
  emit(event: "didAppear", payload: LifecycleEventPayload): void
  emit(event: "willDisappear", payload: LifecycleEventPayload): void
  emit(event: "didDisappear", payload: LifecycleEventPayload): void
  emit(event: "screenChange", payload: ScreenChangeEventPayload): void
  emit(event: string, payload: LifecycleEventPayload): void {
    this.bus.emit(event as any, payload)
  }

  canGoBack() {
    const routes = jotaiStore.get(this.ctxValue.routesAtom)
    return routes.length > 0
  }

  popToRoot() {
    jotaiStore.set(this.ctxValue.routesAtom, [])
  }
}

type Disposer = () => void

type LifecycleEventPayload = {
  screenId: string
}

type ScreenChangeEventPayload = {
  screenId: string
  type: "appear" | "disappear"
  route?: Route
}
