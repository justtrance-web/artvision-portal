import { NextResponse } from "next/server";

const WEBMASTER_TOKEN = process.env.WEBMASTER_TOKEN || "";
const WEBMASTER_USER_ID = "148aborman";

// Маппинг клиентов на host_id
const HOSTS: Record<string, string> = {
  "tvorimsovershenstvo.ru": "https:tvorimsovershenstvo.ru:443",
  "atribeaute.ru": "https:atribeaute.ru:443",
  "ant-partners.ru": "https:ant-partners.ru:443",
  "vlpco.ru": "https:vlpco.ru:443",
  "burenie-skv.ru": "https:burenie-skv.ru:443",
  "otido.ru": "https:otido.ru:443",
  "extru-tech.ru": "https:extru-tech.ru:443"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  
  if (!domain || !HOSTS[domain]) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }
  
  const hostId = encodeURIComponent(HOSTS[domain]);
  
  try {
    // Получаем статистику поиска
    const statsUrl = `https://api.webmaster.yandex.net/v4/user/${WEBMASTER_USER_ID}/hosts/${hostId}/search-queries/popular?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION`;
    
    const statsRes = await fetch(statsUrl, {
      headers: { Authorization: `OAuth ${WEBMASTER_TOKEN}` }
    });
    
    const stats = await statsRes.json();
    
    // Получаем историю за неделю
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateFrom = weekAgo.toISOString().split("T")[0];
    const dateTo = today.toISOString().split("T")[0];
    
    const historyUrl = `https://api.webmaster.yandex.net/v4/user/${WEBMASTER_USER_ID}/hosts/${hostId}/search-queries/history?query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&date_from=${dateFrom}&date_to=${dateTo}`;
    
    const historyRes = await fetch(historyUrl, {
      headers: { Authorization: `OAuth ${WEBMASTER_TOKEN}` }
    });
    
    const history = await historyRes.json();
    
    // Форматируем данные
    const queries = (stats.queries || []).slice(0, 20).map((q: any) => ({
      q: q.query_text,
      pos: Math.round(q.indicators?.AVG_SHOW_POSITION || 0),
      shows: q.indicators?.TOTAL_SHOWS || 0,
      clicks: q.indicators?.TOTAL_CLICKS || 0,
      change: 0 // TODO: сравнить с прошлой неделей
    }));
    
    // Суммируем статистику
    const totalShows = queries.reduce((sum: number, q: any) => sum + q.shows, 0);
    const totalClicks = queries.reduce((sum: number, q: any) => sum + q.clicks, 0);
    const avgPosition = queries.length > 0 
      ? queries.reduce((sum: number, q: any) => sum + q.pos, 0) / queries.length 
      : 0;
    
    // Позиции по дням
    const positions = (history.indicators?.AVG_SHOW_POSITION || []).map((d: any) => 
      Math.round(d.value || 0)
    ).slice(-7);
    
    return NextResponse.json({
      domain,
      stats: {
        shows: { value: totalShows, change: 0 },
        clicks: { value: totalClicks, change: 0 },
        position: { value: Math.round(avgPosition * 10) / 10, change: 0 }
      },
      positions,
      queries
    });
    
  } catch (error) {
    console.error("Webmaster API error:", error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
