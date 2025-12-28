'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Lightbulb,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  MessageCircle
} from 'lucide-react'

// Types
interface ClientData {
  name: string
  domain: string
  metrics: {
    shows: number
    showsChange: number
    clicks: number
    clicksChange: number
    avgPosition: number
    positionChange: number
  }
  topQueries: Array<{
    query: string
    position: number
    shows: number
    clicks: number
    change: number
  }>
  recommendations: Array<{
    query: string
    potential: number
    difficulty: string
  }>
  updatedAt?: string
}

// Navigation items
const NAV_ITEMS = [
  { id: 'dashboard', icon: BarChart3, label: 'Обзор' },
  { id: 'positions', icon: TrendingUp, label: 'Позиции' },
  { id: 'reports', icon: FileText, label: 'Отчёты' },
  { id: 'tips', icon: Lightbulb, label: 'Советы' },
]

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  change, 
  inverse = false 
}: { 
  label: string
  value: string | number
  change: number
  inverse?: boolean
}) {
  const isPositive = inverse ? change < 0 : change > 0
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400'
  const ChangeIcon = isPositive ? ChevronUp : ChevronDown
  
  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <div className={`flex items-center gap-1 mt-1 ${changeColor}`}>
        <ChangeIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{Math.abs(change)}%</span>
      </div>
    </div>
  )
}

// Position Chart
function PositionChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return (
    <div className="h-16 flex items-end gap-1">
      {data.map((val, i) => {
        const height = ((max - val) / range) * 100
        return (
          <div 
            key={i}
            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
            style={{ height: `${Math.max(height, 15)}%` }}
          />
        )
      })}
    </div>
  )
}

// Query Row Component  
function QueryRow({ 
  query, 
  position, 
  shows, 
  clicks, 
  change 
}: { 
  query: string
  position: number
  shows: number
  clicks: number
  change: number
}) {
  const changeColor = change < 0 ? 'text-emerald-400' : change > 0 ? 'text-red-400' : 'text-slate-500'
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-700/30 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center font-bold text-white shrink-0">
        {position.toFixed(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate text-sm">{query}</p>
        <p className="text-slate-500 text-xs">{shows.toLocaleString()} пок • {clicks} кл</p>
      </div>
      {change !== 0 && (
        <div className={`flex items-center shrink-0 ${changeColor}`}>
          {change < 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="text-sm font-medium">{Math.abs(change)}</span>
        </div>
      )}
    </div>
  )
}

export default function MiniApp() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [telegramUser, setTelegramUser] = useState<{ id: number; first_name: string } | null>(null)
  
  // Загрузка данных
  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    
    try {
      // Получаем telegram_id если есть
      const tgId = telegramUser?.id || 'demo'
      
      const response = await fetch(`/api/webapp/data?telegram_id=${tgId}`)
      const result = await response.json()
      
      if (result.success) {
        setData({
          name: result.client.name,
          domain: result.client.domain,
          metrics: result.metrics,
          topQueries: result.topQueries,
          recommendations: result.recommendations,
          updatedAt: result.updatedAt,
        })
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  useEffect(() => {
    // Инициализация Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      
      // Получаем данные пользователя
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user)
      }
      
      // Настраиваем MainButton для связи с менеджером
      tg.MainButton.setText('💬 Написать менеджеру')
      tg.MainButton.show()
      tg.MainButton.onClick(() => {
        tg.openTelegramLink('https://t.me/avpro_ru')
      })
    }
    
    fetchData()
  }, [])
  
  // Перезагрузка при смене пользователя
  useEffect(() => {
    if (telegramUser) {
      fetchData()
    }
  }, [telegramUser?.id])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка данных...</p>
        </div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-2">Нет данных</p>
          <p className="text-slate-400 text-sm mb-4">Свяжитесь с менеджером для подключения</p>
          <button 
            onClick={() => {
              const tg = (window as any).Telegram?.WebApp
              if (tg) tg.openTelegramLink('https://t.me/avpro_ru')
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl"
          >
            Написать менеджеру
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shrink-0">
              A
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-white leading-tight truncate">{data.name}</h1>
              <p className="text-slate-400 text-xs">{data.domain}</p>
            </div>
          </div>
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Показы" value={data.metrics.shows} change={data.metrics.showsChange} />
              <MetricCard label="Клики" value={data.metrics.clicks} change={data.metrics.clicksChange} />
            </div>
            
            {/* Position Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Средняя позиция</p>
                <div className={`flex items-center gap-1 text-sm ${data.metrics.positionChange < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.metrics.positionChange < 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{Math.abs(data.metrics.positionChange)}%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-3">{data.metrics.avgPosition}</p>
              <PositionChart data={[15, 14.5, 14, 13.5, 13, 12.8, data.metrics.avgPosition]} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Неделя назад</span>
                <span>Сегодня</span>
              </div>
            </div>
            
            {/* Top Queries Preview */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Топ запросы</p>
                <button onClick={() => setActiveTab('positions')} className="text-blue-400 text-sm flex items-center gap-1">
                  Все <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {data.topQueries.slice(0, 3).map((q, i) => <QueryRow key={i} {...q} />)}
            </div>
            
            {/* Quick Tip */}
            {data.recommendations[0] && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <p className="font-semibold">Потенциал роста</p>
                </div>
                <p className="text-slate-300 text-sm">{data.recommendations[0].query}</p>
                <p className="text-amber-400 font-medium mt-1">+{data.recommendations[0].potential.toLocaleString()} показов/мес</p>
              </div>
            )}
            
            {/* Updated time */}
            {data.updatedAt && (
              <p className="text-center text-slate-500 text-xs">
                Обновлено: {new Date(data.updatedAt).toLocaleString('ru')}
              </p>
            )}
          </div>
        )}
        
        {activeTab === 'positions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Все запросы</h2>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              {data.topQueries.length > 0 ? (
                data.topQueries.map((q, i) => <QueryRow key={i} {...q} />)
              ) : (
                <p className="text-slate-400 text-center py-8">Нет данных по запросам</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Отчёты</h2>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Отчёты за месяц</p>
              <button 
                onClick={() => {
                  const tg = (window as any).Telegram?.WebApp
                  if (tg) tg.openTelegramLink('https://t.me/avpro_ru?text=Хочу получить отчёт за месяц')
                }}
                className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm"
              >
                Запросить отчёт
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'tips' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Рекомендации</h2>
            {data.recommendations.map((r, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <p className="font-medium mb-1">{r.query}</p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-sm">+{r.potential.toLocaleString()} показов</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    r.difficulty === 'low' ? 'bg-green-500/20 text-green-400' :
                    r.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {r.difficulty === 'low' ? 'Легко' : r.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Contact CTA */}
            <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <p className="font-semibold">Нужна помощь?</p>
              </div>
              <p className="text-slate-300 text-sm mb-3">Обсудим стратегию продвижения</p>
              <button 
                onClick={() => {
                  const tg = (window as any).Telegram?.WebApp
                  if (tg) tg.openTelegramLink('https://t.me/avpro_ru')
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm w-full"
              >
                Написать менеджеру
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-area-inset-bottom">
        <div className="flex justify-around py-2 px-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition ${
                activeTab === item.id ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
