import { canUpdateRender, CanUpdateRenderState } from "./check"
import { cleanupOldRender } from "./cleanup"
import { loadDynamicRenderEntry } from "./entry"
import type { RenderManifest } from "./manifest"
import { hotUpdateRender } from "./update"

/**
 * Render layer hot-update bootstrapper.
 * Provides a class-based interface for checking, applying, loading and cleaning up updates.
 */
export class RenderUpdateBootstrapper {
  private manifest: RenderManifest | null = null
  private state: CanUpdateRenderState | null = null

  /**
   * Check if renderer can be hot-updated and cache the result.
   */
  async check() {
    const [state, manifest] = await canUpdateRender()
    this.state = state
    this.manifest = manifest
    return [state, manifest] as const
  }

  /**
   * Apply renderer hot update using cached manifest (checks again if missing).
   */
  async apply() {
    if (!this.manifest || this.state !== CanUpdateRenderState.NEEDED) {
      const [state] = await this.check()
      if (state !== CanUpdateRenderState.NEEDED || !this.manifest) return false
    }
    return hotUpdateRender(this.manifest)
  }

  /**
   * Load dynamic renderer entry if hot-update exists.
   */
  entry() {
    return loadDynamicRenderEntry()
  }

  /**
   * Cleanup outdated renderer assets.
   */
  async cleanup() {
    await cleanupOldRender()
  }
}

export const renderUpdater = new RenderUpdateBootstrapper()

export { CanUpdateRenderState } from "./check"
export { type RenderManifest } from "./manifest"
