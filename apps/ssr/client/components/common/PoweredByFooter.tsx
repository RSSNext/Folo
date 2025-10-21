import { SocialMediaLinks } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import * as React from "react"

export const PoweredByFooter: Component = ({ className }) => (
  <footer className={cn("border-t border-border/40 bg-background/60 backdrop-blur-sm", className)}>
    <div className="mx-auto w-full max-w-[var(--container-max-width)] px-6 py-10 lg:px-8">
      {/* Main row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: copyright + legal */}
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <p className="text-center text-xs text-text-tertiary md:text-left">
            © {new Date().getFullYear()} <a href="https://app.folo.is">Folo</a>. All rights
            reserved.
          </p>
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <a
              href="https://folo.is/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary transition-colors hover:text-text"
            >
              Privacy Policy
            </a>
            <a
              href="https://folo.is/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary transition-colors hover:text-text"
            >
              Terms of Service
            </a>
          </div>
        </div>

        {/* Right: social links */}
        <div className="flex items-center justify-center gap-2 md:justify-end">
          {SocialMediaLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "group relative flex items-center justify-center rounded-lg",
                "hover:bg-fill/40 active:bg-fill/60",
                "size-9",
              )}
              aria-label={link.label}
            >
              <i
                className={cn(
                  link.iconClassName,
                  "transition-transform duration-200 group-hover:scale-110",
                )}
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue/10 to-purple/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
)
