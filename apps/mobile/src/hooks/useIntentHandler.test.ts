import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Route } from "../lib/navigation/ChainNavigationContext"
import { Navigation } from "../lib/navigation/Navigation"
import { FollowScreen } from "../screens/(modal)/FollowScreen"
import { LoginScreen } from "../screens/(modal)/LoginScreen"
import { handleIncomingUrl, watchPendingFollowScreen } from "./useIntentHandler"

const mocks = vi.hoisted(() => {
  // Read by the shared constants at import
  vi.stubGlobal("ELECTRON", false)
  return { dismissInAppBrowser: vi.fn(async () => {}) }
})

vi.mock("expo", () => ({
  EventEmitter: class {
    addListener() {
      return { remove: () => {} }
    }

    emit() {}
  },
}))
vi.mock("expo-linking", () => ({
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}))
vi.mock("@follow/store/user/hooks", () => ({ invalidateUserSession: vi.fn() }))
vi.mock("../lib/navigation/hooks", () => ({ useNavigation: vi.fn() }))
vi.mock("../lib/launch-link", () => ({ getUnhandledLaunchLink: async () => null }))
vi.mock("../lib/native", () => ({ dismissInAppBrowser: mocks.dismissInAppBrowser }))
vi.mock("../screens/(modal)/FollowScreen", () => ({ FollowScreen: () => null }))
vi.mock("../screens/(modal)/LoginScreen", () => ({ LoginScreen: () => null }))

const createNavigation = () => new Navigation({ routesAtom: atom<Route[]>([]) })
const routesOf = (navigation: Navigation) =>
  jotaiStore.get(navigation.__dangerous_getCtxValue().routesAtom)
const screensOf = (navigation: Navigation) => routesOf(navigation).map((route) => route.Component)
// The form opens once the in-app browser, if any, is closed
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

// The handler remembers the last link for the whole module, so each test starts much later
let now = 1_000_000

describe("handleIncomingUrl", () => {
  let navigation: Navigation

  beforeEach(() => {
    navigation = createNavigation()
    now += 3_600_000
    vi.spyOn(Date, "now").mockImplementation(() => now)
    mocks.dismissInAppBrowser.mockClear()
  })

  it("opens the follow form for a link", async () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    await settle()

    const routes = routesOf(navigation)
    expect(routes).toHaveLength(1)
    expect(routes[0]!.Component).toBe(FollowScreen)
    expect(routes[0]!.props).toMatchObject({ id: "1337497420971380736", type: "feed" })
  })

  it("closes the in-app browser first, which would cover the form", async () => {
    let closeBrowser!: () => void
    mocks.dismissInAppBrowser.mockImplementationOnce(
      () => new Promise<void>((resolve) => (closeBrowser = resolve)),
    )

    handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
    await settle()
    expect(mocks.dismissInAppBrowser).toHaveBeenCalledTimes(1)
    expect(screensOf(navigation)).toEqual([])

    closeBrowser()
    await settle()
    expect(screensOf(navigation)).toEqual([FollowScreen])
  })

  it("replaces an open follow form with the one for the next link", async () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    await settle()
    now += 60_000
    handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
    await settle()

    const routes = routesOf(navigation)
    expect(routes).toHaveLength(1)
    expect(routes[0]!.Component).toBe(FollowScreen)
    expect(routes[0]!.props).toMatchObject({ id: "1337585485484134400", type: "feed" })
  })

  it("skips the echo of a link reported twice", async () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    await settle()

    expect(routesOf(navigation)).toHaveLength(1)
  })

  it("opens the form of a link that came in just after signing in once the sign-in closed", async () => {
    const stopWatching = watchPendingFollowScreen(navigation)
    // Signed in already: the sign-in screen closes itself, and what is over it, a moment later
    navigation.presentControllerView(LoginScreen)

    handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
    await settle()
    expect(screensOf(navigation)).toEqual([LoginScreen])

    navigation.dismiss()
    await vi.waitFor(() => expect(screensOf(navigation)).toEqual([FollowScreen]))
    stopWatching()
  })

  describe("signed out", () => {
    it("opens the follow form of a link from the sign-in screen once it closes", async () => {
      const stopWatching = watchPendingFollowScreen(navigation)
      navigation.presentControllerView(LoginScreen)

      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
      await settle()
      // The form would cover the sign-in screen
      expect(screensOf(navigation)).toEqual([LoginScreen])

      // Signing in closes the sign-in screen
      navigation.dismiss()
      await vi.waitFor(() => expect(screensOf(navigation)).toEqual([FollowScreen]))
      expect(routesOf(navigation)[0]!.props).toMatchObject({ id: "1337585485484134400" })
      stopWatching()
    })

    it("still opens the form when the sign-in screen closes without signing in", async () => {
      const stopWatching = watchPendingFollowScreen(navigation)
      navigation.presentControllerView(LoginScreen)
      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)

      navigation.dismiss()

      await vi.waitFor(() => expect(screensOf(navigation)).toEqual([FollowScreen]))
      stopWatching()
    })

    it("opens the form at once without a sign-in screen, which the form asks for", async () => {
      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
      await settle()

      expect(screensOf(navigation)).toEqual([FollowScreen])
    })

    it("waits for a sign-in screen that opened while the in-app browser was closing", async () => {
      const stopWatching = watchPendingFollowScreen(navigation)
      let closeBrowser!: () => void
      mocks.dismissInAppBrowser.mockImplementationOnce(
        () => new Promise<void>((resolve) => (closeBrowser = resolve)),
      )

      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
      await settle()
      // The launch found no session meanwhile
      navigation.presentControllerView(LoginScreen)
      closeBrowser()
      await settle()
      // Over the sign-in screen, the form's Follow could not bring it back
      expect(screensOf(navigation)).toEqual([LoginScreen])

      navigation.dismiss()
      await vi.waitFor(() => expect(screensOf(navigation)).toEqual([FollowScreen]))
      stopWatching()
    })
  })
})
