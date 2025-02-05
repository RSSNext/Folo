import fs from "node:fs"
import path from "node:path"

import { callWindowExpose } from "@follow/shared/bridge"
import { app, BrowserWindow } from "electron"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"
import type { ModelResult } from "vscode-languagedetection"

import { detectCodeStringLanguage } from "~/modules/language-detection"

import { readability } from "../lib/readability"
import { t } from "./_instance"

const tts = new MsEdgeTTS()

export const readerRoute = {
  readability: t.procedure.input<{ url: string }>().action(async ({ input }) => {
    const { url } = input

    if (!url) {
      return null
    }
    const result = await readability(url)

    return result
  }),

  tts: t.procedure
    .input<{
      id: string
      text: string
      voice: string
    }>()
    .action(async ({ input, context: { sender } }) => {
      const { id, text, voice } = input
      if (!text) {
        return null
      }

      const window = BrowserWindow.fromWebContents(sender)
      if (!window) return

      // It's ok to set voice every time, because it will be cached by msedge-tts
      await tts
        .setMetadata(voice, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
        .catch((error: unknown) => {
          console.error("Failed to set voice", error)
          if (error instanceof Error) {
            return callWindowExpose(window).toast.error(error.message, {
              duration: 1000,
            })
          }
          return callWindowExpose(window).toast.error("Failed to set voice", {
            duration: 1000,
          })
        })

      const filePath = path.join(app.getPath("userData"), `${id}.webm`)
      if (fs.existsSync(filePath)) {
        return filePath
      } else {
        await tts.toFile(filePath, text)
        return filePath
      }
    }),

  getVoices: t.procedure.action(async ({ context: { sender } }) => {
    const window = BrowserWindow.fromWebContents(sender)
    try {
      const voices = await tts.getVoices()
      return voices
    } catch (error) {
      console.error("Failed to get voices", error)
      if (!window) return
      if (error instanceof Error) {
        void callWindowExpose(window).toast.error(error.message, { duration: 1000 })
        return
      }
      callWindowExpose(window).toast.error("Failed to get voices", { duration: 1000 })
    }
  }),

  detectCodeStringLanguage: t.procedure
    .input<{ codeString: string }>()
    .action(async ({ input }) => {
      const { codeString } = input
      const languages = detectCodeStringLanguage(codeString)

      let finalLanguage: ModelResult | undefined
      for await (const language of languages) {
        if (!finalLanguage) {
          finalLanguage = language
          continue
        }
        if (language.confidence > finalLanguage.confidence) {
          finalLanguage = language
        }
      }

      return finalLanguage
    }),
}
