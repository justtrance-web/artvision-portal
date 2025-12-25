'use client'

import { useTelegram } from '../hooks/useTelegram'

export default function TelegramHeader() {
  const { user, isTelegram, isReady } = useTelegram()
  
  if (!isReady) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48"></div>
      </div>
    )
  }
  
  if (!isTelegram) {
    return null // Не показываем на обычном сайте
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 mb-6 border border-blue-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold">
            {user?.first_name?.[0] || '?'}
          </div>
          <div>
            <div className="font-semibold">
              {user?.first_name} {user?.last_name || ''}
            </div>
            {user?.username && (
              <div className="text-sm text-slate-400">@{user.username}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Telegram Mini App
        </div>
      </div>
    </div>
  )
}
