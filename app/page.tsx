'use client'

import { useState, useEffect } from 'react'

interface Client {
  id: string
  name: string
  domain: string | null
  type: string
  status: 'active' | 'presale'
}

const CLIENTS: Client[] = [
  { id: 'tvorim', name: 'Творим Совершенство', domain: 'tvorimsovershenstvo.ru', type: 'dental', status: 'active' },
  { id: 'atribeaute', name: 'Atribeaute Clinique', domain: 'atribeaute.ru', type: 'dental', status: 'active' },
  { id: 'ant', name: 'ANT Partners', domain: 'ant-partners.ru', type: 'legal', status: 'active' },
  { id: 'vlpco', name: 'VLPCo', domain: 'vlpco.ru', type: 'ecommerce', status: 'active' },
  { id: 'burenie', name: 'Бурение скважин', domain: 'burenie-skv.ru', type: 'industrial', status: 'active' },
  { id: 'escooter', name: 'Электросамокаты СПб', domain: null, type: 'repair', status: 'presale' },
  { id: 'geely', name: 'Geely A2Auto', domain: 'geely-a2auto.ru', type: 'automotive', status: 'presale' },
  { id: 'jivo', name: 'Jivo Medical', domain: null, type: 'partnership', status: 'presale' },
]

export default function Home() {
  const [isTelegram, setIsTelegram] = useState(false)
  
  useEffect(() => {
    // Проверяем запуск из Telegram Mini App
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      setIsTelegram(true)
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
    }
  }, [])

  const activeClients = CLIENTS.filter(c => c.status === 'active')
  const presaleClients = CLIENTS.filter(c => c.status === 'presale')

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-12 px-6 text-center">
        <h1 className="text-2xl font-bold mb-2">🚀 Artvision Portal</h1>
        <p className="opacity-90">Отчёты, метрики и документы</p>
        {isTelegram && (
          <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-sm">
            📱 Telegram Mini App
          </span>
        )}
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
              <ClientCard key={client.id} client={client} />
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

function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-1">{client.name}</h3>
      <p className="text-slate-500 text-sm mb-4">
        {client.domain || '—'} • {client.type}
      </p>
      
      <div className="flex flex-wrap gap-2">
        <a 
          href={`/client/${client.id}`}
          className="px-3 py-1.5 bg-slate-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
        >
          📊 Отчёты
        </a>
        <a 
          href={`/client/${client.id}/positions`}
          className="px-3 py-1.5 bg-slate-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
        >
          📈 Позиции
        </a>
      </div>
    </div>
  )
}
