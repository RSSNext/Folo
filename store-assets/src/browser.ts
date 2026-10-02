import { mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"
import type { Browser } from "playwright"
import { chromium } from "playwright"
import sharp from "sharp"

export interface RenderTarget {
  width: number
  height: number
}

export interface OutputSpec {
  path: string
  width: number
  height: number
  format: "png" | "jpeg"
}

let browser: Browser | null = null
const workDir = join(tmpdir(), `folo-store-assets-${process.pid}`)

export const launchBrowser = async () => {
  browser ??= await chromium.launch()
  await mkdir(workDir, { recursive: true })
  return browser
}

export const closeBrowser = async () => {
  await browser?.close()
  browser = null
  await rm(workDir, { recursive: true, force: true })
}

let counter = 0

// Renders the page at canvas size, then writes every requested output size.
// Store uploads must be opaque, so alpha is flattened away.
export const renderHtml = async (html: string, canvas: RenderTarget, outputs: OutputSpec[]) => {
  const b = await launchBrowser()
  const page = await b.newPage({
    viewport: { width: canvas.width, height: canvas.height },
    deviceScaleFactor: 1,
  })
  try {
    // A file:// document can load file:// captures, which setContent() cannot.
    const file = join(workDir, `slide-${counter++}.html`)
    await writeFile(file, html)
    await page.goto(`file://${file}`, { waitUntil: "networkidle" })
    await page.waitForSelector("body[data-ready='1']", { timeout: 30_000 })
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((img) =>
          img.complete ? Promise.resolve() : img.decode().catch(() => undefined),
        ),
      )
    })
    // Copy that runs off the canvas is clipped in the store; report it so the
    // run can be checked without stopping halfway through a locale.
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll(".text, .lockup, .headline")]
        .map((el) => el.getBoundingClientRect())
        .some(
          (r) =>
            r.width > 0 &&
            (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight),
        ),
    )
    if (clipped) console.warn(`CLIPPED: copy runs off the canvas in ${outputs[0]?.path}`)
    const buffer = await page.screenshot({ type: "png", fullPage: false })
    for (const output of outputs) {
      await mkdir(join(output.path, ".."), { recursive: true })
      let pipeline = sharp(buffer).flatten({ background: "#ffffff" })
      if (output.width !== canvas.width || output.height !== canvas.height) {
        pipeline = pipeline.resize(output.width, output.height, {
          fit: "cover",
          kernel: "lanczos3",
        })
      }
      pipeline =
        output.format === "jpeg"
          ? pipeline.jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
          : pipeline.removeAlpha().png({ compressionLevel: 9, adaptiveFiltering: true })
      await pipeline.toFile(output.path)
    }
  } finally {
    await page.close()
  }
}
