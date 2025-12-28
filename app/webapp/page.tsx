'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Map,
  MessageCircle,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Check,
  Circle,
  Minus
} from 'lucide-react'

// Типы
interface Query {
  query: string
  frequency: number
  target: number
  fact: number | null
  status: 'achieved' | 'close' | 'far' | 'not_found'
}

interface Cluster {
  id: string
  name: string
  url: string
  progress: number
  queries: Query[]
}

interface ClientData {
  client: string
  domain: string
  period: string
  summary: {
    achieved: number
    close: number
    far: number
    not_found: number
    total: number
    shows: number
    clicks: number
  }
  indexing: {
    sqi: number
    pages: number
    excluded: number
  }
  trends: Array<{ date: string; shows: number; clicks: number }>
  clusters: Cluster[]
  problems: Array<{ type: string; count: number }>
}

// Демо данные VLPco из реального Webmaster
const DEMO_DATA: ClientData = {
  client: "VLPco",
  domain: "vlpco.ru",
  period: "28 ноя — 27 дек",
  summary: { achieved: 5, close: 4, far: 2, not_found: 1, total: 12, shows: 3847, clicks: 892 },
  indexing: { sqi: 20, pages: 868, excluded: 746 },
  trends: [
    { date: "21", shows: 298, clicks: 48 },
    { date: "22", shows: 340, clicks: 76 },
    { date: "23", shows: 306, clicks: 58 },
    { date: "24", shows: 286, clicks: 49 },
    { date: "25", shows: 253, clicks: 51 },
    { date: "26", shows: 285, clicks: 43 },
    { date: "27", shows: 312, clicks: 67 }
  ],
  clusters: [
    {
      id: "cases", name: "Чехлы iPhone", url: "/cases/iphone/", progress: 75,
      queries: [
        { query: "vlp чехлы", frequency: 333, target: 1, fact: 1.7, status: "close" },
        { query: "чехлы vlp официальный", frequency: 147, target: 1, fact: 1.6, status: "close" },
        { query: "чехлы для айфона оптом", frequency: 1200, target: 3, fact: 2.8, status: "achieved" },
        { query: "vlp чехлы официальный", frequency: 98, target: 1, fact: 1.6, status: "close" }
      ]
    },
    {
      id: "chargers", name: "Беспроводные зарядки", url: "/chargers/", progress: 67,
      queries: [
        { query: "беспроводные зарядки оптом", frequency: 890, target: 5, fact: 4.2, status: "achieved" },
        { query: "зарядка 3 в 1 оптом", frequency: 320, target: 3, fact: 1.6, status: "achieved" },
        { query: "зу 3 в 1 vlp", frequency: 61, target: 1, fact: 1.6, status: "close" }
      ]
    },
    {
      id: "power", name: "Пауэрбанки", url: "/powerbanks/", progress: 0,
      queries: [
        { query: "пауэрбанки оптом", frequency: 1450, target: 5, fact: 6.6, status: "close" },
        { query: "power bank оптом", frequency: 720, target: 5, fact: null, status: "not_found" }
      ]
    }
  ],
  problems: [{ type: "Нет description", count: 23 }]
}

// Компоненты
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof Check; color: string }> = {
    achieved: { icon: Check, color: "text-emerald-400" },
    close: { icon: Circle, color: "text-amber-400" },
    far: { icon: Minus, color: "text-red-400" },
    not_found: { icon: Minus, color: "text-slate-500" }
  }
  const { icon: Icon, color } = config[status] || config.not_found
  return <Icon className={`w-4 h-4 ${color}`} />
}

function ProgressRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const color = percent >= 60 ? "#10b981" : percent >= 30 ? "#f59e0b" : "#ef4444"
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
        <circle 
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (percent/100)*c} 
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {percent}%
      </span>
    </div>
  )
}

function MiniChart({ data }: { data: Array<{ shows: number; clicks: number }> }) {
  const maxShows = Math.max(...data.map(d => d.shows))
  
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5">
          <div 
            className="bg-blue-500/60 rounded-sm transition-all"
            style={{ height: `${(d.shows / maxShows) * 100}%` }}
          />
          <div 
            className="bg-emerald-500/60 rounded-sm"
            style={{ height: `${(d.clicks / maxShows) * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}

// Tabs
const TABS = [
  { id: 'home', icon: BarChart3, label: 'Обзор' },
  { id: 'map', icon: Map, label: 'Карта' },
  { id: 'chat', icon: MessageCircle, label: 'Чат' }
]

export default function TelegramWebApp() {
  const [tab, setTab] = useState('home')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [data] = useState<ClientData>(DEMO_DATA)
  const [loading, setLoading] = useState(false)

  // Telegram WebApp init
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#1c1c1e')
      tg.setBackgroundColor('#1c1c1e')
    }
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white">
      {/* Header */}
      <header className="bg-[#2c2c2e] px-4 py-3 flex items-center gap-3 sticky top-0 z-50 border-b border-white/5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-[#1c1c1e]">
          {data.client[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[15px]">{data.client}</div>
          <div className="text-[12px] text-[#8e8e93]">{data.domain} • {data.period}</div>
        </div>
        <button 
          onClick={handleRefresh}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Content */}
      <main className="pb-20">
        {/* Tab: Home */}
        {tab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: data.summary.achieved, l: "В цели", c: "text-emerald-400 bg-emerald-500/15" },
                { v: data.summary.close, l: "Близко", c: "text-amber-400 bg-amber-500/15" },
                { v: data.summary.shows.toLocaleString(), l: "Показы", c: "text-blue-400 bg-blue-500/15" },
                { v: data.summary.clicks, l: "Клики", c: "text-purple-400 bg-purple-500/15" }
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl p-3 text-center ${s.c.split(' ')[1]}`}>
                  <div className={`text-xl font-bold ${s.c.split(' ')[0]}`}>{s.v}</div>
                  <div className="text-[10px] text-[#8e8e93] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="bg-[#2c2c2e] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium">Прогресс по запросам</span>
                <span className="text-[11px] text-[#8e8e93]">{data.summary.achieved} из {data.summary.total}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${(data.summary.achieved / data.summary.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-[#8e8e93]">
                <span>✓ {data.summary.achieved} достигнуто</span>
                <span>○ {data.summary.close} близко</span>
                <span>— {data.summary.not_found} нет</span>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-[#2c2c2e] rounded-2xl p-4">
              <div className="text-[13px] font-medium mb-3">Динамика за неделю</div>
              <MiniChart data={data.trends} />
              <div className="flex justify-center gap-4 mt-3 text-[10px] text-[#8e8e93]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Показы
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Клики
                </span>
              </div>
            </div>

            {/* Health */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#2c2c2e] rounded-2xl p-3 text-center">
                <div className="text-[10px] text-[#8e8e93]">SQI</div>
                <div className="text-2xl font-bold mt-1">{data.indexing.sqi}</div>
              </div>
              <div className="bg-[#2c2c2e] rounded-2xl p-3 text-center">
                <div className="text-[10px] text-[#8e8e93]">В индексе</div>
                <div className="text-2xl font-bold mt-1">{data.indexing.pages}</div>
              </div>
              <div className="bg-[#2c2c2e] rounded-2xl p-3 text-center">
                <div className="text-[10px] text-[#8e8e93]">Проблемы</div>
                <div className="text-2xl font-bold mt-1 text-amber-400">{data.problems.length}</div>
              </div>
            </div>

            {/* Alert */}
            {data.problems.length > 0 && (
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-amber-400">{data.problems[0].type}</div>
                  <div className="text-[11px] text-[#8e8e93]">{data.problems[0].count} страниц</div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#8e8e93] -rotate-90" />
              </div>
            )}
          </div>
        )}

        {/* Tab: Map */}
        {tab === 'map' && (
          <div className="p-4 space-y-3">
            <div className="text-[13px] font-medium text-[#8e8e93] mb-2">
              Карта сайта — План vs Факт
            </div>
            
            {data.clusters.map(cluster => (
              <div key={cluster.id} className="bg-[#2c2c2e] rounded-2xl overflow-hidden">
                <button 
                  className="w-full p-4 flex items-center gap-3 active:bg-white/5"
                  onClick={() => setExpanded(expanded === cluster.id ? null : cluster.id)}
                >
                  <ProgressRing percent={cluster.progress} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-[14px] truncate">{cluster.name}</div>
                    <div className="text-[11px] text-[#8e8e93]">{cluster.url}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8e8e93] transition-transform ${
                    expanded === cluster.id ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {expanded === cluster.id && (
                  <div className="border-t border-white/5 px-4 py-2">
                    {cluster.queries.map((q, i) => (
                      <div key={i} className="flex items-center py-2.5 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-[12px] truncate text-[#e5e5e5]">{q.query}</div>
                          <div className="text-[10px] text-[#8e8e93]">
                            {q.frequency} • цель: топ-{q.target}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {q.fact !== null ? (
                            <span className={`font-mono text-[13px] ${
                              q.fact <= q.target ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {q.fact}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[#8e8e93]">—</span>
                          )}
                          <StatusBadge status={q.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex justify-center gap-4 pt-2 text-[10px] text-[#8e8e93]">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> В цели</span>
              <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-amber-400" /> Близко</span>
              <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-slate-500" /> Нет</span>
            </div>
          </div>
        )}

        {/* Tab: Chat */}
        {tab === 'chat' && (
          <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
            <MessageCircle className="w-12 h-12 text-[#8e8e93] mb-4" />
            <div className="text-[15px] font-medium">Связь с менеджером</div>
            <div className="text-[13px] text-[#8e8e93] mt-1 mb-4">
              Задайте вопрос по продвижению
            </div>
            <a 
              href="https://t.me/artvision_support"
              className="bg-[#007aff] text-white px-6 py-2.5 rounded-xl text-[14px] font-medium active:opacity-80"
            >
              Написать в Telegram
            </a>
          </div>
        )}
      </main>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#2c2c2e]/95 backdrop-blur border-t border-white/5 px-6 py-2 flex justify-around safe-area-inset-bottom">
        {TABS.map(t => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors ${
              tab === t.id ? 'text-[#007aff]' : 'text-[#8e8e93]'
            }`}
          >
            <t.icon className="w-5 h-5" />
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
