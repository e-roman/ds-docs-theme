import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "ds-docs-theme/docs/site-header"
import { Toaster } from "ds-docs-theme/ui/sonner"
import { TooltipProvider } from "ds-docs-theme/ui/tooltip"
import { allTokens, brand, topNav } from "@/lib/project"
import { searchIndex } from "@/lib/search-index"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Acme Design System",
  description: "Playground del theme de documentación, con datos de ejemplo.",
}

/** Colores que salen de los tokens del proyecto. */
const tokenValue = (name: string, fallback: string) => allTokens().find((t) => t.name === name)?.resolved ?? fallback

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const vars = {
    "--brand": tokenValue("color-brand-default", "#4f46e5"),
    "--success": tokenValue("color-semantic-feedback-success-text", "#15803d"),
    "--danger": tokenValue("color-semantic-feedback-error-border", "#ef4444"),
    "--doc-font-sans": "var(--font-geist-sans)",
    "--doc-font-mono": "var(--font-geist-mono)",
  } as CSSProperties
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={vars}>
      <head>
        {/* Tokens y fuentes de la tienda a nivel documento: las variables CSS y las @font-face sí atraviesan el shadow root */}
        <link rel="stylesheet" href="/orali-tokens.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" />
      </head>
      <body className="min-h-full">
        <TooltipProvider>
          <SiteHeader entries={searchIndex()} brand={brand} topNav={topNav} />
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
