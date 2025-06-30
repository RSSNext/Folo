import * as fs from "node:fs"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { routeBuilderPluginV2 } from "../vite-plugin-route-builder"

// Mock file system and glob
vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
  promises: {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
  resolve: vi.fn(),
  dirname: vi.fn(),
  relative: vi.fn(),
}))

vi.mock("fast-glob", () => ({
  default: {
    sync: vi.fn(),
  },
}))

vi.mock("pathe", () => ({
  resolve: vi.fn((root: string, path: string) => `${root}/${path}`),
  relative: vi.fn((from: string, to: string) => to.replace(from, "")),
  dirname: vi.fn((path: string) => path.split("/").slice(0, -1).join("/")),
}))

vi.mock("./utils/route-builder", () => ({
  buildGlobRoutes: vi.fn(() => [
    {
      path: "test",
      lazy: () => Promise.resolve({ default: () => null }),
      handle: {
        fs: "./pages/test",
        fullPath: "/test",
        isSync: false,
      },
    },
  ]),
}))

// Helper function to capture generated content
function captureGeneratedContent(): { content: string; filePath: string } | null {
  const mockWriteFileSync = vi.mocked(fs.writeFileSync)

  if (!mockWriteFileSync.mock || mockWriteFileSync.mock.calls.length === 0) {
    return null
  }

  const lastCall = mockWriteFileSync.mock.calls.at(-1)
  if (!lastCall) {
    return null
  }

  return {
    filePath: lastCall[0] as string,
    content: lastCall[1] as string,
  }
}

describe("routeBuilderPluginV2", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should create plugin with default options", () => {
    const plugin = routeBuilderPluginV2()

    expect(plugin.name).toBe("vite-plugin-route-builder-v2")
    expect(plugin).toHaveProperty("configResolved")
    expect(plugin).toHaveProperty("buildStart")
    expect(plugin).toHaveProperty("configureServer")
  })

  it("should use custom options", () => {
    const customOptions = {
      pagePattern: "./custom/**/*.tsx",
      outputPath: "./custom/routes.ts",
      enableInDev: false,
      debug: true,
    }

    const plugin = routeBuilderPluginV2(customOptions)
    expect(plugin.name).toBe("vite-plugin-route-builder-v2")
  })

  it("should generate routes for sync and async files", async () => {
    const mockFiles = [
      "/project/src/pages/index.tsx",
      "/project/src/pages/about.sync.tsx",
      "/project/src/pages/settings/layout.tsx",
      "/project/src/pages/settings/profile.sync.tsx",
    ]

    const glob = await import("fast-glob")
    vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

    const plugin = routeBuilderPluginV2({
      pagePattern: "./src/pages/**/*.{tsx,sync.tsx}",
      outputPath: "./src/generated-routes.ts",
    })

    const mockConfig = {
      command: "build" as const,
      root: "/project",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    // Simulate plugin lifecycle
    if (typeof plugin.configResolved === "function") {
      plugin.configResolved(mockConfig as any)
    }
    if (typeof plugin.buildStart === "function") {
      await plugin.buildStart.call({} as any, {} as any)
    }

    expect(glob.default.sync).toHaveBeenCalledWith("./src/pages/**/*.{tsx,sync.tsx}", {
      cwd: "/project",
      absolute: true,
    })
  })

  it("should generate correct import statements for sync files", async () => {
    const mockFiles = ["/project/src/pages/critical.sync.tsx", "/project/src/pages/normal.tsx"]

    const glob = await import("fast-glob")
    vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

    const plugin = routeBuilderPluginV2({
      outputPath: "./src/generated-routes.ts",
      debug: true,
    })

    const mockConfig = {
      command: "build" as const,
      root: "/project",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    const { writeFileSync } = await import("node:fs")
    const mockWriteFileSync = vi.mocked(writeFileSync)

    if (typeof plugin.configResolved === "function") {
      plugin.configResolved(mockConfig as any)
    }
    if (typeof plugin.buildStart === "function") {
      await plugin.buildStart.call({} as any, {} as any)
    }

    expect(mockWriteFileSync).toHaveBeenCalled()
    expect(mockConfig.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Generated routes:"),
    )

    // Verify generated content with snapshot
    const generatedContent = captureGeneratedContent()
    expect(generatedContent).toBeTruthy()
    expect(generatedContent!.content).toMatchSnapshot("sync-and-async-routes")
  })

  it("should handle transformPath option", async () => {
    const mockFiles = ["/project/src/pages/test.tsx"]

    const glob = await import("fast-glob")
    vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

    const plugin = routeBuilderPluginV2({
      transformPath: (path) => path.replace("./pages/", "./custom/"),
      debug: true,
    })

    const mockConfig = {
      command: "build" as const,
      root: "/project",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    if (typeof plugin.configResolved === "function") {
      plugin.configResolved(mockConfig as any)
    }
    if (typeof plugin.buildStart === "function") {
      await plugin.buildStart.call({} as any, {} as any)
    }

    expect(mockConfig.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("./custom/test.tsx"),
    )
  })

  it("should watch files in dev mode", () => {
    const plugin = routeBuilderPluginV2({
      enableInDev: true,
    })

    const mockWatcher = {
      add: vi.fn(),
      on: vi.fn(),
    }

    const mockServer = {
      watcher: mockWatcher,
      ws: {
        send: vi.fn(),
      },
    }

    const mockConfig = {
      command: "serve" as const,
      root: "/project",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    if (typeof plugin.configResolved === "function") {
      plugin.configResolved(mockConfig as any)
    }
    if (typeof plugin.configureServer === "function") {
      plugin.configureServer(mockServer as any)
    }

    expect(mockWatcher.add).toHaveBeenCalled()
    expect(mockWatcher.on).toHaveBeenCalledWith("add", expect.any(Function))
    expect(mockWatcher.on).toHaveBeenCalledWith("unlink", expect.any(Function))
  })

  it("should not generate in dev mode when disabled", async () => {
    const plugin = routeBuilderPluginV2({
      enableInDev: false,
    })

    const mockConfig = {
      command: "serve" as const,
      root: "/project",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    const glob = await import("fast-glob")

    if (typeof plugin.configResolved === "function") {
      plugin.configResolved(mockConfig as any)
    }
    if (typeof plugin.buildStart === "function") {
      await plugin.buildStart.call({} as any, {} as any)
    }

    expect(glob.default.sync).not.toHaveBeenCalled()
  })

  describe("Generated Routes Snapshots", () => {
    it("should generate correct routes for mixed sync and async files", async () => {
      const mockFiles = [
        "/project/src/pages/index.tsx",
        "/project/src/pages/about.sync.tsx",
        "/project/src/pages/settings/layout.tsx",
        "/project/src/pages/settings/profile.sync.tsx",
        "/project/src/pages/blog/[id].tsx",
        "/project/src/pages/dashboard/admin.sync.tsx",
      ]

      const glob = await import("fast-glob")
      vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

      const plugin = routeBuilderPluginV2({
        pagePattern: "./src/pages/**/*.{tsx,sync.tsx}",
        outputPath: "./src/generated-routes.ts",
      })

      const mockConfig = {
        command: "build" as const,
        root: "/project",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }

      if (typeof plugin.configResolved === "function") {
        plugin.configResolved(mockConfig as any)
      }
      if (typeof plugin.buildStart === "function") {
        await plugin.buildStart.call({} as any, {} as any)
      }

      const generatedContent = captureGeneratedContent()
      expect(generatedContent).toBeTruthy()
      expect(generatedContent!.content).toMatchSnapshot("mixed-routes-structure")
    })

    it("should generate correct routes for only sync files", async () => {
      const mockFiles = [
        "/project/src/pages/critical.sync.tsx",
        "/project/src/pages/important.sync.tsx",
        "/project/src/pages/settings/config.sync.tsx",
      ]

      const glob = await import("fast-glob")
      vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

      const plugin = routeBuilderPluginV2({
        outputPath: "./src/generated-routes.ts",
      })

      const mockConfig = {
        command: "build" as const,
        root: "/project",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }

      if (typeof plugin.configResolved === "function") {
        plugin.configResolved(mockConfig as any)
      }
      if (typeof plugin.buildStart === "function") {
        await plugin.buildStart.call({} as any, {} as any)
      }

      const generatedContent = captureGeneratedContent()
      expect(generatedContent).toBeTruthy()
      expect(generatedContent!.content).toMatchSnapshot("sync-only-routes")
    })

    it("should generate correct routes for only async files", async () => {
      const mockFiles = [
        "/project/src/pages/index.tsx",
        "/project/src/pages/about.tsx",
        "/project/src/pages/contact.tsx",
        "/project/src/pages/blog/[slug].tsx",
      ]

      const glob = await import("fast-glob")
      vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

      const plugin = routeBuilderPluginV2({
        outputPath: "./src/generated-routes.ts",
      })

      const mockConfig = {
        command: "build" as const,
        root: "/project",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }

      if (typeof plugin.configResolved === "function") {
        plugin.configResolved(mockConfig as any)
      }
      if (typeof plugin.buildStart === "function") {
        await plugin.buildStart.call({} as any, {} as any)
      }

      const generatedContent = captureGeneratedContent()
      expect(generatedContent).toBeTruthy()
      expect(generatedContent!.content).toMatchSnapshot("async-only-routes")
    })

    it("should generate correct routes with custom transformPath", async () => {
      const mockFiles = ["/project/src/pages/test.tsx", "/project/src/pages/demo.sync.tsx"]

      const glob = await import("fast-glob")
      vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

      const plugin = routeBuilderPluginV2({
        transformPath: (path) => path.replace("./pages/", "./custom/"),
        outputPath: "./src/generated-routes.ts",
      })

      const mockConfig = {
        command: "build" as const,
        root: "/project",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }

      if (typeof plugin.configResolved === "function") {
        plugin.configResolved(mockConfig as any)
      }
      if (typeof plugin.buildStart === "function") {
        await plugin.buildStart.call({} as any, {} as any)
      }

      const generatedContent = captureGeneratedContent()
      expect(generatedContent).toBeTruthy()
      expect(generatedContent!.content).toMatchSnapshot("custom-transform-routes")
    })

    it("should generate empty routes array when no files found", async () => {
      const mockFiles: string[] = []

      const glob = await import("fast-glob")
      vi.mocked(glob.default.sync).mockReturnValue(mockFiles)

      const plugin = routeBuilderPluginV2({
        outputPath: "./src/generated-routes.ts",
      })

      const mockConfig = {
        command: "build" as const,
        root: "/project",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      }

      if (typeof plugin.configResolved === "function") {
        plugin.configResolved(mockConfig as any)
      }
      if (typeof plugin.buildStart === "function") {
        await plugin.buildStart.call({} as any, {} as any)
      }

      const generatedContent = captureGeneratedContent()
      expect(generatedContent).toBeTruthy()
      expect(generatedContent!.content).toMatchSnapshot("empty-routes")
    })
  })
})
