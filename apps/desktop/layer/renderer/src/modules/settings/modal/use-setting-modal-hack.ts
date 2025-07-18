// HACK: Use expose the navigate function in the window object, avoid to import `router` circular issue.

const showSettings = (args?: any) => window.router.showSettings.call(null, args)

export const useSettingModal = () => showSettings
