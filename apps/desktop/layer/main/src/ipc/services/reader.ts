import fs from "node:fs"
import path from "node:path"

import { callWindowExpose } from "@follow/shared/bridge"
import { readability } from "@follow-app/readability"
import { app, BrowserWindow } from "electron"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"
import type { ModelResult } from "vscode-languagedetection"

import { detectCodeStringLanguage } from "../../modules/language-detection"
import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

const tts = new MsEdgeTTS()

interface ReadabilityInput {
  url: string
  html?: string
}

interface TtsInput {
  id: string
  text: string
  voice: string
}

interface DetectCodeStringLanguageInput {
  codeString: string
}

export class ReaderService extends IpcService {
  constructor() {
    super("reader")
  }

  @IpcMethod()
  async readability(_context: IpcContext, input: ReadabilityInput) {
    const { url } = input

    if (!url) {
      return null
    }
    const result = await readability(url)

    return result
  }

  @IpcMethod()
  async tts(context: IpcContext, input: TtsInput): Promise<string | null> {
    const { id, text, voice } = input
    if (!text) {
      return null
    }

    const window = BrowserWindow.fromWebContents(context.sender)
    if (!window) return null

    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {})
    } catch (error: unknown) {
      console.error("Failed to set voice", error)
      if (error instanceof Error) {
        callWindowExpose(window).toast.error(error.message, {
          duration: 1000,
        })
      } else {
        callWindowExpose(window).toast.error("Failed to set voice", {
          duration: 1000,
        })
      }
      return null
    }

    const dirPath = path.join(app.getPath("userData"), "Cache", "tts", id)
    const possibleFilePathList = ["mp3", "webm"].map((ext) => {
      return path.join(dirPath, `audio.${ext}`)
    })
    const filePath = possibleFilePathList.find((p) => fs.existsSync(p))
    if (filePath) {
      return filePath
    } else {
      fs.mkdirSync(dirPath, { recursive: true })
      const { audioFilePath } = await tts.toFile(dirPath, text)
      return audioFilePath
    }
  }

  @IpcMethod()
  async getVoices(context: IpcContext) {
    const window = BrowserWindow.fromWebContents(context.sender)
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
  }

  @IpcMethod()
  async detectCodeStringLanguage(
    _context: IpcContext,
    input: DetectCodeStringLanguageInput,
  ): Promise<ModelResult | undefined> {
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
  }
}
