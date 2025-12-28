import '../globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Artvision Portal',
  description: 'SEO Dashboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function WebAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script src="https://telegram.org/js/telegram-web-app.js" />
      {children}
    </>
  )
}
