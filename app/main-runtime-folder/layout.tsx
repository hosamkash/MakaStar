import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google" // Import Tajawal font
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ThemeToggle } from "@/components/theme-toggle"
import FixedChatButton from "@/components/fixed-chat-button"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/lib/contexts/cart-context"
import { CartAddDialogProvider } from "@/lib/contexts/cart-add-dialog-context"
import LiveUsersProvider from "@/components/live-users-provider"
import CartAddManager from "@/components/cart-add-manager"

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "مكة ستار",
  description: "اكتشف الأناقة العصرية مع شركة مكة ستار",
  generator: 'v0.dev',
  icons: {
    icon: '/maka-star-logo.png',
    shortcut: '/maka-star-logo.png',
    apple: '/maka-star-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" suppressHydrationWarning dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="google" content="notranslate" />
        <meta name="format-detection" content="telephone=no" />
        <script src="/disable-password-manager.js" defer></script>
      </head>
      <body className={`${tajawal.className} safe-area-padding`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CartProvider>
            <CartAddDialogProvider>
              <LiveUsersProvider />
              <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
                <Navbar />
                <main className="flex-1 w-full">{children}</main>
                <Footer />
              </div>
              <ThemeToggle />
              <FixedChatButton />
              <Toaster />
              <CartAddManager />
            </CartAddDialogProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
