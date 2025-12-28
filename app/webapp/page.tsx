'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Lightbulb,
  ChevronUp,
  ChevronDown,
  ExternalLink
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
}

// Navigation items
const NAV_ITEMS = [
  { id: 'dashboard', icon: BarChart3, label: 'Дашборд' },
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
  
  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setData({
        name: 'Творим Совершенство',
        domain: 'tvorimsovershenstvo.ru',
        metrics: {
          shows: 1247,
          showsChange: 23,
          clicks: 89,
          clicksChange: 15,
          avgPosition: 12.4,
          positionChange: -8
        },
        topQueries: [
          { query: 'стоматология спб', position: 8, shows: 234, clicks: 18, change: -2 },
          { query: 'имплантация зубов', position: 12, shows: 189, clicks: 12, change: 1 },
          { query: 'виниры цена', position: 15, shows: 156, clicks: 8, change: -3 },
          { query: 'отбеливание зубов', position: 11, shows: 134, clicks: 11, change: 0 },
          { query: 'лечение кариеса', position: 9, shows: 98, clicks: 7, change: -1 },
        ],
        recommendations: [
          { query: 'имплантация под ключ', potential: 2400, difficulty: 'medium' },
          { query: 'керамические виниры', potential: 1800, difficulty: 'low' },
        ]
      })
      setLoading(false)
    }, 300)
  }, [])
  
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
    }
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!data) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold shrink-0">
            A
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-white leading-tight truncate">{data.name}</h1>
            <p className="text-slate-400 text-xs">{data.domain}</p>
          </div>
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
            
            {/* Position Chart */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Динамика позиций</p>
                <div className="flex items-center gap-1 text-emerald-400 text-sm">
                  <ChevronUp className="w-4 h-4" />
                  <span>{Math.abs(data.metrics.positionChange)}%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-3">{data.metrics.avgPosition}</p>
              <PositionChart data={[15, 14.5, 14, 13.5, 13, 12.8, 12.4]} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 дек</span>
                <span>10 дек</span>
                <span>20 дек</span>
              </div>
            </div>
            
            {/* Top Queries */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Топ запросы</p>
                <button onClick={() => setActiveTab('positions')} className="text-blue-400 text-sm flex items-center gap-1">
                  Все <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {data.topQueries.slice(0, 3).map((q, i) => <QueryRow key={i} {...q} />)}
            </div>
            
            {/* Recommendation */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <p className="font-semibold">Потенциал роста</p>
              </div>
              <p className="text-slate-300 text-sm">{data.recommendations[0].query}</p>
              <p className="text-amber-400 font-medium mt-1">+{data.recommendations[0].potential.toLocaleString()} показов/мес</p>
            </div>
          </div>
        )}
        
        {activeTab === 'positions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Позиции</h2>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              {data.topQueries.map((q, i) => <QueryRow key={i} {...q} />)}
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Отчёты формируются</p>
          </div>
        )}
        
        {activeTab === 'tips' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Рекомендации</h2>
            {data.recommendations.map((r, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <p className="font-medium mb-1">{r.query}</p>
                <span className="text-emerald-400 text-sm">+{r.potential.toLocaleString()} показов</span>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800">
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
