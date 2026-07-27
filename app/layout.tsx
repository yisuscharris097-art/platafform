import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relay Studios',
  description: 'Websites for real estate agents — client dashboard, CMS and studio admin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
