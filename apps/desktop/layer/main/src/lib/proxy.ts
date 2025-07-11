import { session } from "electron"
import { ProxyAgent, setGlobalDispatcher } from "undici"

import { logger } from "../logger"
import { store } from "./store"

// Sets up the proxy configuration for the app.
//
// See https://www.electronjs.org/docs/latest/api/session#sessetproxyconfig
// for more information about the proxy API.
//
// The open-source project [poooi/poi](https://github.com/poooi/poi) is doing well in proxy configuration
// refer the following files for more details:
//
// https://github.com/poooi/poi/blob/5741d0d02c0a08626dd53196b094223457014491/lib/proxy.ts#L36
// https://github.com/poooi/poi/blob/5741d0d02c0a08626dd53196b094223457014491/views/components/settings/network/index.es

export const setProxyConfig = (inputProxy: string) => {
  const proxyUri = normalizeProxyUri(inputProxy)
  if (!proxyUri) {
    store.delete("proxy")
    return false
  }
  store.set("proxy", proxyUri)
  return true
}

export const getProxyConfig = () => {
  const proxyConfig = store.get("proxy")
  if (!proxyConfig) {
    return
  }
  const proxyUri = normalizeProxyUri(proxyConfig)
  return proxyUri
}

const URL_SCHEME = new Set(["http:", "https:", "ftp:", "socks:", "socks4:", "socks5:"])

const normalizeProxyUri = (userProxy: string) => {
  if (!userProxy) {
    return
  }
  // Only use the first proxy if there are multiple urls
  const firstInput = userProxy.split(",")[0]!

  try {
    const proxyUrl = new URL(firstInput)
    if (!URL_SCHEME.has(proxyUrl.protocol) || !proxyUrl.hostname) {
      return
    }
    // There are multiple ways to specify a proxy in Electron,
    // but for security reasons, we only support simple proxy URLs for now.
    return `${proxyUrl.protocol}//${proxyUrl.hostname}${proxyUrl.port ? `:${proxyUrl.port}` : ""}`
  } catch {
    return
  }
}

const BYPASS_RULES = ["<local>"].join(";")

export const updateProxy = () => {
  const proxyUri = getProxyConfig()
  if (!proxyUri) {
    session.defaultSession.setProxy({
      // Note that the system mode is different from setting no proxy configuration.
      // In the latter case, Electron falls back to the system settings only if no command-line options influence the proxy configuration.
      mode: "system",
    })
    return
  }
  const proxyRules = [
    proxyUri,
    // Failing over to using no proxy if the proxy is unavailable
    "direct://",
  ].join(",")

  logger.log(`Loading proxy: ${proxyRules}`)
  session.defaultSession.setProxy({
    proxyRules,
    proxyBypassRules: BYPASS_RULES,
  })

  // https://github.com/nodejs/undici/issues/2224
  // Error occurred in handler for 'setProxyConfig': InvalidArgumentError: Invalid URL protocol: the URL must start with `http:` or `https:`.
  const { protocol } = new URL(proxyUri)
  if (protocol !== "http:" && protocol !== "https:") {
    // undici doesn't support socks proxy
    logger.warn("undici only supports http and https proxy, skipping undici proxy setup")
    return
  }
  // Currently, Session.setProxy is not working for native fetch, which is used by readability.
  // So we need to set proxy for native fetch manually, refer to https://stackoverflow.com/a/76503362/14676508
  const dispatcher = new ProxyAgent({ uri: new URL(proxyUri).toString() })
  setGlobalDispatcher(dispatcher)
}
