/// <reference lib="webworker" />
import { registerPusher } from "./pusher"

declare let self: ServiceWorkerGlobalScope

registerPusher(self)
