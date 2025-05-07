import { createElement, lazy, Suspense, useState } from "react"

const LazyLottieRenderContainer = lazy(() =>
  import("../../components/ui/lottie-container").then((res) => ({
    default: res.LottieRenderContainer,
  })),
)
const LazyContextMenuProvider = lazy(() =>
  import("./../context-menu-provider").then((res) => ({
    default: res.ContextMenuProvider,
  })),
)
const LazyModalStackProvider = lazy(() =>
  import("../../components/ui/modal/stacked/provider").then((res) => ({
    default: res.ModalStackProvider,
  })),
)

const LazyExtensionExposeProvider = lazy(() =>
  import("./../extension-expose-provider").then((res) => ({
    default: res.ExtensionExposeProvider,
  })),
)

const LazyReloadPrompt = lazy(() =>
  import("~/components/common/ReloadPrompt").then((module) => ({
    default: module.ReloadPrompt,
  })),
)

const LazyPWAPromptImport = lazy(() => import("react-ios-pwa-prompt"))

const LazyPWAPrompt = () => {
  const [show, setShow] = useState(true)
  if (!show) return null
  return createElement(
    Suspense,
    null,
    createElement(LazyPWAPromptImport, {
      onClose() {
        setTimeout(() => {
          setShow(false)
        }, 250)
      },

      appIconPath: `${window.location.origin}/apple-touch-icon-180x180.png`,
    }),
  )
}

export {
  LazyContextMenuProvider,
  LazyExtensionExposeProvider,
  LazyLottieRenderContainer,
  LazyModalStackProvider,
  LazyPWAPrompt,
  LazyReloadPrompt,
}

const LazyExternalJumpInProvider = lazy(() =>
  import("../external-jump-in-provider").then((res) => ({
    default: res.ExternalJumpInProvider,
  })),
)
export { LazyExternalJumpInProvider }
