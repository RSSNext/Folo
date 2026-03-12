"use strict"

const { isUtf8 } = require("node:buffer")

module.exports = function isValidUTF8(buffer) {
  if (typeof isUtf8 === "function") {
    return isUtf8(buffer)
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}
