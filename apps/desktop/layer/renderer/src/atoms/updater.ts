import type { StoreDistribution } from "@follow-app/client-sdk"
import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export type UpdaterStatus = "ready"
type UpdaterStatusKind = "app" | "renderer" | "pwa" | "distribution"

type BaseUpdaterStatus<T extends UpdaterStatusKind> = {
  type: T
  status: UpdaterStatus
  finishUpdate?: () => void
}

type AppUpdaterStatus = BaseUpdaterStatus<"app">

type RendererUpdaterStatus = BaseUpdaterStatus<"renderer">

type PwaUpdaterStatus = BaseUpdaterStatus<"pwa">

type DistributionUpdaterStatus = BaseUpdaterStatus<"distribution"> & {
  distribution: StoreDistribution
  storeUrl: string
  storeVersion: string | null
  currentVersion: string | null
}

export type UpdaterStatusAtom =
  | AppUpdaterStatus
  | RendererUpdaterStatus
  | PwaUpdaterStatus
  | DistributionUpdaterStatus
  | null
export const [, , useUpdaterStatus, , getUpdaterStatus, setUpdaterStatus] = createAtomHooks(
  atom(null as UpdaterStatusAtom),
)
