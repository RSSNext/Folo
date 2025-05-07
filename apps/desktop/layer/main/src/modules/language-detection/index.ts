// @see https://github.dev/microsoft/vscode/blob/main/src/vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker.ts
import { createRequire } from "node:module"

import type { ModelResult } from "vscode-languagedetection"
import type vsld from "vscode-languagedetection"

import { logger } from "~/logger"

const expectedRelativeConfidence = 0.1
const positiveConfidenceCorrectionBucket1 = 0.05
const positiveConfidenceCorrectionBucket2 = 0.025
const negativeConfidenceCorrection = 0.5

const adjustLanguageConfidence = (modelResult: vsld.ModelResult): vsld.ModelResult => {
  switch (modelResult.languageId) {
    // For the following languages, we increase the confidence because
    // these are commonly used languages in VS Code and supported
    // by the model.
    case "js":
    case "html":
    case "json":
    case "ts":
    case "css":
    case "py":
    case "xml":
    case "php": {
      modelResult.confidence += positiveConfidenceCorrectionBucket1
      break
    }
    // case 'yaml': // YAML has been know to cause incorrect language detection because the language is pretty simple. We don't want to increase the confidence for this.
    case "cpp":
    case "sh":
    case "java":
    case "cs":
    case "c": {
      modelResult.confidence += positiveConfidenceCorrectionBucket2
      break
    }

    // For the following languages, we need to be extra confident that the language is correct because
    // we've had issues like #131912 that caused incorrect guesses. To enforce this, we subtract the
    // negativeConfidenceCorrection from the confidence.

    // languages that are provided by default in VS Code
    case "bat":
    case "ini":
    case "makefile":
    case "sql":
    case "csv":
    case "toml": {
      // Other considerations for negativeConfidenceCorrection that
      // aren't built in but suportted by the model include:
      // * Assembly, TeX - These languages didn't have clear language modes in the community
      // * Markdown, Dockerfile - These languages are simple but they embed other languages
      modelResult.confidence -= negativeConfidenceCorrection
      break
    }

    default: {
      break
    }
  }
  return modelResult
}
const require = createRequire(import.meta.url)

export const detectCodeStringLanguage = async function* (codeString: string) {
  const { ModelOperations } =
    require("vscode-languagedetection") as typeof import("vscode-languagedetection")
  const modelOperations = new ModelOperations()
  const modelResults = await modelOperations.runModel(codeString)
  if (modelResults.length === 0) {
    logger.debug("no model results", codeString)
    return
  }
  const firstModelResult = adjustLanguageConfidence(modelResults[0]!)
  if (firstModelResult.confidence < expectedRelativeConfidence) {
    logger.debug("first model result confidence is less than expected relative confidence")
    return
  }

  const possibleLanguages: ModelResult[] = [firstModelResult]

  for (let current of modelResults) {
    if (current === firstModelResult) {
      continue
    }

    current = adjustLanguageConfidence(current)
    const currentHighest = possibleLanguages.at(-1)
    if (!currentHighest) {
      logger.debug("no current highest")
      continue
    }

    if (currentHighest.confidence - current.confidence >= expectedRelativeConfidence) {
      while (possibleLanguages.length > 0) {
        yield possibleLanguages.shift()!
      }
      if (current.confidence > expectedRelativeConfidence) {
        possibleLanguages.push(current)
        continue
      }
      return
    } else {
      if (current.confidence > expectedRelativeConfidence) {
        possibleLanguages.push(current)
        continue
      }
      return
    }
  }

  return possibleLanguages
}
