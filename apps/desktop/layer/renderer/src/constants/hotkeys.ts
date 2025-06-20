export enum HotkeyScope {
  Home = "home",
  Menu = "menu",
  Modal = "modal",
  DropdownMenu = "dropdown-menu",
  Recording = "recording",

  // Atom Scope
  VideoPlayer = "video-player",
  Timeline = "timeline",
  EntryRender = "entry-render",
  SubscriptionList = "subscription-list",
  SubLayer = "sub-layer",
  AIChat = "ai-chat",
}

export const FloatingLayerScope = [
  HotkeyScope.Modal,
  HotkeyScope.DropdownMenu,
  HotkeyScope.Menu,
  HotkeyScope.Recording,
] as const
