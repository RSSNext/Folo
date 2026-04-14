import { describe, expect, it } from "vitest"

import { checkLanguage } from "./language"

describe("checkLanguage", () => {
  it("does not treat English text as French", () => {
    expect(
      checkLanguage({
        content: "This is a short English summary about AI and mobile apps.",
        language: "fr-FR",
      }),
    ).toBe(false)
  })

  it("recognizes French text when French is the target language", () => {
    expect(
      checkLanguage({
        content: "Ceci est un resume en francais sur les applications mobiles et l'IA.",
        language: "fr-FR",
      }),
    ).toBe(true)
  })
})
