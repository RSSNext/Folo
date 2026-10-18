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
  return { whoami: null as { id: string } | null }
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
vi.mock("@follow/store/user/getters", () => ({ whoami: () => mocks.whoami }))
vi.mock("../lib/navigation/hooks", () => ({ useNavigation: vi.fn() }))
vi.mock("../lib/launch-link", () => ({ getUnhandledLaunchLink: async () => null }))
vi.mock("../screens/(modal)/FollowScreen", () => ({ FollowScreen: () => null }))
vi.mock("../screens/(modal)/LoginScreen", () => ({ LoginScreen: () => null }))

const createNavigation = () => new Navigation({ routesAtom: atom<Route[]>([]) })
const routesOf = (navigation: Navigation) =>
  jotaiStore.get(navigation.__dangerous_getCtxValue().routesAtom)

// The handler remembers the last link for the whole module, so each test starts much later
let now = 1_000_000

describe("handleIncomingUrl", () => {
  let navigation: Navigation

  beforeEach(() => {
    navigation = createNavigation()
    now += 3_600_000
    vi.spyOn(Date, "now").mockImplementation(() => now)
    mocks.whoami = { id: "user-1" }
  })

  it("opens the follow form for a link", () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)

    const routes = routesOf(navigation)
    expect(routes).toHaveLength(1)
    expect(routes[0]!.Component).toBe(FollowScreen)
    expect(routes[0]!.props).toMatchObject({ id: "1337497420971380736", type: "feed" })
  })

  it("replaces an open follow form with the one for the next link", () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    now += 60_000
    handleIncomingUrl("folo://add?id=1337585485484134400", navigation)

    const routes = routesOf(navigation)
    expect(routes).toHaveLength(1)
    expect(routes[0]!.Component).toBe(FollowScreen)
    expect(routes[0]!.props).toMatchObject({ id: "1337585485484134400", type: "feed" })
  })

  it("skips the echo of a link reported twice", () => {
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)
    handleIncomingUrl("folo://add?id=1337497420971380736", navigation)

    expect(routesOf(navigation)).toHaveLength(1)
  })

  describe("signed out", () => {
    beforeEach(() => {
      mocks.whoami = null
    })

    it("opens the follow form of a link from the sign-in screen once it closes", async () => {
      const stopWatching = watchPendingFollowScreen(navigation)
      navigation.presentControllerView(LoginScreen)

      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)
      // The form would cover the sign-in screen
      expect(routesOf(navigation).map((route) => route.Component)).toEqual([LoginScreen])

      // Signing in closes the sign-in screen
      mocks.whoami = { id: "user-1" }
      navigation.dismiss()
      await vi.waitFor(() =>
        expect(routesOf(navigation).map((route) => route.Component)).toEqual([FollowScreen]),
      )
      expect(routesOf(navigation)[0]!.props).toMatchObject({ id: "1337585485484134400" })
      stopWatching()
    })

    it("still opens the form when the sign-in screen closes without signing in", async () => {
      const stopWatching = watchPendingFollowScreen(navigation)
      navigation.presentControllerView(LoginScreen)
      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)

      navigation.dismiss()

      await vi.waitFor(() =>
        expect(routesOf(navigation).map((route) => route.Component)).toEqual([FollowScreen]),
      )
      stopWatching()
    })

    it("opens the form at once without a sign-in screen, which the form asks for", () => {
      handleIncomingUrl("folo://add?id=1337585485484134400", navigation)

      expect(routesOf(navigation).map((route) => route.Component)).toEqual([FollowScreen])
    })
  })
})
