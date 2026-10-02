/**
 * Launch argument that makes the desktop app start hidden in the tray. The renderer registers it as
 * the login item argument, the main process checks for it on startup.
 *
 * Kept in a module without build-time globals so that both Electron layers can import it.
 *
 * @see https://github.com/electron/electron/issues/25081
 */
export const START_IN_TRAY_ARGS = "--start-in-tray"
