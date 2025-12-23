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
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🚀 Artvision Portal</h1>
          <p className="text-slate-400">Клиентский портал — данные из Supabase</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-blue-400">{activeClients.length}</div>
            <div className="text-slate-400">Активных</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-amber-400">{presaleClients.length}</div>
            <div className="text-slate-400">Presale</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-green-400">{recommendations.length}</div>
            <div className="text-slate-400">Рекомендаций</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-3xl font-bold text-purple-400">✓</div>
            <div className="text-slate-400">Supabase OK</div>
          </div>
        </div>

        {/* Active Clients */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🟢 Активные клиенты</h2>
          <div className="grid grid-cols-3 gap-4">
            {activeClients.map((client: any) => (
              <div key={client.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-500 transition">
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-slate-400 text-sm">{client.domain}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-slate-700 rounded text-xs">{client.type}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Presale */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🟡 Presale</h2>
          <div className="grid grid-cols-3 gap-4">
            {presaleClients.map((client: any) => (
              <div key={client.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-amber-500 transition">
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-slate-400 text-sm">{client.domain}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <h2 className="text-xl font-semibold mb-4">💡 Рекомендации (потенциал роста)</h2>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between p-4 border-b border-slate-700 hover:bg-slate-750">
                <div>
                  <div className="font-semibold">{rec.cluster_name}</div>
                  <div className="text-slate-400 text-sm">{rec.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">+{rec.potential_impressions}</div>
                  <div className="text-slate-500 text-xs">показов</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
