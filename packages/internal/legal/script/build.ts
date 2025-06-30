import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { marked } from "marked"

// Define paths to markdown and output files
const __dirname = fileURLToPath(new URL(".", import.meta.url))

const PRIVACY_MD_PATH = resolve(__dirname, "../privacy.md")
const TOS_MD_PATH = resolve(__dirname, "../tos.md")
const OUTPUT_PATH = resolve(__dirname, "../dist")

// GitHub markdown CSS style
const githubMarkdownCSS = `
<style>
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
    padding: 45px;
    max-width: 980px;
    margin: 0 auto;
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }
  .markdown-body h1 {
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid #eaecef;
  }
  .markdown-body h2 {
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
  }
  .markdown-body p {
    margin-top: 0;
    margin-bottom: 16px;
  }
  .markdown-body ul, .markdown-body ol {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 16px;
  }
  .markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27,31,35,0.05);
    border-radius: 3px;
  }
  .markdown-body blockquote {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin: 0 0 16px 0;
  }
</style>
`

/**
 * Converts markdown content to HTML with GitHub styling
 */
function convertMarkdownToHtml(markdown: string): string {
  const htmlContent = marked(markdown)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${githubMarkdownCSS}
</head>
<body>
  <div class="markdown-body">
    ${htmlContent}
  </div>
</body>
</html>`
}

// Main build function
async function build() {
  try {
    mkdirSync(OUTPUT_PATH, { recursive: true })
    // Create output objects
    const output: Record<string, string> = {}

    // Read and convert markdown files
    const privacyMd = readFileSync(PRIVACY_MD_PATH, "utf-8")
    const tosMd = readFileSync(TOS_MD_PATH, "utf-8")

    // Convert markdown to HTML
    const privacyHtml = convertMarkdownToHtml(privacyMd)
    const tosHtml = convertMarkdownToHtml(tosMd)

    // Add to output object
    output.privacy = privacyHtml
    output.tos = tosHtml

    // Create output directory and write files
    try {
      // Write the HTML files for reference
      writeFileSync(`${OUTPUT_PATH}/privacy.html`, privacyHtml)
      writeFileSync(`${OUTPUT_PATH}/tos.html`, tosHtml)

      // Export as a module
      const moduleContent = `export const legalHtml = ${JSON.stringify(output, null, 2)}; export const legalMarkdown = ${JSON.stringify(
        {
          privacy: privacyMd,
          tos: tosMd,
        },
        null,
        2,
      )};`
      writeFileSync(`${OUTPUT_PATH}/index.ts`, moduleContent)

      console.info("✅ Legal documents successfully built")
    } catch (error) {
      console.error("Failed to write output files:", error)
    }
  } catch (error) {
    console.error("Build failed:", error)
    throw error
  }
}

// Run the build
build().catch(console.error)
