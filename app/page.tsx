import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getClients() {
  const { data } = await supabase.from("clients").select("*").order("status")
  return data || []
}

async function getRecommendations() {
  const { data } = await supabase.from("recommendations").select("*").order("potential_impressions", { ascending: false })
  return data || []
}

export default async function Home() {
  const clients = await getClients()
  const recommendations = await getRecommendations()
  const activeClients = clients.filter((c: any) => c.status === "active")
  const presaleClients = clients.filter((c: any) => c.status === "presale")

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">🚀 Artvision Portal</h1>
          <p className="text-slate-400 text-sm md:text-base">Клиентский портал — данные из Supabase</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
            <div className="text-2xl md:text-3xl font-bold text-blue-400">{activeClients.length}</div>
            <div className="text-slate-400 text-sm">Активных</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">{presaleClients.length}</div>
            <div className="text-slate-400 text-sm">Presale</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
            <div className="text-2xl md:text-3xl font-bold text-green-400">{recommendations.length}</div>
            <div className="text-slate-400 text-sm">Рекомендаций</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700">
            <div className="text-2xl md:text-3xl font-bold text-purple-400">✓</div>
            <div className="text-slate-400 text-sm">Supabase OK</div>
          </div>
        </div>

        {/* Active Clients */}
        {activeClients.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-blue-400">🟢 Активные клиенты</h2>
            <div className="grid gap-3">
              {activeClients.map((client: any) => (
                <div key={client.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{client.name}</div>
                      {client.domain && (
                        <a href={`https://${client.domain}`} target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-blue-400">
                          {client.domain} ↗
                        </a>
                      )}
                    </div>
                    {client.monthly_budget && (
                      <div className="text-green-400 font-mono text-sm md:text-base">
                        {client.monthly_budget.toLocaleString('ru-RU')} ₽/мес
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Presale */}
        {presaleClients.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-amber-400">🟡 Presale</h2>
            <div className="grid gap-3">
              {presaleClients.map((client: any) => (
                <div key={client.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="font-semibold text-slate-300">{client.name}</div>
                  {client.domain && <span className="text-sm text-slate-500">{client.domain}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="text-lg md:text-xl font-bold mb-4 text-green-400">💡 Рекомендации</h2>
            <div className="grid gap-3">
              {recommendations.slice(0, 5).map((rec: any) => (
                <div key={rec.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="font-semibold mb-1">{rec.title}</div>
                  {rec.description && <p className="text-sm text-slate-400 mb-2">{rec.description}</p>}
                  <div className="text-sm text-purple-400">📈 +{rec.potential_impressions?.toLocaleString('ru-RU')} показов</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>Artvision Portal © 2025</p>
        </footer>
      </div>
    </main>
  )
}
