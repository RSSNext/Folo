import { cn } from "@follow/utils/utils"

import { Folo } from "../icons/folo"
import { Logo } from "../icons/logo"

interface FooterLink {
  href: string
  label: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { href: "https://folo.is", label: "Home", external: true },
      { href: "https://github.com/RSSNext/folo", label: "GitHub", external: true },
      { href: "https://github.com/RSSNext/folo/releases", label: "Download", external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://github.com/RSSNext/folo/issues", label: "Issues", external: true },
      {
        href: "https://discord.gg/followapp",
        label: "Discord",
        external: true,
      },
      { href: "https://x.com/follow_app_", label: "Twitter", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        href: "https://github.com/RSSNext/folo/blob/main/CONTRIBUTING.md",
        label: "Contributing",
        external: true,
      },
      {
        href: "https://github.com/RSSNext/folo/blob/main/CODE_OF_CONDUCT.md",
        label: "Code of Conduct",
        external: true,
      },
    ],
  },
]

const socialLinks = [
  {
    href: "https://github.com/RSSNext/follow",
    label: "GitHub",
    icon: "i-simple-icons-github",
  },
  {
    href: "https://twitter.com/follow_app_",
    label: "Twitter",
    icon: "i-simple-icons-x",
  },
  {
    href: "https://discord.gg/followapp",
    label: "Discord",
    icon: "i-simple-icons-discord",
  },
]

export const PoweredByFooter: Component = ({ className }) => (
  <footer className={cn("border-border/40 bg-background/60 border-t backdrop-blur-sm", className)}>
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Main Footer Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Brand Section */}
        <div className="lg:col-span-4">
          <div className="mb-4 flex items-center gap-3">
            <Logo className="size-8" />
            <Folo className="w-10" />
          </div>
          <p className="text-text-secondary max-w-sm text-sm leading-relaxed">
            A modern, AI-driven RSS reader that helps you follow everything in one place. Stay
            updated with your favorite content sources effortlessly.
          </p>

          {/* Social Links */}
          <div className="mt-6 flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-fill-secondary text-text-tertiary hover:bg-fill-tertiary hover:text-text flex size-9 items-center justify-center rounded-lg transition-colors"
                aria-label={social.label}
              >
                <span className={cn(social.icon, "size-4")} />
              </a>
            ))}
          </div>
        </div>

        {/* Links Sections */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-text mb-3 text-sm font-semibold">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(link.external && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                        className="text-text-secondary hover:text-text text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-border/40 mt-12 border-t pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-text-tertiary text-center text-xs md:text-left">
              © {new Date().getFullYear()} Follow. All rights reserved.
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
    </div>
  </footer>
)
