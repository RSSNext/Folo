import { describe, expect, it } from "vitest"

import { titleCaseIfEnglish } from "./title-case"

describe("titleCaseIfEnglish", () => {
  it("title-cases English text", () => {
    expect(titleCaseIfEnglish("why your coffee is a defense weapon", "en")).toBe(
      "Why Your Coffee Is a Defense Weapon",
    )
  })

  it.each(["en-US", "en_GB", "EN", "eng"])("treats %s as English", (language) => {
    expect(titleCaseIfEnglish("show unread count", language)).toBe("Show Unread Count")
  })

  it.each([
    ["fr-FR", "Pourquoi votre café est une arme de défense"],
    ["fr", "Afficher le nombre de non lus"],
    ["fra", "Enregistrer le résumé IA comme description"],
    ["de", "Warum der Kaffee eine Waffe ist"],
    ["ja", "macOS 27 beta の新機能"],
    ["zh-CN", "iOS 27 beta 新功能"],
    ["zh-TW", "iOS 27 beta 新功能一覽"],
  ])("leaves %s text unchanged", (language, text) => {
    expect(titleCaseIfEnglish(text, language)).toBe(text)
  })

  it.each([null, undefined, ""])("leaves text unchanged when the language is %o", (language) => {
    expect(titleCaseIfEnglish("show unread count", language)).toBe("show unread count")
  })
})
