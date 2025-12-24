/**
 * Scope of Work API
 * Управление договорами с блокчейн-фиксацией
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { computeHash, createTimestamp, generateProofDocument } from '@/lib/opentimestamps';

// GET /api/sow/[projectId] - получить SOW проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const supabase = createClient();
  
  const { data: sow, error } = await supabase
    .from('scope_of_work')
    .select(`
      *,
      current_version:sow_versions!current_version_id (
        *,
        approvals:sow_approvals (*),
        proofs:blockchain_proofs (*)
      ),
      versions:sow_versions (
        id,
        version_number,
        status,
        created_at,
        change_reason
      )
    `)
    .eq('project_id', params.projectId)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  
  return NextResponse.json(sow);
}

// POST /api/sow - создать новый SOW
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  const { projectId, title, content } = body;
  
  // Вычисляем хеш содержимого
  const contentHash = computeHash(content);
  
  // Создаём SOW
  const { data: sow, error: sowError } = await supabase
    .from('scope_of_work')
    .insert({
      project_id: projectId,
      title: title || 'Scope of Work',
    })
    .select()
    .single();
  
  if (sowError) {
    return NextResponse.json({ error: sowError.message }, { status: 400 });
  }
  
  // Создаём первую версию
  const { data: version, error: versionError } = await supabase
    .from('sow_versions')
    .insert({
      sow_id: sow.id,
      version_number: 1,
      content,
      content_hash: contentHash,
      status: 'draft',
    })
    .select()
    .single();
  
  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 400 });
  }
  
  // Обновляем текущую версию
  await supabase
    .from('scope_of_work')
    .update({ current_version_id: version.id })
    .eq('id', sow.id);
  
  return NextResponse.json({ sow, version });
}

// PUT /api/sow/[id]/version - создать новую версию
export async function createNewVersion(
  sowId: string,
  content: any,
  changeReason: string,
  supabase: any
) {
  // Получаем текущую версию
  const { data: currentSow } = await supabase
    .from('scope_of_work')
    .select('current_version_id, sow_versions(version_number)')
    .eq('id', sowId)
    .single();
  
  const lastVersionNumber = currentSow?.sow_versions?.[0]?.version_number || 0;
  const contentHash = computeHash(content);
  
  // Создаём новую версию
  const { data: version, error } = await supabase
    .from('sow_versions')
    .insert({
      sow_id: sowId,
      version_number: lastVersionNumber + 1,
      content,
      content_hash: contentHash,
      change_reason: changeReason,
      status: 'draft',
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return version;
}

// POST /api/sow/[versionId]/submit - отправить на согласование
export async function submitForApproval(
  versionId: string,
  clientEmail: string,
  clientName: string,
  agencyUserId: string,
  supabase: any
) {
  // Обновляем статус версии
  await supabase
    .from('sow_versions')
    .update({ status: 'pending_approval' })
    .eq('id', versionId);
  
  // Создаём записи согласования для обеих сторон
  const approvals = [
    {
      version_id: versionId,
      user_id: agencyUserId,
      user_email: '', // Заполнится из профиля
      role: 'agency',
      approved: true, // Агентство автоматически одобряет свою версию
      approved_at: new Date().toISOString(),
    },
    {
      version_id: versionId,
      user_email: clientEmail,
      user_name: clientName,
      role: 'client',
      approved: false,
    },
  ];
  
  const { data, error } = await supabase
    .from('sow_approvals')
    .insert(approvals)
    .select();
  
  if (error) throw error;
  
  // Получаем данные версии для timestamp
  const { data: version } = await supabase
    .from('sow_versions')
    .select('*')
    .eq('id', versionId)
    .single();
  
  // Создаём blockchain timestamp
  const timestamp = await createTimestamp({
    versionId,
    contentHash: version.content_hash,
    submittedAt: new Date().toISOString(),
    submittedBy: agencyUserId,
  });
  
  // Сохраняем proof
  await supabase
    .from('blockchain_proofs')
    .insert({
      entity_type: 'sow_version',
      entity_id: versionId,
      data_hash: timestamp.hash,
      ots_file: timestamp.otsData,
      ots_status: timestamp.status,
    });
  
  return { approvals: data, timestamp };
}

// POST /api/sow/approve/[token] - подтверждение клиентом
export async function approveByToken(
  token: string,
  ipAddress: string,
  userAgent: string,
  supabase: any
) {
  // Находим согласование по токену
  const { data: approval, error } = await supabase
    .from('sow_approvals')
    .select('*, version:sow_versions(*)')
    .eq('approval_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single();
  
  if (error || !approval) {
    throw new Error('Invalid or expired approval token');
  }
  
  if (approval.approved) {
    throw new Error('Already approved');
  }
  
  // Обновляем согласование
  const { data: updated } = await supabase
    .from('sow_approvals')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .eq('id', approval.id)
    .select()
    .single();
  
  // Проверяем, все ли стороны согласовали
  const { data: allApprovals } = await supabase
    .from('sow_approvals')
    .select('*')
    .eq('version_id', approval.version_id);
  
  const allApproved = allApprovals?.every((a: any) => a.approved);
  
  if (allApproved) {
    // Обновляем статус версии
    await supabase
      .from('sow_versions')
      .update({ status: 'approved' })
      .eq('id', approval.version_id);
    
    // Обновляем текущую версию в SOW
    const { data: version } = await supabase
      .from('sow_versions')
      .select('sow_id')
      .eq('id', approval.version_id)
      .single();
    
    await supabase
      .from('scope_of_work')
      .update({ current_version_id: approval.version_id })
      .eq('id', version.sow_id);
    
    // Создаём финальный blockchain proof
    const timestamp = await createTimestamp({
      versionId: approval.version_id,
      approvedAt: new Date().toISOString(),
      approvals: allApprovals,
    });
    
    await supabase
      .from('blockchain_proofs')
      .insert({
        entity_type: 'sow_approval',
        entity_id: approval.version_id,
        data_hash: timestamp.hash,
        ots_file: timestamp.otsData,
        ots_status: timestamp.status,
      });
  }
  
  return { approval: updated, fullyApproved: allApproved };
}
