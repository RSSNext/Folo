export const generateExportFilename = () => {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(" ")[0]?.replaceAll(":", "-") // HH-MM-SS
  return `follow-actions-${dateStr}-${timeStr}.json`
}
