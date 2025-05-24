import { HotkeysProvider } from "react-hotkeys-hook"

import { GlobalHotkeysProvider } from "./global-hotkeys-provider"

export const HotkeyProvider: Component = ({ children }) => {
  return (
    <HotkeysProvider>
      {children}
      <GlobalHotkeysProvider />
    </HotkeysProvider>
  )
}
