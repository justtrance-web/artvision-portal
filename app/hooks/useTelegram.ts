'use client'

import { useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  initDataUnsafe: {
    user?: TelegramUser
    start_param?: string
  }
  platform: string
  colorScheme: 'light' | 'dark'
  isExpanded: boolean
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      setWebApp(tg)
      setUser(tg.initDataUnsafe?.user || null)
      setIsTelegram(true)
      setIsReady(true)
      tg.ready()
      tg.expand()
    } else {
      setIsReady(true)
    }
  }, [])

  return {
    webApp,
    user,
    isReady,
    isTelegram,
    close: () => webApp?.close(),
    expand: () => webApp?.expand(),
  }
}
