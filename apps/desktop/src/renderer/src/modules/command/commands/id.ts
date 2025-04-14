export const COMMAND_ID = {
  entry: {
    tip: "entry:tip",
    star: "entry:star",
    delete: "entry:delete",
    copyLink: "entry:copy-link",
    copyTitle: "entry:copy-title",
    openInBrowser: "entry:open-in-browser",
    viewSourceContent: "entry:view-source-content",
    share: "entry:share",
    read: "entry:read",
    toggleAISummary: "entry:toggle-ai-summary",
    toggleAITranslation: "entry:toggle-ai-translation",
    exportAsPDF: "entry:export-as-pdf",
    imageGallery: "entry:image-gallery",
    tts: "entry:tts",
    readability: "entry:ability",
  },
  integration: {
    saveToEagle: "integration:save-to-eagle",
    saveToReadwise: "integration:save-to-readwise",
    saveToInstapaper: "integration:save-to-instapaper",
    saveToObsidian: "integration:save-to-obsidian",
    saveToOutline: "integration:save-to-outline",
    saveToReadeck: "integration:save-to-readeck",
    saveToCubox: "integration:save-to-cubox",
  },
  list: {
    edit: "list:edit",
    unfollow: "list:unfollow",
    navigateTo: "list:navigate-to",
    openInBrowser: "list:open-in-browser",
    copyUrl: "list:copy-url",
    copyId: "list:copy-id",
  },
  settings: {
    changeThemeToAuto: "follow:change-color-mode-to-auto",
    changeThemeToDark: "follow:change-color-mode-to-dark",
    changeThemeToLight: "follow:change-color-mode-to-light",
    customizeToolbar: "follow:customize-toolbar",
  },
} as const
