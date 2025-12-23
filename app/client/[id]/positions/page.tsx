'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// Client info mapping
const CLIENTS: Record<string, { name: string; domain: string }> = {
  tvorim: { name: 'Творим Совершенство', domain: 'tvorimsovershenstvo.ru' },
  atribeaute: { name: 'Atribeaute Clinique', domain: 'atribeaute.ru' },
  ant: { name: 'ANT Partners', domain: 'ant.partners' },
  vlpco: { name: 'VLPCo', domain: 'vlpco.ru' },
  burenie: { name: 'Бурение скважин', domain: 'burenie-skv.ru' },
  otido: { name: 'Otido Group', domain: 'www.otido-group.ru' },
  extru: { name: 'Extru Tech', domain: 'extru-tech-tpk.ru' },
  madwave: { name: 'Mad Wave', domain: 'madwave.ru' },
  geely: { name: 'Geely A2Auto', domain: 'geely-a2auto.ru' },
}

interface PositionsData {
  domain: string
  dateFrom: string
  dateTo: string
  total: number
  top3: number
  top10: number
  top30: number
  totalShows: number
  totalClicks: number
  distribution: {
    top3: number
    top10: number
    top20: number
    top30: number
    other: number
  }
  queries: Array<{
    query: string
    position: number
    shows: number
    clicks: number
  }>
  updatedAt: string
}

export default function PositionsPage() {
  const params = useParams()
  const clientId = params.id as string
  const client = CLIENTS[clientId]
  
  const [data, setData] = useState<PositionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!client?.domain) {
      setError('Клиент не найден')
      setLoading(false)
      return
    }
    
    fetch(`/api/positions/${client.domain}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setData(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Ошибка загрузки данных')
        setLoading(false)
      })
  }, [client?.domain])
  
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Загрузка позиций...</p>
        </div>
      </main>
    )
  }
  
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-red-500 text-lg mb-4">❌ {error || 'Нет данных'}</p>
          <Link href="/" className="text-indigo-600 hover:underline">← Назад</Link>
        </div>
      </main>
    )
  }
  
  const maxDist = Math.max(
    data.distribution.top3,
    data.distribution.top10,
    data.distribution.top20,
    data.distribution.top30,
    data.distribution.other,
    1
  )

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
            ← Все проекты
          </Link>
          <h1 className="text-2xl font-bold">{client?.name || clientId}</h1>
          <p className="opacity-80 text-sm mt-1">
            📊 Позиции в Яндексе • {data.dateFrom} — {data.dateTo}
          </p>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Запросов" value={data.total} />
          <StatCard label="ТОП-3" value={data.top3} color="emerald" />
          <StatCard label="ТОП-10" value={data.top10} color="blue" />
          <StatCard label="ТОП-30" value={data.top30} color="amber" />
          <StatCard label="Показов" value={data.totalShows.toLocaleString()} />
          <StatCard label="Кликов" value={data.totalClicks.toLocaleString()} color="emerald" />
        </div>
        
        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-6">Распределение позиций</h3>
            <div className="space-y-4">
              <BarRow label="ТОП-3" value={data.distribution.top3} max={maxDist} color="bg-emerald-500" />
              <BarRow label="4–10" value={data.distribution.top10} max={maxDist} color="bg-blue-500" />
              <BarRow label="11–20" value={data.distribution.top20} max={maxDist} color="bg-amber-500" />
              <BarRow label="21–30" value={data.distribution.top30} max={maxDist} color="bg-orange-500" />
              <BarRow label="30+" value={data.distribution.other} max={maxDist} color="bg-slate-400" />
            </div>
          </div>
          
          {/* Donut Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-6">Запросы в ТОП-10</h3>
            <div className="flex items-center justify-center gap-8">
              <DonutChart 
                value={data.top10} 
                total={data.total} 
                top3={data.top3}
                top10={data.top10}
                top30={data.top30}
              />
              <div className="space-y-2 text-sm">
                <LegendItem color="bg-emerald-500" label={`ТОП-3: ${data.top3}`} />
                <LegendItem color="bg-blue-500" label={`4–10: ${data.top10 - data.top3}`} />
                <LegendItem color="bg-amber-500" label={`11–30: ${data.top30 - data.top10}`} />
                <LegendItem color="bg-slate-200" label={`30+: ${data.total - data.top30}`} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-lg">Топ запросов по показам</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-500 font-medium">#</th>
                  <th className="px-6 py-3 text-left text-slate-500 font-medium">Запрос</th>
                  <th className="px-6 py-3 text-center text-slate-500 font-medium">Позиция</th>
                  <th className="px-6 py-3 text-right text-slate-500 font-medium">Показы</th>
                  <th className="px-6 py-3 text-right text-slate-500 font-medium">Клики</th>
                </tr>
              </thead>
              <tbody>
                {data.queries.map((q, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-3 max-w-xs truncate">{q.query}</td>
                    <td className="px-6 py-3 text-center">
                      <PositionBadge position={q.position} />
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{q.shows.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{q.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center py-8 text-slate-400 text-sm">
          Источник: Яндекс.Вебмастер • Обновлено: {new Date(data.updatedAt).toLocaleString('ru-RU')}
        </div>
      </div>
    </main>
  )
}

// Components

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
  }
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
      <div className={`text-2xl font-bold ${color ? colors[color] : 'text-indigo-600'}`}>
        {value}
      </div>
      <div className="text-slate-500 text-xs mt-1">{label}</div>
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = (value / max) * 100
  
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm text-slate-500">{label}</span>
      <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden">
        <div 
          className={`h-full ${color} rounded flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all`}
          style={{ width: `${Math.max(width, 8)}%` }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function DonutChart({ value, total, top3, top10, top30 }: { value: number; total: number; top3: number; top10: number; top30: number }) {
  const t = total || 1
  const deg1 = (top3 / t) * 360
  const deg2 = (top10 / t) * 360
  const deg3 = (top30 / t) * 360
  
  return (
    <div 
      className="w-36 h-36 rounded-full relative"
      style={{
        background: `conic-gradient(
          #10b981 0deg ${deg1}deg,
          #3b82f6 ${deg1}deg ${deg2}deg,
          #f59e0b ${deg2}deg ${deg3}deg,
          #e2e8f0 ${deg3}deg 360deg
        )`
      }}
    >
      <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center">
        <span className="text-2xl font-bold text-indigo-600">{value}</span>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-slate-600">{label}</span>
    </div>
  )
}

function PositionBadge({ position }: { position: number }) {
  let bg = 'bg-slate-100 text-slate-600'
  if (position <= 3) bg = 'bg-emerald-100 text-emerald-700'
  else if (position <= 10) bg = 'bg-blue-100 text-blue-700'
  else if (position <= 30) bg = 'bg-amber-100 text-amber-700'
  
  return (
    <span className={`inline-block px-2 py-0.5 rounded font-semibold ${bg}`}>
      {position.toFixed(1)}
    </span>
  )
}
