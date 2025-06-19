import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/context/auth-context"
import { SharedDataProvider } from "@/lib/context/shared-data-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StudySync - Student Task & Schedule Manager",
  description: "A comprehensive task and schedule management application for students",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SharedDataProvider>
              {children}
              <Toaster />
            </SharedDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
