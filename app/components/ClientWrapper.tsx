'use client'

import { ReactNode } from 'react'
import TelegramHeader from './TelegramHeader'
import { useTelegram } from '../hooks/useTelegram'

interface Props {
  children: ReactNode
}

export default function ClientWrapper({ children }: Props) {
  const { isTelegram, isReady } = useTelegram()
  
  return (
    <>
      <TelegramHeader />
      {children}
      
      {/* Telegram Mini App padding для нижней панели */}
      {isTelegram && isReady && <div className="h-20"></div>}
    </>
  )
}
