import type { Route } from "@/src/lib/navigation/ChainNavigationContext"

export const FLOATING_PLAYER_BAR_HEIGHT = 56
/** Gap below the floating player bar and between it and the content above. */
export const FLOATING_PLAYER_BAR_SPACING = 8
/** Bottom space a pushed screen keeps free so its content can scroll above the floating player bar. */
export const FLOATING_PLAYER_BAR_INSET =
  FLOATING_PLAYER_BAR_HEIGHT + FLOATING_PLAYER_BAR_SPACING * 2

/**
 * The JS tab bar and its player bar live in the root screen, so any screen pushed onto the root
 * stack covers them. Modals and the screens pushed inside them don't count: on Android they are
 * drawn below the root portal host, so a floating player bar would cover them.
 */
export const isRootStackPushedScreenOnTop = (routes: readonly Pick<Route, "type">[]) =>
  routes.length > 0 && routes.every((route) => route.type === "push")
