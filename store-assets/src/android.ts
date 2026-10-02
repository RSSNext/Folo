import { execFile } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { promisify } from "node:util"

import { join } from "pathe"

import { sleep } from "./desktop"

const run = promisify(execFile)
const adbPath = join(
  process.env.ANDROID_HOME ?? join(homedir(), "Library/Android/sdk"),
  "platform-tools/adb",
)

// Android emulator automation over adb. Coordinates are in device pixels.

export interface UiNode {
  // resource-id; React Native maps testID to it.
  id: string
  text: string
  desc: string
  className: string
  bounds: { x: number; y: number; width: number; height: number }
}

export const adb = async (serial: string, ...args: string[]) => {
  const { stdout } = await run(adbPath, ["-s", serial, ...args], {
    maxBuffer: 64 * 1024 * 1024,
    encoding: "buffer",
  })
  return stdout as Buffer
}

const decode = (value: string) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#10;", "\n")
    .replaceAll("&amp;", "&")

export const dumpUi = async (serial: string): Promise<UiNode[]> => {
  await adb(serial, "shell", "uiautomator", "dump", "/sdcard/folo-ui.xml")
  const xml = (await adb(serial, "shell", "cat", "/sdcard/folo-ui.xml")).toString("utf8")
  const nodes: UiNode[] = []
  for (const match of xml.matchAll(/<node ([^>]*?)\/?>/g)) {
    const attrs = match[1]!
    const attr = (name: string) => decode(new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1] ?? "")
    const b = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(attrs)
    if (!b) continue
    const [x1, y1, x2, y2] = b.slice(1).map(Number) as [number, number, number, number]
    nodes.push({
      id: attr("resource-id"),
      text: attr("text"),
      desc: attr("content-desc"),
      className: attr("class"),
      bounds: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
    })
  }
  return nodes
}

export const label = (node: UiNode) => node.text || node.desc

export const findNode = async (
  serial: string,
  labels: string[],
  options: { prefix?: boolean; timeout?: number; nth?: number } = {},
) => {
  const deadline = Date.now() + (options.timeout ?? 15_000)
  while (Date.now() < deadline) {
    const matches = (await dumpUi(serial))
      .filter((n) => labels.some((l) => (options.prefix ? label(n).startsWith(l) : label(n) === l)))
      .sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x)
    const match = matches[options.nth ?? 0]
    if (match) return match
    await sleep(700)
  }
  return null
}

export const center = (node: UiNode) =>
  [node.bounds.x + node.bounds.width / 2, node.bounds.y + node.bounds.height / 2] as const

export const tap = async (serial: string, x: number, y: number, settle = 900) => {
  await adb(serial, "shell", "input", "tap", String(Math.round(x)), String(Math.round(y)))
  await sleep(settle)
}

export const tapLabel = async (
  serial: string,
  labels: string[],
  options: { prefix?: boolean; timeout?: number; nth?: number } = {},
  settle = 1200,
) => {
  const node = await findNode(serial, labels, options)
  if (!node) throw new Error(`No element labelled ${labels.join(" / ")}`)
  await tap(serial, ...center(node), settle)
  return node
}

export const swipe = async (
  serial: string,
  from: [number, number],
  to: [number, number],
  durationMs = 400,
  settle = 900,
) => {
  await adb(
    serial,
    "shell",
    "input",
    "swipe",
    ...[...from, ...to].map((v) => String(Math.round(v))),
    String(durationMs),
  )
  await sleep(settle)
}

export const back = async (serial: string, settle = 1200) => {
  await adb(serial, "shell", "input", "keyevent", "4")
  await sleep(settle)
}

export const screenshot = async (serial: string, path: string) => {
  await writeFile(path, await adb(serial, "exec-out", "screencap", "-p"))
}

// A clean status bar: fixed clock, full battery, Wi-Fi only, no notifications.
export const enterDemoMode = async (serial: string) => {
  const demo = (...args: string[]) =>
    adb(
      serial,
      "shell",
      "am",
      "broadcast",
      "-a",
      "com.android.systemui.demo",
      "-e",
      "command",
      ...args,
    )
  await adb(serial, "shell", "settings", "put", "global", "sysui_demo_allowed", "1")
  await demo("enter")
  await demo("clock", "-e", "hhmm", "0941")
  await demo("battery", "-e", "level", "100", "-e", "plugged", "false")
  await demo("network", "-e", "wifi", "show", "-e", "level", "4", "-e", "fully", "true")
  await demo("network", "-e", "mobile", "hide")
  await demo("notifications", "-e", "visible", "false")
}
