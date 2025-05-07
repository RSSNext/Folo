// HACK: Use expose the navigate function in the window object, avoid to import `router` circular issue.
// eslint-disable-next-line @eslint-react/hooks-extra/ensure-custom-hooks-using-other-hooks
export const useSettingModal = () => window.router.showSettings
