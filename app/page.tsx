'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  domain: string | null
  type: string
  status: 'active' | 'presale'
}

interface PositionStats {
  total: number
  top3: number
  top10: number
  loading: boolean
  error: boolean
}

const CLIENTS: Client[] = [
  { id: 'tvorim', name: 'Творим Совершенство', domain: 'tvorimsovershenstvo.ru', type: 'dental', status: 'active' },
  { id: 'atribeaute', name: 'Atribeaute Clinique', domain: 'atribeaute.ru', type: 'dental', status: 'active' },
  { id: 'ant', name: 'ANT Partners', domain: 'ant.partners', type: 'legal', status: 'active' },
  { id: 'vlpco', name: 'VLPCo', domain: 'vlpco.ru', type: 'ecommerce', status: 'active' },
  { id: 'burenie', name: 'Бурение скважин', domain: 'burenie-skv.ru', type: 'industrial', status: 'active' },
  { id: 'otido', name: 'Otido Group', domain: 'www.otido-group.ru', type: 'events', status: 'active' },
  { id: 'extru', name: 'Extru Tech', domain: 'extru-tech-tpk.ru', type: 'industrial', status: 'active' },
  { id: 'madwave', name: 'Mad Wave', domain: 'madwave.ru', type: 'ecommerce', status: 'active' },
  { id: 'geely', name: 'Geely A2Auto', domain: 'geely-a2auto.ru', type: 'automotive', status: 'active' },
  { id: 'escooter', name: 'Электросамокаты СПб', domain: null, type: 'repair', status: 'presale' },
  { id: 'bluebirds', name: 'Blue Birds', domain: null, type: 'ecommerce', status: 'presale' },
  { id: 'baburov', name: 'Baburov', domain: null, type: 'legal', status: 'presale' },
]

export default function Home() {
  const [isTelegram, setIsTelegram] = useState(false)
  const [positions, setPositions] = useState<Record<string, PositionStats>>({})
  const [summaryLoading, setSummaryLoading] = useState(true)
  
  useEffect(() => {
    // Check Telegram Mini App
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      setIsTelegram(true)
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
    }
    
    // Load positions for all active clients with domains
    const activeWithDomains = CLIENTS.filter(c => c.status === 'active' && c.domain)
    
    Promise.all(
      activeWithDomains.map(async (client) => {
        try {
          const res = await fetch(`/api/positions/${client.domain}`)
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          return { id: client.id, stats: { total: data.total, top3: data.top3, top10: data.top10, loading: false, error: false } }
        } catch {
          return { id: client.id, stats: { total: 0, top3: 0, top10: 0, loading: false, error: true } }
        }
      })
    ).then(results => {
      const posMap: Record<string, PositionStats> = {}
      for (const r of results) {
        posMap[r.id] = r.stats
      }
      setPositions(posMap)
      setSummaryLoading(false)
    })
  }, [])
  
  const activeClients = CLIENTS.filter(c => c.status === 'active')
  const presaleClients = CLIENTS.filter(c => c.status === 'presale')
  
  // Calculate totals
  const totalQueries = Object.values(positions).reduce((s, p) => s + p.total, 0)
  const totalTop3 = Object.values(positions).reduce((s, p) => s + p.top3, 0)
  const totalTop10 = Object.values(positions).reduce((s, p) => s + p.top10, 0)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">🚀 Artvision Portal</h1>
              <p className="opacity-90 text-sm">Отчёты, позиции и аналитика</p>
              {isTelegram && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs">
                  📱 Telegram Mini App
                </span>
              )}
            </div>
            
            {/* Summary Stats */}
            {!summaryLoading && (
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{totalQueries.toLocaleString()}</div>
                  <div className="text-xs opacity-80">Запросов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-300">{totalTop3}</div>
                  <div className="text-xs opacity-80">ТОП-3</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">{totalTop10}</div>
                  <div className="text-xs opacity-80">ТОП-10</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Active Clients */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
            <h2 className="text-xl font-semibold">Активные клиенты</h2>
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {activeClients.length}
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeClients.map(client => (
              <ClientCard 
                key={client.id} 
                client={client} 
                stats={positions[client.id]}
              />
            ))}
          </div>
        </section>

        {/* Presale */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
            <h2 className="text-xl font-semibold">Presale</h2>
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {presaleClients.length}
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {presaleClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm">
        Artvision Agency • {new Date().toLocaleDateString('ru-RU')}
      </footer>
    </main>
  )
}

function ClientCard({ client, stats }: { client: Client; stats?: PositionStats }) {
  const hasStats = stats && !stats.error && stats.total > 0
  
  // Status indicator
  let statusColor = 'bg-slate-200'
  let statusIcon = '⚪'
  if (hasStats) {
    if (stats.top10 >= 20) {
      statusColor = 'bg-emerald-500'
      statusIcon = '🟢'
    } else if (stats.top10 >= 5) {
      statusColor = 'bg-amber-500'
      statusIcon = '🟡'
    } else {
      statusColor = 'bg-red-400'
      statusIcon = '🔴'
    }
  }
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{client.name}</h3>
        {hasStats && <span title="SEO Health">{statusIcon}</span>}
      </div>
      
      <p className="text-slate-500 text-sm mb-3">
        {client.domain || '—'} • {client.type}
      </p>
      
      {/* Mini Stats */}
      {hasStats && (
        <div className="flex gap-3 mb-4 text-center">
          <div className="flex-1 bg-slate-50 rounded-lg py-2">
            <div className="font-bold text-slate-700">{stats.total}</div>
            <div className="text-xs text-slate-400">запросов</div>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-lg py-2">
            <div className="font-bold text-emerald-600">{stats.top3}</div>
            <div className="text-xs text-slate-400">ТОП-3</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg py-2">
            <div className="font-bold text-blue-600">{stats.top10}</div>
            <div className="text-xs text-slate-400">ТОП-10</div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {stats?.loading && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-slate-100 rounded-lg py-4 animate-pulse" />
          <div className="flex-1 bg-slate-100 rounded-lg py-4 animate-pulse" />
          <div className="flex-1 bg-slate-100 rounded-lg py-4 animate-pulse" />
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <Link 
          href={`/client/${client.id}`}
          className="px-3 py-1.5 bg-slate-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
        >
          📊 Отчёты
        </Link>
        {client.domain && (
          <Link 
            href={`/client/${client.id}/positions`}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition"
          >
            📈 Позиции
          </Link>
        )}
      </div>
    </div>
  )
}
