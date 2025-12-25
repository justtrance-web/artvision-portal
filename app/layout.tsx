import './globals.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Artvision Portal',
  description: 'Клиентский портал — отчёты, метрики, документы',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* Telegram WebApp SDK */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-slate-900 text-white">
        {children}
        <Script id="telegram-init" strategy="afterInteractive">
          {`
            if (window.Telegram?.WebApp) {
              const tg = window.Telegram.WebApp;
              tg.ready();
              tg.expand();
              
              // Применяем тему Telegram
              document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0f172a');
              document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
              
              console.log('[Portal] Telegram WebApp initialized', tg.initDataUnsafe);
            }
          `}
        </Script>
      </body>
    </html>
  )
}
