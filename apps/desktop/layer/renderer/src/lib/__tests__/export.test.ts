import { describe, expect, it, vi } from "vitest"

import { createPdfFileName, exportPageAsPdf } from "../export"

describe("createPdfFileName", () => {
  it("sanitizes invalid filename characters", () => {
    expect(createPdfFileName('A/B:C*D?E"F<G>H|I')).toBe("A B C D E F G H I.pdf")
  })

  it("falls back to Untitled when title is empty", () => {
    expect(createPdfFileName("   ")).toBe("Untitled.pdf")
  })
})

describe("exportPageAsPdf", () => {
  it("uses Electron PDF export when running in Electron", async () => {
    const print = vi.fn()
    const exportAsPdf = vi.fn().mockResolvedValue("/tmp/Article.pdf")

    await exportPageAsPdf({
      title: "Article:/Title",
      isElectron: true,
      print,
      exportAsPdf,
    })

    expect(exportAsPdf).toHaveBeenCalledWith({ defaultPath: "Article Title.pdf" })
    expect(print).not.toHaveBeenCalled()
  })

  it("falls back to window.print in browser mode", async () => {
    const print = vi.fn()
    const exportAsPdf = vi.fn()

    await exportPageAsPdf({
      title: "Article Title",
      isElectron: false,
      print,
      exportAsPdf,
    })

    expect(print).toHaveBeenCalledOnce()
    expect(exportAsPdf).not.toHaveBeenCalled()
  })
})
