import fs from "node:fs"

import { callWindowExpose } from "@follow/shared/bridge"
import { readability } from "@follow-app/readability"
import { app, BrowserWindow } from "electron"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"
import path from "pathe"
import type { ModelResult } from "vscode-languagedetection"

import { detectCodeStringLanguage } from "../../modules/language-detection"

const TTS_SERVICE_URL = "https://tts.folo.is"

interface ReadabilityInput {
  url: string
  html?: string
}

interface TtsInput {
  id: string
  text: string
  voice?: string
}

interface DetectCodeStringLanguageInput {
  codeString: string
}

interface TtsErrorResponse {
  error?: {
    message?: string
  }
}

interface TtsVoiceResponse {
  voices: Array<{
    FriendlyName: string
    Gender: string
    Locale: string
    ShortName: string
  }>
}

const readTtsErrorMessage = async (response: Response) => {
  try {
    const data = (await response.clone().json()) as TtsErrorResponse
    return data.error?.message || "TTS request failed"
  } catch {
    return "TTS request failed"
  }
}

const showReaderToastError = (
  window: BrowserWindow | null,
  error: unknown,
  fallbackMessage: string,
) => {
  if (!window) return

  if (error instanceof Error) {
    void callWindowExpose(window).toast.error(error.message, {
      duration: 1000,
    })
    return
  }

  void callWindowExpose(window).toast.error(fallbackMessage, {
    duration: 1000,
  })
}

export class ReaderService extends IpcService {
  static override readonly groupName = "reader"

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
    const { id } = input
    const text = input.text.trim()
    const voice = input.voice?.trim()

    if (!text) {
      return null
    }

    const window = BrowserWindow.fromWebContents(context.sender)
    if (!window) return null

    const dirPath = path.join(app.getPath("userData"), "Cache", "tts", id)
    const filePath = path.join(dirPath, "audio.mp3")
    if (fs.existsSync(filePath)) {
      return filePath
    }

    try {
      const response = await fetch(`${TTS_SERVICE_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          ...(voice ? { voice } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(await readTtsErrorMessage(response))
      }

      fs.mkdirSync(dirPath, { recursive: true })
      fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()))
      return filePath
    } catch (error: unknown) {
      console.error("Failed to synthesize TTS", error)
      showReaderToastError(window, error, "Failed to synthesize TTS")
      return null
    }
  }

  @IpcMethod()
  async getVoices(context: IpcContext) {
    const window = BrowserWindow.fromWebContents(context.sender)
    try {
      const response = await fetch(`${TTS_SERVICE_URL}/voices`)
      if (!response.ok) {
        throw new Error(await readTtsErrorMessage(response))
      }

      const data = (await response.json()) as TtsVoiceResponse
      return data.voices
    } catch (error: unknown) {
      console.error("Failed to get voices", error)
      showReaderToastError(window, error, "Failed to get voices")
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
