import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/sow/approval/[token] - получить данные для страницы согласования
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();
  
  const { data: approval, error } = await supabase
    .from('sow_approvals')
    .select(`
      *,
      version:sow_versions (
        *,
        sow:scope_of_work (
          *,
          project:projects (
            id,
            name,
            domain
          )
        )
      )
    `)
    .eq('approval_token', params.token)
    .gt('token_expires_at', new Date().toISOString())
    .single();
  
  if (error || !approval) {
    return NextResponse.json(
      { error: 'Ссылка недействительна или истекла' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    approval: {
      id: approval.id,
      user_email: approval.user_email,
      user_name: approval.user_name,
      role: approval.role,
      approved: approval.approved,
      approved_at: approval.approved_at,
    },
    version: approval.version,
    project: approval.version?.sow?.project,
  });
}

// POST /api/sow/approval/[token] - подтвердить согласование
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();
  
  // Получаем IP и User-Agent
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Находим согласование
  const { data: approval, error: findError } = await supabase
    .from('sow_approvals')
    .select('*, version:sow_versions(*)')
    .eq('approval_token', params.token)
    .gt('token_expires_at', new Date().toISOString())
    .single();
  
  if (findError || !approval) {
    return NextResponse.json(
      { error: 'Ссылка недействительна или истекла' },
      { status: 404 }
    );
  }
  
  if (approval.approved) {
    return NextResponse.json(
      { error: 'Уже согласовано' },
      { status: 400 }
    );
  }
  
  // Обновляем согласование
  const { error: updateError } = await supabase
    .from('sow_approvals')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      ip_address: ip,
      user_agent: userAgent,
    })
    .eq('id', approval.id);
  
  if (updateError) {
    return NextResponse.json(
      { error: 'Ошибка сохранения' },
      { status: 500 }
    );
  }
  
  // Проверяем, все ли согласовали
  const { data: allApprovals } = await supabase
    .from('sow_approvals')
    .select('*')
    .eq('version_id', approval.version_id);
  
  const allApproved = allApprovals?.every(a => a.approved);
  
  if (allApproved) {
    // Обновляем статус версии
    await supabase
      .from('sow_versions')
      .update({ status: 'approved' })
      .eq('id', approval.version_id);
    
    // Обновляем текущую версию в SOW
    await supabase
      .from('scope_of_work')
      .update({ current_version_id: approval.version_id })
      .eq('id', approval.version.sow_id);
    
    // Создаём финальный blockchain timestamp
    // TODO: вызвать createTimestamp для финальной фиксации
  }
  
  // Отправляем уведомление агентству
  // TODO: отправить email/telegram
  
  return NextResponse.json({
    success: true,
    fullyApproved: allApproved,
  });
}
