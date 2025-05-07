if (import.meta.env.DEV) {
  const { scan } = await import("react-scan")
  scan({ enabled: false, log: false, showToolbar: true })
}
