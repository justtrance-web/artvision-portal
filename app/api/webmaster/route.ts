import { NextResponse } from "next/server";

// Токен хранится в env переменных Vercel
const TOKEN = process.env.WEBMASTER_TOKEN || "y0__xDfh5o8GJTCPCDmgMTjFWHcPZSPYeLX-r6YqBOWv0rQZBsU";
const USER_ID = "126256095";

const HOSTS: Record<string, { name: string; hostId: string; color: string }> = {
  "tvorimsovershenstvo.ru": { name: "Творим Совершенство", hostId: "https:tvorimsovershenstvo.ru:443", color: "#667eea" },
  "vlpco.ru": { name: "VLPco", hostId: "https:vlpco.ru:443", color: "#ec4899" },
  "burenie-skv.ru": { name: "Бурение СКВ", hostId: "https:burenie-skv.ru:443", color: "#06b6d4" },
  "otido.ru": { name: "Otido", hostId: "https:otido.ru:443", color: "#f59e0b" },
  "extru-tech.ru": { name: "Extru-Tech", hostId: "https:extru-tech.ru:443", color: "#10b981" }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const action = searchParams.get("action") || "stats";
  
  // Список всех доменов
  if (action === "list") {
    return NextResponse.json({ 
      domains: Object.entries(HOSTS).map(([d, h]) => ({ domain: d, name: h.name, color: h.color }))
    });
  }
  
  if (!domain || !HOSTS[domain]) {
    return NextResponse.json({ error: "Invalid domain", available: Object.keys(HOSTS) }, { status: 400 });
  }
  
  const hostId = encodeURIComponent(HOSTS[domain].hostId);
  
  try {
    const url = `https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/${hostId}/search-queries/popular?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&limit=20`;
    
    const res = await fetch(url, {
      headers: { Authorization: `OAuth ${TOKEN}` },
      next: { revalidate: 300 } // Кэш 5 минут
    });
    
    const data = await res.json();
    
    if (!data.queries) {
      return NextResponse.json({ error: "No data", raw: data }, { status: 500 });
    }
    
    const queries = data.queries.map((q: any) => ({
      q: q.query_text,
      pos: Math.round((q.indicators?.AVG_SHOW_POSITION || 0) * 10) / 10,
      shows: Math.round(q.indicators?.TOTAL_SHOWS || 0),
      clicks: Math.round(q.indicators?.TOTAL_CLICKS || 0)
    }));
    
    const totalShows = queries.reduce((sum: number, q: any) => sum + q.shows, 0);
    const totalClicks = queries.reduce((sum: number, q: any) => sum + q.clicks, 0);
    const avgPos = queries.length ? queries.reduce((sum: number, q: any) => sum + q.pos, 0) / queries.length : 0;
    const top10 = queries.filter((q: any) => q.pos <= 10).length;
    
    return NextResponse.json({
      domain,
      name: HOSTS[domain].name,
      color: HOSTS[domain].color,
      stats: {
        shows: totalShows,
        clicks: totalClicks,
        position: Math.round(avgPos * 10) / 10,
        top10
      },
      queries
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
