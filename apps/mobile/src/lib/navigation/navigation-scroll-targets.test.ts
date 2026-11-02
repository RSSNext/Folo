import { describe, expect, it } from "vitest"

import { createNavigationScrollTargets, getNativeScrollView } from "./navigation-scroll-targets"

const HOME = 0
const SUBSCRIPTIONS = 1
const ref = () => ({ current: {} })

describe("createNavigationScrollTargets", () => {
  it("keeps the shown list of each tab apart", () => {
    const targets = createNavigationScrollTargets()
    const timeline = ref()
    const subscriptions = ref()

    targets.register(HOME, timeline)
    // Switching the view on Home also switches the page of the Subscriptions tab
    targets.register(SUBSCRIPTIONS, subscriptions)

    expect(targets.get(HOME)).toBe(timeline)
    expect(targets.get(SUBSCRIPTIONS)).toBe(subscriptions)
  })

  it("hands the tap to the newly shown page whichever page effect runs first", () => {
    const targets = createNavigationScrollTargets()
    const articles = ref()
    const social = ref()

    const unregisterArticles = targets.register(HOME, articles)
    const unregisterSocial = targets.register(HOME, social)
    unregisterArticles()
    expect(targets.get(HOME)).toBe(social)

    unregisterSocial()
    targets.register(HOME, articles)
    expect(targets.get(HOME)).toBe(articles)
  })

  it("forgets a list that left, instead of keeping its empty ref", () => {
    const targets = createNavigationScrollTargets()
    const unregister = targets.register(HOME, ref())

    unregister()

    expect(targets.get(HOME)).toBeUndefined()
  })

  it("does not stack a list that registers again", () => {
    const targets = createNavigationScrollTargets()
    const timeline = ref()

    targets.register(HOME, timeline)
    const unregister = targets.register(HOME, timeline)
    unregister()

    expect(targets.get(HOME)).toBeUndefined()
  })
})

describe("getNativeScrollView", () => {
  it("asks a list handle for the scroll view it has now", () => {
    const scrollView = { __nativeTag: 2 }
    const handle = { __nativeTag: 1, getNativeScrollRef: () => scrollView }

    expect(getNativeScrollView(handle)).toBe(scrollView)
  })

  it("takes a scroll view as it is", () => {
    const scrollView = { __nativeTag: 1 }

    expect(getNativeScrollView(scrollView)).toBe(scrollView)
  })

  it("finds nothing for a handle whose scroll view is gone", () => {
    const handle = { __nativeTag: 1, getNativeScrollRef: () => null }

    expect(getNativeScrollView(handle)).toBeNull()
  })
})
