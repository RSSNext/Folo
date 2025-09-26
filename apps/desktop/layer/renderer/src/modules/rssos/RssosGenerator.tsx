import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { FeedForm } from "~/modules/discover/FeedForm"

const RSSOS_API_BASE = "https://rssos.vercel.app"

export const RssosGenerator: React.FC = () => {
  const { t } = useTranslation("app")
  const [url, setUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRssUrl, setGeneratedRssUrl] = useState("")
  const [error, setError] = useState("")

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  const generateRss = useCallback(async () => {
    if (!validateUrl(url)) {
      setError(t("rssos.invalid_url", "Please enter a valid URL"))
      return
    }

    setIsGenerating(true)
    setError("")
    setGeneratedRssUrl("")

    try {
      // Test the RSSOS API endpoint
      const testUrl = `${RSSOS_API_BASE}/api/generate?url=${encodeURIComponent(url)}`
      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(t("rssos.generation_failed", "Failed to generate RSS feed"))
      }

      // Get site type from headers
      const siteType = response.headers.get("X-Site-Type") || "unknown"
      const articlesFound = response.headers.get("X-Articles-Found") || "0"

      // Set the generated RSS URL
      setGeneratedRssUrl(testUrl)
      
      toast.success(
        t(
          "rssos.generation_success",
          `RSS feed generated successfully! Found ${articlesFound} articles from ${siteType} site.`,
        ),
        { duration: 3000 }
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(t("rssos.error", `Error: ${errorMessage}`))
      toast.error(t("rssos.generation_error", "Failed to generate RSS feed"))
    } finally {
      setIsGenerating(false)
    }
  }, [url, t])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedRssUrl)
      toast.success(t("rssos.copied", "RSS URL copied to clipboard!"))
    } catch {
      toast.error(t("rssos.copy_failed", "Failed to copy to clipboard"))
    }
  }, [generatedRssUrl, t])

  const { present, dismissAll } = useModalStack()
  
  const addToFolo = useCallback(async () => {
    // Check if we're in web build mode
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // In web development mode, provide a helpful message
      toast.info(
        t("rssos.web_mode_info", "In web mode, please copy the RSS URL and add it manually to Folo. The full subscription flow requires the desktop app.")
        { duration: 5000 }
      )
      
      // Copy URL to clipboard for convenience
      try {
        await navigator.clipboard.writeText(generatedRssUrl)
        toast.success(t("rssos.copied", "RSS URL copied to clipboard!"))
      } catch {
        // Fallback - just show the info message
      }
      return
    }
    
    // In production/desktop mode, use the full subscription form
    try {
      present({
        title: t("feed_form.add_feed", "Add Feed"),
        content: () => <FeedForm url={generatedRssUrl} onSuccess={dismissAll} />,
      })
    } catch (error) {
      console.error('Error opening feed form:', error)
      toast.error(t("rssos.add_error", "Unable to open subscription form. Please copy the RSS URL and add it manually."))
      
      // Copy URL to clipboard as fallback
      try {
        await navigator.clipboard.writeText(generatedRssUrl)
        toast.success(t("rssos.copied", "RSS URL copied to clipboard!"))
      } catch {
        // Silent fail
      }
    }
  }, [generatedRssUrl, t, present, dismissAll])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {t("rssos.title", "Generate RSS from Any Website")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "rssos.description",
            "Enter any website URL to automatically generate an RSS feed using RSSOS service.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder={t("rssos.url_placeholder", "https://example.com")}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGenerating) {
                generateRss()
              }
            }}
            disabled={isGenerating}
            className="flex-1"
          />
          <Button
            onClick={generateRss}
            disabled={!url || isGenerating}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <LoadingCircle size="small" className="mr-2" />
                {t("rssos.generating", "Generating...")}
              </>
            ) : (
              <>
                <i className="i-mgc-sparkles-cute-re mr-2" />
                {t("rssos.generate", "Generate RSS")}
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <i className="i-mgc-warning-cute-re" />
            <span>{error}</span>
          </div>
        )}

        {generatedRssUrl && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("rssos.generated_url", "Generated RSS URL:")}
              </span>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="h-8 w-8 p-0"
                    >
                      <i className="i-mgc-copy-cute-re" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("rssos.copy", "Copy URL")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(generatedRssUrl, "_blank")}
                      className="h-8 w-8 p-0"
                    >
                      <i className="i-mgc-external-link-cute-re" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("rssos.preview", "Preview RSS")}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <code className="break-all text-xs text-muted-foreground">
              {generatedRssUrl}
            </code>
            <Button
              onClick={addToFolo}
              className="mt-2"
              variant="default"
            >
              <i className="i-mgc-add-cute-re mr-2" />
              {t("rssos.add_to_folo", "Add to Folo")}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            {t(
              "rssos.info",
              "RSSOS automatically detects and parses content from blogs, news sites, portfolios, and more.",
            )}
          </p>
          <p>
            {t(
              "rssos.powered_by",
              "Powered by RSSOS - Universal RSS Generator",
            )}
            {" "}
            <a 
              href="https://rssos.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {t("rssos.learn_more", "Learn more")}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}