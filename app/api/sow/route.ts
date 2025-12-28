/**
 * Scope of Work API
 * Управление договорами с блокчейн-фиксацией
 */

import { NextRequest, NextResponse } from 'next/server';

// Helper functions (не экспортируются как routes)
function computeHash(content: any): string {
  // Простая заглушка для хеша
  return Buffer.from(JSON.stringify(content)).toString('base64').slice(0, 32);
}

// GET /api/sow - получить список SOW
export async function GET(request: NextRequest) {
  // Заглушка - реальная логика будет добавлена позже
  return NextResponse.json({ 
    message: 'SOW API endpoint',
    status: 'not_implemented'
  });
}

// POST /api/sow - создать новый SOW
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, content } = body;
    
    if (!projectId || !content) {
      return NextResponse.json(
        { error: 'projectId and content are required' }, 
        { status: 400 }
      );
    }
    
    // Заглушка - реальная логика с Supabase будет добавлена позже
    return NextResponse.json({
      message: 'SOW created (mock)',
      projectId,
      title: title || 'Scope of Work',
      contentHash: computeHash(content),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}
