import type React from "react"
import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Athena - REST API Dashboard Builder",
  description: "Build powerful dashboards with drag & drop. Transform your data with the wisdom of Athena.",
  authors: [
    { 
      name: "Gabriel Blaisot - KwikKill",
      url: "https://gabriel.blaisot.org",
    }
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Build powerful dashboards with drag & drop. Transform your data with the wisdom of Athena." />
        <meta name="keywords" content="dashboard, analytics, data visualization, REST API, widgets, charts, graphs, open source, Next.js, Supabase" />
        <meta name="author" content="Gabriel Blaisot - KwikKill" />
        <meta property="og:title" content="Athena - REST API Dashboard Builder" />
        <meta property="og:description" content="Build powerful dashboards with drag & drop. Transform your data with the wisdom of Athena." />
      </head>
      <body className={`font-sans ${inter.variable} ${manrope.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
