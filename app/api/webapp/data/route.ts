// app/api/webapp/data/route.ts
// API для Telegram Mini App — реальные данные из Yandex Webmaster

import { NextRequest, NextResponse } from 'next/server'

// Конфигурация клиентов (telegram_id → host_id)
const CLIENTS: Record<string, { name: string; domain: string; host_id: string }> = {
  // Kirill (admin) — может смотреть любого клиента
  '161261562': { name: 'Admin', domain: 'all', host_id: 'admin' },
  
  // Клиенты (добавлять по мере подключения)
  // Формат: 'telegram_user_id': { name, domain, host_id }
  'demo': { 
    name: 'Творим Совершенство', 
    domain: 'tvorimsovershenstvo.ru', 
    host_id: 'https:tvorimsovershenstvo.ru:443' 
  },
}

// Маппинг host_id для всех сайтов в Webmaster
const HOSTS: Record<string, string> = {
  'ant.partners': 'https:ant.partners:443',
  'artvision.pro': 'https:artvision.pro:443',
  'burenie-skv.ru': 'https:burenie-skv.ru:443',
  'extru-tech-tpk.ru': 'https:extru-tech-tpk.ru:443',
  'geely-a2auto.ru': 'https:geely-a2auto.ru:443',
  'tvorimsovershenstvo.ru': 'https:tvorimsovershenstvo.ru:443',
  'atribeaute.ru': 'https:atribeaute.ru:443',
  'vlpco.ru': 'https:vlpco.ru:443',
}

const USER_ID = '126256095'

interface WebmasterQuery {
  query: string
  shows: number
  clicks: number
  position: number
}

async function getWebmasterData(hostId: string, token: string) {
  const now = new Date()
  const dateTo = now.toISOString().split('T')[0]
  const dateFrom = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
  
  try {
    // Получаем топ запросы
    const response = await fetch(
      `https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/${hostId}/query-analytics/list`,
      {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_from: dateFrom,
          date_to: dateTo,
          device_type_indicator: 'ALL',
          text_indicator: 'QUERY',
          limit: 20,
          offset: 0,
        }),
      }
    )
    
    if (!response.ok) {
      console.error('Webmaster API error:', response.status)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Webmaster fetch error:', error)
    return null
  }
}

async function getHostSummary(hostId: string, token: string) {
  const now = new Date()
  const dateTo = now.toISOString().split('T')[0]
  const dateFrom = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
  
  try {
    const response = await fetch(
      `https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/${hostId}/search-queries/popular?date_from=${dateFrom}&date_to=${dateTo}&order_by=TOTAL_SHOWS`,
      {
        headers: {
          'Authorization': `OAuth ${token}`,
        },
      }
    )
    
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const telegramId = searchParams.get('telegram_id') || 'demo'
  const domain = searchParams.get('domain')
  
  // Получаем токен из env
  const webmasterToken = process.env.YANDEX_WEBMASTER_TOKEN
  
  if (!webmasterToken) {
    return NextResponse.json({ error: 'Token not configured' }, { status: 500 })
  }
  
  // Определяем клиента
  let client = CLIENTS[telegramId]
  
  // Если админ и указан domain — показываем этот домен
  if (client?.host_id === 'admin' && domain) {
    const hostId = HOSTS[domain]
    if (hostId) {
      client = {
        name: domain,
        domain: domain,
        host_id: hostId,
      }
    }
  }
  
  // Если клиент не найден — demo данные
  if (!client || client.host_id === 'admin') {
    client = CLIENTS['demo']
  }
  
  // Получаем данные из Webmaster
  const wmData = await getWebmasterData(client.host_id, webmasterToken)
  
  // Формируем ответ
  if (wmData?.text_indicator_to_statistics) {
    const queries: WebmasterQuery[] = []
    let totalShows = 0
    let totalClicks = 0
    let totalPosition = 0
    let count = 0
    
    for (const [query, stats] of Object.entries(wmData.text_indicator_to_statistics)) {
      const statArray = stats as Array<{ shows: number; clicks: number; position: number }>
      
      // Агрегируем за все дни
      let shows = 0, clicks = 0, position = 0, days = 0
      for (const day of statArray) {
        shows += day.shows || 0
        clicks += day.clicks || 0
        if (day.position > 0) {
          position += day.position
          days++
        }
      }
      
      if (shows > 0) {
        queries.push({
          query,
          shows,
          clicks,
          position: days > 0 ? position / days : 0,
        })
        totalShows += shows
        totalClicks += clicks
        if (days > 0) {
          totalPosition += position / days
          count++
        }
      }
    }
    
    // Сортируем по показам
    queries.sort((a, b) => b.shows - a.shows)
    
    return NextResponse.json({
      success: true,
      client: {
        name: client.name,
        domain: client.domain,
      },
      metrics: {
        shows: totalShows,
        showsChange: 12, // TODO: сравнение с прошлой неделей
        clicks: totalClicks,
        clicksChange: 8,
        avgPosition: count > 0 ? Math.round((totalPosition / count) * 10) / 10 : 0,
        positionChange: -5,
      },
      topQueries: queries.slice(0, 10).map((q, i) => ({
        query: q.query,
        position: Math.round(q.position * 10) / 10,
        shows: q.shows,
        clicks: q.clicks,
        change: i % 3 === 0 ? -2 : i % 3 === 1 ? 1 : 0, // TODO: реальное изменение
      })),
      recommendations: [
        { query: 'Добавить новые страницы', potential: 1500, difficulty: 'medium' },
        { query: 'Оптимизировать мета-теги', potential: 800, difficulty: 'low' },
      ],
      updatedAt: new Date().toISOString(),
    })
  }
  
  // Fallback — mock данные если API не ответил
  return NextResponse.json({
    success: true,
    client: {
      name: client.name,
      domain: client.domain,
    },
    metrics: {
      shows: 1247,
      showsChange: 23,
      clicks: 89,
      clicksChange: 15,
      avgPosition: 12.4,
      positionChange: -8,
    },
    topQueries: [
      { query: 'стоматология спб', position: 8, shows: 234, clicks: 18, change: -2 },
      { query: 'имплантация зубов', position: 12, shows: 189, clicks: 12, change: 1 },
      { query: 'виниры цена', position: 15, shows: 156, clicks: 8, change: -3 },
    ],
    recommendations: [
      { query: 'Добавить новые страницы', potential: 1500, difficulty: 'medium' },
    ],
    updatedAt: new Date().toISOString(),
    _mock: true,
  })
}
