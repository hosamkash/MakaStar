import type { Metadata } from "next"
import { CartProvider } from "@/lib/contexts/cart-context"
import { CartAddDialogProvider } from "@/lib/contexts/cart-add-dialog-context"

export const metadata: Metadata = {
  title: "مكة ستار",
  icons: {
    icon: '/maka-star-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <CartProvider>
          <CartAddDialogProvider>
            {children}
          </CartAddDialogProvider>
        </CartProvider>
      </body>
    </html>
  )
}
