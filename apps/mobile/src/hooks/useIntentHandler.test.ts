import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Route } from "../lib/navigation/ChainNavigationContext"
import { Navigation } from "../lib/navigation/Navigation"
import { FollowScreen } from "../screens/(modal)/FollowScreen"
import { handleIncomingUrl } from "./useIntentHandler"

vi.hoisted(() => {
  // Read by the shared constants at import
  vi.stubGlobal("ELECTRON", false)
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
vi.mock("../screens/(modal)/FollowScreen", () => ({ FollowScreen: () => null }))

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
})
