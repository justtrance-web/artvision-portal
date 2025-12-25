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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className="bg-slate-900 text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.Telegram && window.Telegram.WebApp) {
                var tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();
                console.log('[Portal] Telegram WebApp ready');
              }
            `
          }}
        />
      </body>
    </html>
  )
}
