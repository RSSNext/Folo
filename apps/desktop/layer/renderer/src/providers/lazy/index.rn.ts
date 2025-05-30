export { ContextMenuProvider as LazyContextMenuProvider } from "../context-menu-provider"
export { ExtensionExposeProvider as LazyExtensionExposeProvider } from "../extension-expose-provider"
export { LottieRenderContainer as LazyLottieRenderContainer } from "~/components/ui/lottie-container"
export { ModalStackProvider as LazyModalStackProvider } from "~/components/ui/modal"

const noop = () => null
export const LazyReloadPrompt = noop
export const LazyPWAPrompt = noop
export const LazyExternalJumpInProvider = noop
