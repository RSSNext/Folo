import { ipcClient } from "./ipc-client"

export const tipcClient = window.electron
  ? {
      // App methods
      saveToEagle: ipcClient.app.saveToEagle,
      invalidateQuery: ipcClient.app.invalidateQuery,
      windowAction: ipcClient.app.windowAction,
      quitAndInstall: ipcClient.app.quitAndInstall,
      readClipboard: ipcClient.app.readClipboard,
      search: ipcClient.app.search,
      clearSearch: ipcClient.app.clearSearch,
      download: ipcClient.app.download,
      getAppPath: ipcClient.app.getAppPath,
      resolveAppAsarPath: ipcClient.app.resolveAppAsarPath,
      rendererUpdateReload: ipcClient.app.rendererUpdateReload,

      // Auth methods
      sessionChanged: ipcClient.auth.sessionChanged,
      signOut: ipcClient.auth.signOut,

      // Debug methods
      inspectElement: ipcClient.debug.inspectElement,

      // Dock methods
      pollingUpdateUnreadCount: ipcClient.dock.pollingUpdateUnreadCount,
      cancelPollingUpdateUnreadCount: ipcClient.dock.cancelPollingUpdateUnreadCount,
      updateUnreadCount: ipcClient.dock.updateUnreadCount,
      setDockBadge: ipcClient.setting.setDockBadge,

      // Menu methods
      showContextMenu: ipcClient.menu.showContextMenu,
      showConfirmDialog: ipcClient.menu.showConfirmDialog,
      showShareMenu: ipcClient.menu.showShareMenu,

      // Reader methods
      readability: ipcClient.reader.readability,
      tts: ipcClient.reader.tts,
      getVoices: ipcClient.reader.getVoices,
      detectCodeStringLanguage: ipcClient.reader.detectCodeStringLanguage,

      // Setting methods
      getLoginItemSettings: ipcClient.setting.getLoginItemSettings,
      setLoginItemSettings: ipcClient.setting.setLoginItemSettings,
      openSettingWindow: ipcClient.setting.openSettingWindow,
      getSystemFonts: ipcClient.setting.getSystemFonts,
      getAppearance: ipcClient.setting.getAppearance,
      setAppearance: ipcClient.setting.setAppearance,
      getMinimizeToTray: ipcClient.setting.getMinimizeToTray,
      setMinimizeToTray: ipcClient.setting.setMinimizeToTray,
      getProxyConfig: ipcClient.setting.getProxyConfig,
      setProxyConfig: ipcClient.setting.setProxyConfig,
      getMessagingToken: ipcClient.setting.getMessagingToken,
    }
  : null
