export const downloadJsonFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const selectJsonFile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error("No file selected"))
        return
      }

      try {
        const content = await file.text()
        resolve(content)
      } catch {
        reject(new Error("Failed to read file"))
      }
    }
    input.click()
  })
}
