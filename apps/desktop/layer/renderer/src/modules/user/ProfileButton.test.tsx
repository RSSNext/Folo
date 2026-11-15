import type { ReactNode } from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

import { ProfileButton } from "./ProfileButton"

type WalletData = { powerToken: string }[] | undefined

const wallet = vi.hoisted(() => {
  let data: WalletData
  const listeners = new Set<() => void>()
  return {
    enabled: undefined as boolean | undefined,
    get: () => data,
    set: (next: WalletData) => {
      data = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
})

vi.mock("~/queries/wallet", async () => {
  const { useSyncExternalStore } = await import("react")
  return {
    useWallet: (options?: { enabled?: boolean }) => {
      wallet.enabled = options?.enabled
      return { data: useSyncExternalStore(wallet.subscribe, wallet.get) }
    },
  }
})

// A minimal menu: the trigger toggles it and the content renders only while it is open
vi.mock("~/components/ui/dropdown-menu/dropdown-menu", async () => {
  const { createContext, createElement, use, useState } = await import("react")
  const MenuContext = createContext({ open: false, setOpen: (_open: boolean) => {} })

  return {
    DropdownMenu: ({
      children,
      onOpenChange,
    }: {
      children?: ReactNode
      onOpenChange?: (open: boolean) => void
    }) => {
      const [open, setOpen] = useState(false)
      const changeOpen = (next: boolean) => {
        setOpen(next)
        onOpenChange?.(next)
      }
      return createElement(MenuContext, { value: { open, setOpen: changeOpen } }, children)
    },
    DropdownMenuTrigger: ({
      onPointerEnter,
      onFocus,
    }: Pick<React.HTMLAttributes<HTMLButtonElement>, "onPointerEnter" | "onFocus">) => {
      const { open, setOpen } = use(MenuContext)
      return createElement("button", {
        "data-testid": "trigger",
        onPointerEnter,
        onFocus,
        onClick: () => setOpen(!open),
      })
    },
    DropdownMenuContent: ({ children }: { children?: ReactNode }) =>
      use(MenuContext).open ? createElement("div", { "data-testid": "menu" }, children) : null,
    DropdownMenuItem: ({ children }: { children?: ReactNode }) =>
      createElement("div", { role: "menuitem" }, children),
    DropdownMenuLabel: () => null,
    DropdownMenuSeparator: () => null,
  }
})

vi.mock("@follow/store/user/hooks", () => ({
  useUserRole: () => null,
  useWhoami: () => ({ id: "user-1", name: "User" }),
}))

vi.mock("~/atoms/server-configs", () => ({
  useIsInMASReview: () => false,
  useServerConfigs: () => ({ PAYMENT_ENABLED: false }),
}))

vi.mock("~/hooks/biz/useFeature", () => ({
  useFeature: () => false,
}))

vi.mock("~/modules/profile/hooks", () => ({
  usePresentUserProfileModal: () => vi.fn(),
}))

vi.mock("~/modules/settings/modal/use-setting-modal-hack", () => ({
  useSettingModal: () => vi.fn(),
}))

vi.mock("~/queries/auth", () => ({
  signOut: vi.fn(),
  useSession: () => ({
    status: "authenticated",
    session: { user: { id: "user-1", name: "User" } },
  }),
}))

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("./UserAvatar", () => ({ UserAvatar: () => null }))
vi.mock("./UserProBadge", () => ({ UserProBadge: () => null }))
vi.mock("./LoginButton", () => ({ LoginButton: () => null }))

const walletLabel = "user_button.wallet"

describe("ProfileButton", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    container?.remove()
    root = null
    container = null
    wallet.set(undefined)
    wallet.enabled = undefined
  })

  const render = async () => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root?.render(<ProfileButton />)
    })
  }

  const trigger = () => container!.querySelector<HTMLButtonElement>("[data-testid=trigger]")!
  const toggleMenu = async () => {
    await act(async () => {
      trigger().click()
    })
  }
  const menuText = () => container!.querySelector("[data-testid=menu]")?.textContent ?? ""

  test("requests the wallet once the pointer reaches the avatar", async () => {
    await render()
    expect(wallet.enabled).toBe(false)

    await act(async () => {
      trigger().dispatchEvent(new MouseEvent("pointerover", { bubbles: true }))
    })

    expect(wallet.enabled).toBe(true)
  })

  test("lists the wallet entry when the known answer has a power token", async () => {
    wallet.set([{ powerToken: "1" }])
    await render()

    await toggleMenu()

    expect(menuText()).toContain(walletLabel)
  })

  test("does not insert the wallet entry while the menu is open", async () => {
    await render()
    await toggleMenu()
    expect(menuText()).toContain("user_button.profile")
    expect(menuText()).not.toContain(walletLabel)

    await act(async () => {
      wallet.set([{ powerToken: "1" }])
    })
    expect(menuText()).not.toContain(walletLabel)

    await toggleMenu()
    await toggleMenu()
    expect(menuText()).toContain(walletLabel)
  })
})
