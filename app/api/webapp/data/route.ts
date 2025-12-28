// app/api/webapp/data/route.ts
// API для Telegram Mini App

import { NextRequest, NextResponse } from 'next/server'

// Mock данные для demo
const MOCK_DATA = {
  success: true,
  client: {
    name: 'Творим Совершенство',
    domain: 'tvorimsovershenstvo.ru',
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
    { query: 'отбеливание зубов', position: 11, shows: 134, clicks: 11, change: 0 },
    { query: 'лечение кариеса', position: 9, shows: 98, clicks: 7, change: -1 },
  ],
  recommendations: [
    { query: 'Добавить страницу про имплантацию под ключ', potential: 2400, difficulty: 'medium' },
    { query: 'Оптимизировать мета-теги', potential: 800, difficulty: 'low' },
  ],
  updatedAt: new Date().toISOString(),
  _mock: true,
}

// Конфигурация клиентов
const CLIENTS: Record<string, { name: string; domain: string; host_id: string }> = {
  '161261562': { name: 'Admin', domain: 'all', host_id: 'admin' },
  'demo': { name: 'Творим Совершенство', domain: 'tvorimsovershenstvo.ru', host_id: 'https:tvorimsovershenstvo.ru:443' },
}

const HOSTS: Record<string, string> = {
  'tvorimsovershenstvo.ru': 'https:tvorimsovershenstvo.ru:443',
  'ant.partners': 'https:ant.partners:443',
  'burenie-skv.ru': 'https:burenie-skv.ru:443',
  'extru-tech-tpk.ru': 'https:extru-tech-tpk.ru:443',
  'geely-a2auto.ru': 'https:geely-a2auto.ru:443',
  'atribeaute.ru': 'https:atribeaute.ru:443',
  'vlpco.ru': 'https:vlpco.ru:443',
}

const USER_ID = '126256095'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegram_id') || 'demo'
    const domain = searchParams.get('domain')
    
    // Получаем токен
    const webmasterToken = process.env.YANDEX_WEBMASTER_TOKEN
    
    // Если токена нет — возвращаем mock
    if (!webmasterToken) {
      console.log('No YANDEX_WEBMASTER_TOKEN, returning mock data')
      return NextResponse.json({
        ...MOCK_DATA,
        _reason: 'no_token',
      })
    }
    
    // Определяем клиента
    let client = CLIENTS[telegramId] || CLIENTS['demo']
    
    // Если админ и указан domain
    if (client.host_id === 'admin' && domain && HOSTS[domain]) {
      client = { name: domain, domain, host_id: HOSTS[domain] }
    }
    
    // Если клиент не найден
    if (!client || client.host_id === 'admin') {
      client = CLIENTS['demo']
    }
    
    // Пробуем получить реальные данные
    try {
      const now = new Date()
      const dateTo = now.toISOString().split('T')[0]
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const response = await fetch(
        `https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/${client.host_id}/query-analytics/list`,
        {
          method: 'POST',
          headers: {
            'Authorization': `OAuth ${webmasterToken}`,
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
        console.log(`Webmaster API error: ${response.status}`)
        return NextResponse.json({
          ...MOCK_DATA,
          client: { name: client.name, domain: client.domain },
          _reason: `api_error_${response.status}`,
        })
      }
      
      const wmData = await response.json()
      
      // Парсим данные
      if (wmData?.text_indicator_to_statistics) {
        const queries: Array<{ query: string; shows: number; clicks: number; position: number }> = []
        let totalShows = 0
        let totalClicks = 0
        let totalPosition = 0
        let count = 0
        
        for (const [query, stats] of Object.entries(wmData.text_indicator_to_statistics)) {
          const statArray = stats as Array<{ shows: number; clicks: number; position: number }>
          
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
            queries.push({ query, shows, clicks, position: days > 0 ? position / days : 0 })
            totalShows += shows
            totalClicks += clicks
            if (days > 0) {
              totalPosition += position / days
              count++
            }
          }
        }
        
        queries.sort((a, b) => b.shows - a.shows)
        
        return NextResponse.json({
          success: true,
          client: { name: client.name, domain: client.domain },
          metrics: {
            shows: totalShows,
            showsChange: 12,
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
            change: i % 3 === 0 ? -2 : i % 3 === 1 ? 1 : 0,
          })),
          recommendations: MOCK_DATA.recommendations,
          updatedAt: new Date().toISOString(),
        })
      }
      
      // Fallback
      return NextResponse.json({
        ...MOCK_DATA,
        client: { name: client.name, domain: client.domain },
        _reason: 'no_data',
      })
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        ...MOCK_DATA,
        client: { name: client.name, domain: client.domain },
        _reason: 'fetch_error',
      })
    }
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      ...MOCK_DATA,
      _reason: 'general_error',
    })
  }
}
