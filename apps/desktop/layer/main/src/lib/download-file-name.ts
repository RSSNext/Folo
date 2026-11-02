const FALLBACK_FILE_NAME = "download"

// Characters that file systems reject in a name, or that would turn it into a path
const UNSAFE_CHARACTERS = new Set(['"', "*", "/", ":", "<", ">", "?", "\\", "|"])

const toSafeFileName = (name: string) =>
  Array.from(name, (char) =>
    (char.codePointAt(0) ?? 0) < 0x20 || UNSAFE_CHARACTERS.has(char) ? "_" : char,
  )
    .join("")
    .trim()

/**
 * The file name a save dialog suggests for a URL: the last segment of its path, decoded. The
 * query string, e.g. the size asked of an image service, is no part of it.
 */
export const getDownloadFileName = (url: string) => {
  let pathname: string
  try {
    ;({ pathname } = new URL(url))
  } catch {
    pathname = url.split(/[?#]/, 1)[0] ?? ""
  }

  const segment = pathname.split("/").pop() ?? ""
  let name = segment
  try {
    name = decodeURIComponent(segment)
  } catch {
    // A malformed escape stays as it is
  }

  const safeName = toSafeFileName(name)
  return safeName && !/^\.+$/.test(safeName) ? safeName : FALLBACK_FILE_NAME
}
