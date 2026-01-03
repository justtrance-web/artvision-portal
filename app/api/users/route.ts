import { NextResponse } from 'next/server';

const GH_TOKEN = process.env.GH_TOKEN || '';
const USERS_URL = 'https://api.github.com/repos/justtrance-web/artvision-data/contents/portal/users.json';

export async function GET() {
  try {
    const response = await fetch(USERS_URL, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.raw'
      },
      next: { revalidate: 60 } // Кэш 1 минута
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}
