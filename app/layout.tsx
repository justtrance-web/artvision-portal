import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artvision Portal',
  description: 'Клиентский портал — отчёты, метрики, документы',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
