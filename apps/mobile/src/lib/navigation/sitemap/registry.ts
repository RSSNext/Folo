import type { NavigationControllerView, NavigationControllerViewType } from "../types"

type RegisterOptions = {
  stackPresentation: NavigationControllerViewType
}
type Registry = RegisterOptions & {
  Component: NavigationControllerView<any>
  props: any
}

class NavigationSitemapRegistryStatic {
  private map = new Map<string, Registry>()
  registerByComponent<T>(
    controllerView: NavigationControllerView<T>,
    props?: T,
    options?: Partial<RegisterOptions>,
  ) {
    const title = controllerView.id || controllerView.displayName || controllerView.name
    if (!title) {
      if (__DEV__) {
        console.error("registerByComponent: no name, ignore")
      }
      return
    }
    this.map.set(title, {
      Component: controllerView,
      props,
      stackPresentation: "push",
      ...options,
    })
  }

  [Symbol.iterator]() {
    return this.map.entries()
  }
  entries() {
    return [...this.map.entries()]
  }
}

export const NavigationSitemapRegistry = new NavigationSitemapRegistryStatic()
