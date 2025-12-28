import { NextResponse } from "next/server";

const WEBMASTER_TOKEN = process.env.WEBMASTER_TOKEN || "";
const USER_ID = "126256095";

const HOSTS: Record<string, string> = {
  "tvorimsovershenstvo.ru": "https:tvorimsovershenstvo.ru:443",
  "atribeaute.ru": "https:atribeaute.ru:443",
  "ant-partners.ru": "https:ant-partners.ru:443",
  "vlpco.ru": "https:vlpco.ru:443",
  "burenie-skv.ru": "https:burenie-skv.ru:443",
  "otido.ru": "https:otido.ru:443",
  "extru-tech.ru": "https:extru-tech.ru:443",
  "geely-a2auto.ru": "https:geely-a2auto.ru:443"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  
  if (!domain || !HOSTS[domain]) {
    return NextResponse.json({ error: "Invalid domain", available: Object.keys(HOSTS) }, { status: 400 });
  }
  
  const hostId = encodeURIComponent(HOSTS[domain]);
  
  try {
    const statsUrl = `https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/${hostId}/search-queries/popular?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&limit=20`;
    
    const statsRes = await fetch(statsUrl, {
      headers: { Authorization: `OAuth ${WEBMASTER_TOKEN}` }
    });
    
    const stats = await statsRes.json();
    
    if (!stats.queries) {
      return NextResponse.json({ error: "No data", raw: stats }, { status: 500 });
    }
    
    const queries = stats.queries.map((q: any) => ({
      q: q.query_text,
      pos: Math.round((q.indicators?.AVG_SHOW_POSITION || 0) * 10) / 10,
      shows: Math.round(q.indicators?.TOTAL_SHOWS || 0),
      clicks: Math.round(q.indicators?.TOTAL_CLICKS || 0),
      change: 0
    }));
    
    const totalShows = queries.reduce((sum: number, q: any) => sum + q.shows, 0);
    const totalClicks = queries.reduce((sum: number, q: any) => sum + q.clicks, 0);
    const avgPosition = queries.length > 0 
      ? queries.reduce((sum: number, q: any) => sum + q.pos, 0) / queries.length 
      : 0;
    
    return NextResponse.json({
      domain,
      stats: {
        shows: { value: totalShows, change: 0 },
        clicks: { value: totalClicks, change: 0 },
        position: { value: Math.round(avgPosition * 10) / 10, change: 0 }
      },
      positions: [15, 14, 13, 12, 11, 10, 9],
      queries
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
