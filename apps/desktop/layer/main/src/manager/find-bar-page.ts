// The find bar's page, loaded into a view of its own above the window's page. It talks to the
// main process through the app's preload script (`window.electron`).

export const FindBarChannel = {
  /** Page to main: find `{ text, direction }` */
  find: "find-bar:find",
  /** Page to main: the text was emptied */
  clear: "find-bar:clear",
  /** Page to main: Escape or the close button */
  close: "find-bar:close",
  /** Main to page: shown, `{ labels, accent }` */
  open: "find-bar:open",
  /** Main to page: `{ activeMatchOrdinal, matches }` */
  result: "find-bar:result",
} as const

/**
 * Room around the bar for its shadow, in the page and in the view's bounds. The view takes the
 * clicks in it, so the top stays narrow: the shadow falls below the bar, and the buttons of the
 * page's header reach down to just above it.
 */
export const FIND_BAR_SHADOW_MARGIN = { top: 6, side: 16, bottom: 16 } as const
export const FIND_BAR_WIDTH = 256
export const FIND_BAR_HEIGHT = 36

// MingCute back-2, forward-2 and close (cute, regular)
const icons = {
  previous:
    "M11.64 6.04c-1.948.202-3.634.888-5.12 2.084-.657.529-1.499 1.454-1.965 2.158l-.064.097-.045-.209c-.136-.633-.175-1.191-.156-2.23.015-.802.007-1.075-.034-1.191-.237-.672-1.124-.87-1.631-.364-.297.298-.366.746-.332 2.175.031 1.356.232 2.467.656 3.64.389 1.074.624 1.436 1.077 1.658.292.142.586.179 1.454.181 1.732.003 3.292-.321 4.81-.998.558-.249.715-.36.841-.593.268-.495.112-1.078-.362-1.357-.162-.095-.231-.111-.489-.109-.266.001-.341.02-.666.17-1.051.485-2.274.803-3.353.873l-.43.027.051-.096c.626-1.18 1.711-2.287 2.919-2.977 1.584-.904 3.423-1.188 5.255-.813 2.506.514 4.642 2.384 5.503 4.817.263.744.387 1.388.438 2.272.034.594.093.76.348.984.205.18.37.241.655.241.285 0 .45-.061.655-.241.281-.247.326-.385.321-.999-.015-2.271-.973-4.579-2.608-6.285a9.444 9.444 0 0 0-5.544-2.858c-.497-.072-1.724-.104-2.184-.057",
  next: "M10.84 6.026c-1.118.107-1.908.284-2.767.618a9.511 9.511 0 0 0-5.015 4.523c-.682 1.339-1.025 2.689-1.034 4.073-.005.614.04.752.321.999.205.18.37.241.655.241.285 0 .45-.061.655-.241.255-.224.314-.39.348-.984.064-1.125.279-2.013.711-2.947.707-1.526 2.069-2.888 3.598-3.595 1.642-.761 3.532-.918 5.208-.434a7.5 7.5 0 0 1 3.255 1.899c.52.517 1.038 1.203 1.343 1.778l.051.096-.43-.027c-1.078-.07-2.378-.411-3.399-.89-.278-.131-.359-.151-.62-.153-.258-.002-.326.014-.489.109-.332.195-.545.618-.495.983.033.243.207.543.385.667.558.386 2.288.968 3.439 1.155.865.141 2.316.192 2.933.103.76-.11 1.08-.479 1.558-1.799.424-1.173.625-2.284.656-3.64.025-1.043-.022-1.674-.139-1.905a.985.985 0 0 0-1.363-.434.927.927 0 0 0-.448.479c-.034.084-.05.51-.054 1.42-.005 1.152-.016 1.352-.093 1.755-.047.25-.093.461-.101.47-.008.008-.111-.123-.228-.292a9.94 9.94 0 0 0-2.765-2.618c-.443-.275-1.444-.755-1.896-.908-1.197-.406-2.696-.605-3.78-.501",
  close:
    "M5.42 4.676c-.282.073-.54.286-.683.564-.097.19-.097.607.002.82.05.11.968 1.057 2.957 3.05L10.579 12l-2.883 2.89c-1.989 1.993-2.907 2.94-2.957 3.05-.105.226-.099.63.01.84.182.348.503.553.871.555.475.003.302.154 3.47-3.009L12 13.421l2.89 2.885c1.59 1.587 2.951 2.916 3.025 2.953.455.229 1.046.045 1.312-.407.097-.165.113-.234.112-.492 0-.212-.022-.341-.074-.44-.04-.077-1.372-1.441-2.959-3.03L13.42 12l2.867-2.87c2.021-2.025 2.892-2.923 2.957-3.05.116-.23.125-.633.019-.84a1.234 1.234 0 0 0-.483-.491c-.227-.118-.617-.115-.86.007-.127.065-1.026.936-3.05 2.958L12 10.58 9.13 7.714C7.238 5.824 6.204 4.82 6.096 4.766c-.189-.094-.502-.136-.676-.09",
}

const icon = (path: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="currentColor" fill-rule="evenodd"/></svg>`

// Runs in the page. Kept as a function so that it is type-checked, then inlined as source.
function findBarScript(channel: typeof FindBarChannel) {
  type IpcListener = (event: unknown, payload: never) => void
  const { ipcRenderer } = (
    window as unknown as {
      electron: {
        ipcRenderer: {
          send: (channel: string, payload?: unknown) => void
          on: (channel: string, listener: IpcListener) => void
        }
      }
    }
  ).electron

  const bar = document.querySelector("form")!
  const input = document.querySelector("input")!
  const count = document.querySelector("output")!
  const previous = document.querySelector<HTMLButtonElement>("#previous")!
  const next = document.querySelector<HTMLButtonElement>("#next")!
  const close = document.querySelector<HTMLButtonElement>("#close")!

  let composing = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const find = (direction: "forward" | "backward") => {
    clearTimeout(timer)
    if (composing) return
    if (!input.value) {
      count.textContent = ""
      ipcRenderer.send(channel.clear)
      return
    }
    ipcRenderer.send(channel.find, { text: input.value, direction })
  }
  const findSoon = () => {
    clearTimeout(timer)
    timer = setTimeout(() => find("forward"), 200)
  }
  const requestClose = () => {
    // A search still waiting for the typing to stop would run in the page after the bar closed
    clearTimeout(timer)
    ipcRenderer.send(channel.close)
  }

  input.addEventListener("input", () => {
    if (!composing) findSoon()
  })
  input.addEventListener("compositionstart", () => {
    composing = true
  })
  input.addEventListener("compositionend", () => {
    composing = false
    findSoon()
  })
  input.addEventListener("keydown", (event) => {
    if (event.isComposing || composing) return
    if (event.key === "Enter") {
      event.preventDefault()
      find(event.shiftKey ? "backward" : "forward")
    } else if (event.key === "Escape") {
      event.preventDefault()
      requestClose()
    }
  })
  bar.addEventListener("submit", (event) => event.preventDefault())
  for (const button of [previous, next, close]) {
    // Keeps the focus, and with it typing and Enter, in the field
    button.addEventListener("mousedown", (event) => event.preventDefault())
  }
  previous.addEventListener("click", () => find("backward"))
  next.addEventListener("click", () => find("forward"))
  close.addEventListener("click", requestClose)

  ipcRenderer.on(
    channel.open,
    (
      _event,
      {
        labels,
        accent,
      }: {
        labels: { find: string; previous: string; next: string; close: string }
        accent: string | null
      },
    ) => {
      input.setAttribute("aria-label", labels.find)
      for (const [button, label] of [
        [previous, labels.previous],
        [next, labels.next],
        [close, labels.close],
      ] as const) {
        button.title = label
        button.setAttribute("aria-label", label)
      }
      if (accent) document.documentElement.style.setProperty("--accent", accent)

      bar.classList.remove("appear")
      void bar.offsetWidth
      bar.classList.add("appear")
      // Like browser find bars, it starts with the previous search, selected
      input.focus()
      input.select()
    },
  )
  ipcRenderer.on(
    channel.result,
    (_event, { activeMatchOrdinal, matches }: { activeMatchOrdinal: number; matches: number }) => {
      count.textContent =
        input.value && matches > 0 && activeMatchOrdinal > 0
          ? `${activeMatchOrdinal}/${matches}`
          : ""
    },
  )
}

export const findBarPage = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<style>
:root {
  color-scheme: light dark;
  --accent: hsl(21.6 100% 50%);
  --background: rgb(250 250 250 / 0.97);
  --border: rgb(0 0 0 / 0.1);
  --text: rgb(0 0 0 / 0.85);
  --secondary: rgb(0 0 0 / 0.5);
  --hover: rgb(0 0 0 / 0.06);
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: rgb(38 38 38 / 0.97);
    --border: rgb(255 255 255 / 0.1);
    --text: rgb(255 255 255 / 0.88);
    --secondary: rgb(255 255 255 / 0.55);
    --hover: rgb(255 255 255 / 0.08);
  }
}
html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; }
body { box-sizing: border-box; padding: ${FIND_BAR_SHADOW_MARGIN.top}px ${FIND_BAR_SHADOW_MARGIN.side}px ${FIND_BAR_SHADOW_MARGIN.bottom}px; font: 15px system-ui, sans-serif; color: var(--text); }
form {
  box-sizing: border-box; display: flex; align-items: center; gap: 4px;
  width: ${FIND_BAR_WIDTH}px; height: ${FIND_BAR_HEIGHT}px; margin: 0; padding: 0 6px 0 12px;
  border: 1px solid var(--border); border-radius: 16px; background: var(--background);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 6px 16px rgb(0 0 0 / 0.12);
}
form:focus-within { border-color: var(--accent); }
form.appear { animation: appear 160ms ease-out; }
@keyframes appear { from { opacity: 0; transform: translateY(-6px); } }
@media (prefers-reduced-motion: reduce) { form.appear { animation: none; } }
input {
  flex: 1; min-width: 0; height: 100%; margin: 0 4px 0 0; padding: 0; border: 0; outline: 0;
  background: transparent; color: inherit; font: inherit; caret-color: var(--accent);
}
output { color: var(--secondary); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
output:not(:empty) { margin-right: 4px; }
button {
  display: grid; place-items: center; flex: none; width: 24px; height: 24px; padding: 0;
  border: 0; border-radius: 8px; background: transparent; color: inherit; opacity: 0.8;
}
button:hover { opacity: 1; background: var(--hover); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
svg { width: 16px; height: 16px; }
</style>
</head>
<body>
<form autocomplete="off">
<input type="text" spellcheck="false">
<output aria-live="polite"></output>
<button type="button" id="previous">${icon(icons.previous)}</button>
<button type="button" id="next">${icon(icons.next)}</button>
<button type="button" id="close">${icon(icons.close)}</button>
</form>
<script>(${findBarScript.toString()})(${JSON.stringify(FindBarChannel)})</script>
</body>
</html>`
