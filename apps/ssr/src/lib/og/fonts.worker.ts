import fontsBase64Data from "../../../.generated/fonts-data"

let cachedFonts: any[] | null = null
let koseFont: any | null = null

// Global reference to R2 bucket, set by worker-entry.ts
let _fontsBucket: R2Bucket | null = null
export function setFontsBucket(bucket: R2Bucket) {
  _fontsBucket = bucket
}

function decodeSNProFonts(): any[] {
  const fontsData: any[] = []
  for (const [key, base64] of Object.entries(fontsBase64Data)) {
    if (key === "kose-400") continue
    const weightStr = key.split("-").pop()!
    const weight = Number.parseInt(weightStr)
    const buf = Uint8Array.from(atob(base64), (c) => c.codePointAt(0)!)
    fontsData.push({
      name: "SN Pro",
      data: buf.buffer,
      weight,
      style: "normal" as const,
    })
  }
  return fontsData
}

async function loadKoseFont(): Promise<any | null> {
  if (koseFont) return koseFont
  if (!_fontsBucket) {
    console.warn("R2 fonts bucket not configured, skipping kose-font")
    return null
  }
  try {
    const obj = await _fontsBucket.get("ssr-fonts/kose-font.ttf")
    if (!obj) {
      console.warn("Kose font not found in R2")
      return null
    }
    const data = await obj.arrayBuffer()
    koseFont = {
      name: "Kose",
      data,
      weight: 400,
      style: "normal" as const,
    }
    return koseFont
  } catch (e) {
    console.error("Failed to load kose font from R2:", e)
    return null
  }
}

export async function getFonts(): Promise<any[]> {
  if (cachedFonts) return cachedFonts

  const snProFonts = decodeSNProFonts()
  const kose = await loadKoseFont()

  cachedFonts = kose ? [...snProFonts, kose] : snProFonts
  return cachedFonts
}

// Default export for compatibility with original fonts module API
export default [] as any[]
