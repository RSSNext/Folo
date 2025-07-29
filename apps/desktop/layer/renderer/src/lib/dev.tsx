export const attachOpenInEditor = (stack: string) => {
  const lines = stack.split("\n")
  return lines.map((line) => {
    // A line like this: at App (http://localhost:5173/src/App.tsx?t=1720527056591:41:9)
    // Find the `localhost` part and open the file in the editor
    if (!line.includes("at ")) {
      return line
    }
    const match = line.match(/http:\/\/localhost:\d+\/[^:]+:\d+:\d+/)

    if (match) {
      const [o] = match

      // Find `@fs/`
      // Like: `http://localhost:5173/@fs/Users/innei/git/work/rss3/follow/node_modules/.vite/deps/chunk-RPCDYKBN.js?v=757920f2:11548:26`
      const realFsPath = o.split("@fs")[1]

      if (realFsPath) {
        return (
          // Delete `v=` hash, like `v=757920f2`
          <div
            className="cursor-pointer"
            key={line}
            onClick={openInEditor.bind(null, realFsPath.replace(/\?v=[a-f0-9]+/, ""))}
          >
            {line}
          </div>
        )
      } else {
        // at App (http://localhost:5173/src/App.tsx?t=1720527056591:41:9)
        const srcFsPath = o.split("/src")[1]

        if (srcFsPath) {
          const fs = srcFsPath.replace(/\?t=[a-f0-9]+/, "")

          return (
            <div
              className="cursor-pointer"
              key={line}
              onClick={openInEditor.bind(null, `${APP_DEV_CWD}/layer/renderer/src${fs}`)}
            >
              {line}
            </div>
          )
        }
      }
    }

    return line
  })
}
// http://localhost:5173/src/App.tsx?t=1720527056591:41:9
const openInEditor = (file: string) => {
  fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}`)}`)
}

export const debugStack = () => {
  try {
    throw new Error("debug stack")
  } catch (e: any) {
    console.error(e.stack)
  }
}
