import { cn } from "@follow/utils/utils"

export const PoweredByFooter: Component = ({ className }) => (
  <footer className={cn("border-border/40 bg-background/60 border-t backdrop-blur-sm", className)}>
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Bottom Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-text-tertiary text-center text-xs md:text-left">
            © {new Date().getFullYear()} Folo. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <a
              href="https://app.folo.is/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text text-xs transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://app.folo.is/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text text-xs transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>

        <div className="text-text-tertiary flex items-center justify-center gap-2 text-xs md:justify-start">
          <span>Made with</span>
          <span className="text-red">♥</span>
          <span>by the</span>
          <a
            href="https://github.com/RSSNext"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 font-medium transition-colors"
          >
            RSSNext
          </a>
          <span>team</span>
        </div>
      </div>
    </div>
  </footer>
)
