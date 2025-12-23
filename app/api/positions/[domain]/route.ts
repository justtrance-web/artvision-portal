import { NextRequest, NextResponse } from 'next/server'

// Yandex Webmaster API Config
const TOKEN = process.env.YANDEX_WEBMASTER_TOKEN || "y0__xDfh5o8GJTCPCDmgMTjFWHcPZSPYeLX-r6YqBOWv0rQZBsU"
const USER_ID = "126256095"
const BASE_URL = "https://api.webmaster.yandex.net/v4"

// Domain to Host ID mapping (cached)
const HOST_CACHE: Record<string, string> = {}

async function getHostId(domain: string): Promise<string | null> {
  if (HOST_CACHE[domain]) return HOST_CACHE[domain]
  
  const res = await fetch(`${BASE_URL}/user/${USER_ID}/hosts/`, {
    headers: { Authorization: `OAuth ${TOKEN}` }
  })
  
  const data = await res.json()
  
  for (const host of data.hosts || []) {
    if (!host.verified) continue
    const hostDomain = host.ascii_host_url.replace(/https?:\/\//, '').replace(/\/$/, '')
    if (hostDomain.includes(domain) || domain.includes(hostDomain)) {
      HOST_CACHE[domain] = host.host_id
      return host.host_id
    }
  }
  
  return null
}

async function getPositions(hostId: string, days: number = 10) {
  const dateTo = new Date().toISOString().split('T')[0]
  const dateFrom = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  
  const url = `${BASE_URL}/user/${USER_ID}/hosts/${hostId}/search-queries/popular/`
  
  // Get positions
  const posRes = await fetch(`${url}?order_by=TOTAL_SHOWS&query_indicator=AVG_SHOW_POSITION&date_from=${dateFrom}&date_to=${dateTo}&limit=100`, {
    headers: { Authorization: `OAuth ${TOKEN}` }
  })
  const posData = await posRes.json()
  
  // Get shows
  const showsRes = await fetch(`${url}?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&date_from=${dateFrom}&date_to=${dateTo}&limit=100`, {
    headers: { Authorization: `OAuth ${TOKEN}` }
  })
  const showsData = await showsRes.json()
  
  // Get clicks
  const clicksRes = await fetch(`${url}?order_by=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&date_from=${dateFrom}&date_to=${dateTo}&limit=100`, {
    headers: { Authorization: `OAuth ${TOKEN}` }
  })
  const clicksData = await clicksRes.json()
  
  // Merge data
  const showsMap: Record<string, number> = {}
  const clicksMap: Record<string, number> = {}
  
  for (const q of showsData.queries || []) {
    showsMap[q.query_id] = q.indicators?.TOTAL_SHOWS || 0
  }
  
  for (const q of clicksData.queries || []) {
    clicksMap[q.query_id] = q.indicators?.TOTAL_CLICKS || 0
  }
  
  const queries = []
  for (const q of posData.queries || []) {
    const pos = q.indicators?.AVG_SHOW_POSITION
    if (pos == null) continue
    
    queries.push({
      query: q.query_text,
      position: pos,
      shows: showsMap[q.query_id] || 0,
      clicks: clicksMap[q.query_id] || 0
    })
  }
  
  // Sort by shows
  queries.sort((a, b) => b.shows - a.shows)
  
  // Calculate stats
  const total = queries.length
  const top3 = queries.filter(q => q.position <= 3).length
  const top10 = queries.filter(q => q.position <= 10).length
  const top30 = queries.filter(q => q.position <= 30).length
  const totalShows = queries.reduce((s, q) => s + q.shows, 0)
  const totalClicks = queries.reduce((s, q) => s + q.clicks, 0)
  
  // Distribution
  const distribution = {
    top3: queries.filter(q => q.position <= 3).length,
    top10: queries.filter(q => q.position > 3 && q.position <= 10).length,
    top20: queries.filter(q => q.position > 10 && q.position <= 20).length,
    top30: queries.filter(q => q.position > 20 && q.position <= 30).length,
    other: queries.filter(q => q.position > 30).length,
  }
  
  return {
    dateFrom,
    dateTo,
    total,
    top3,
    top10,
    top30,
    totalShows,
    totalClicks,
    distribution,
    queries: queries.slice(0, 30) // Top 30 for display
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const domain = params.domain
    
    const hostId = await getHostId(domain)
    if (!hostId) {
      return NextResponse.json({ error: 'Domain not found in Webmaster' }, { status: 404 })
    }
    
    const data = await getPositions(hostId)
    
    return NextResponse.json({
      domain,
      ...data,
      source: 'Yandex Webmaster API',
      updatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
  }
}
