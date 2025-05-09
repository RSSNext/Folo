class EntryCommandId {
  readonly read = "entry:read"
  readonly readAbove = "entry:read-above"
  readonly readBelow = "entry:read-below"
  readonly viewSourceContent = "entry:view-source-content"
  readonly readability = "entry:ability"
  readonly openInBrowser = "entry:open-in-browser"
  readonly star = "entry:star"
  readonly toggleAISummary = "entry:toggle-ai-summary"
  readonly toggleAITranslation = "entry:toggle-ai-translation"
  readonly imageGallery = "entry:image-gallery"
  readonly copyLink = "entry:copy-link"
  readonly copyTitle = "entry:copy-title"
  readonly tts = "entry:tts"
  readonly exportAsPDF = "entry:export-as-pdf"
  readonly tip = "entry:tip"
  readonly delete = "entry:delete"
  readonly share = "entry:share"
}

class IntegrationCommandId {
  readonly saveToEagle = "integration:save-to-eagle"
  readonly saveToReadwise = "integration:save-to-readwise"
  readonly saveToInstapaper = "integration:save-to-instapaper"
  readonly saveToObsidian = "integration:save-to-obsidian"
  readonly saveToOutline = "integration:save-to-outline"
}

class ListCommandId {
  readonly edit = "list:edit"
  readonly unfollow = "list:unfollow"
  readonly navigateTo = "list:navigate-to"
  readonly openInBrowser = "list:open-in-browser"
  readonly copyUrl = "list:copy-url"
  readonly copyId = "list:copy-id"
}

class SettingsCommandId {
  readonly changeThemeToAuto = "follow:change-color-mode-to-auto"
  readonly changeThemeToDark = "follow:change-color-mode-to-dark"
  readonly changeThemeToLight = "follow:change-color-mode-to-light"
  readonly customizeToolbar = "follow:customize-toolbar"
}

class CommandId {
  readonly entry = new EntryCommandId()
  readonly integration = new IntegrationCommandId()
  readonly list = new ListCommandId()
  readonly settings = new SettingsCommandId()
}

export const COMMAND_ID = new CommandId()

export type { CommandId, EntryCommandId, ListCommandId, SettingsCommandId }
