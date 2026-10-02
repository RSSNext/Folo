import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { sleep } from "./desktop"

const exec = promisify(execFile)

// AXe occasionally times out creating its automation session right after a
// simulator boots; retry a few times before giving up.
const run = async (file: string, args: string[], options: { maxBuffer?: number } = {}) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await exec(file, args, options)
    } catch (error) {
      if (attempt >= 4) throw error
      await sleep(3000 * attempt)
    }
  }
}

// iOS simulator automation through AXe (https://github.com/cameroncooke/AXe).
// Taps use the "physical" style: the default simulator tap is ignored by
// React Native pressables on the iOS 27 runtime.

export interface AxNode {
  type: string
  // AXUniqueId: the React Native testID.
  id: string
  label: string
  value: string
  frame: { x: number; y: number; width: number; height: number }
}

interface RawNode {
  type?: string
  AXUniqueId?: string | null
  AXLabel?: string | null
  AXValue?: string | number | null
  frame?: AxNode["frame"]
  children?: RawNode[]
}

export const describe = async (udid: string): Promise<AxNode[]> => {
  const { stdout } = await run("axe", ["describe-ui", "--udid", udid], {
    maxBuffer: 64 * 1024 * 1024,
  })
  const nodes: AxNode[] = []
  const walk = (node: RawNode | RawNode[]) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node.frame) {
      nodes.push({
        type: node.type ?? "",
        id: node.AXUniqueId ?? "",
        label: node.AXLabel ?? "",
        value: node.AXValue === null || node.AXValue === undefined ? "" : String(node.AXValue),
        frame: node.frame,
      })
    }
    node.children?.forEach(walk)
  }
  walk(JSON.parse(stdout) as RawNode)
  return nodes
}

// "physical" sends touch down/up and is what React Native pressables respond to;
// "simulator" taps are needed for native UIKit controls such as menu buttons.
// "held" is a touch that stays down for a moment: iPad menu items ignore a
// plain tap but pick up a press of about 0.2 s.
export type TapStyle = "physical" | "simulator" | "held"

export const tapPoint = async (
  udid: string,
  x: number,
  y: number,
  settle = 800,
  style: TapStyle = "physical",
) => {
  await (style === "held"
    ? run("axe", [
        "touch",
        "-x",
        String(x),
        "-y",
        String(y),
        "--down",
        "--up",
        "--delay",
        "0.2",
        "--udid",
        udid,
      ])
    : run("axe", ["tap", "-x", String(x), "-y", String(y), "--tap-style", style, "--udid", udid]))
  await sleep(settle)
}

export interface FindOptions {
  type?: string
  // Match labels that start with the text instead of equal it.
  prefix?: boolean
  // Pick the n-th match in reading order.
  nth?: number
  timeout?: number
  within?: (node: AxNode) => boolean
  style?: TapStyle
}

export const find = async (udid: string, labels: string[], options: FindOptions = {}) => {
  const deadline = Date.now() + (options.timeout ?? 15_000)
  while (Date.now() < deadline) {
    const matches = (await describe(udid))
      .filter((n) => labels.some((l) => (options.prefix ? n.label.startsWith(l) : n.label === l)))
      .filter((n) => !options.type || n.type === options.type)
      .filter((n) => !options.within || options.within(n))
      .sort((a, b) => a.frame.y - b.frame.y || a.frame.x - b.frame.x)
    const match = matches[options.nth ?? 0]
    if (match) return match
    await sleep(700)
  }
  return null
}

export const tapLabel = async (
  udid: string,
  labels: string[],
  options: FindOptions = {},
  settle = 1200,
) => {
  const node = await find(udid, labels, options)
  if (!node) throw new Error(`No element labelled ${labels.join(" / ")}`)
  await tapPoint(
    udid,
    node.frame.x + node.frame.width / 2,
    node.frame.y + node.frame.height / 2,
    settle,
    options.style,
  )
  return node
}

export const swipe = async (
  udid: string,
  from: [number, number],
  to: [number, number],
  duration = 0.35,
  settle = 900,
) => {
  await run("axe", [
    "swipe",
    "--start-x",
    String(from[0]),
    "--start-y",
    String(from[1]),
    "--end-x",
    String(to[0]),
    "--end-y",
    String(to[1]),
    "--duration",
    String(duration),
    "--udid",
    udid,
  ])
  await sleep(settle)
}

export const screenshot = async (udid: string, path: string) => {
  await run("xcrun", ["simctl", "io", udid, "screenshot", path])
}

export const screenSize = async (udid: string) => {
  const app = (await describe(udid)).find((n) => n.type === "Application")
  if (!app) throw new Error("Application frame not found")
  return { width: app.frame.width, height: app.frame.height }
}

export const typeText = async (udid: string, text: string) => {
  await run("axe", ["type", text, "--udid", udid])
}
