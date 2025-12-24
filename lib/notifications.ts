/**
 * Notification Service
 * Отправка уведомлений клиентам о согласовании
 */

interface NotificationPayload {
  to: string;
  subject: string;
  projectName: string;
  approvalLink: string;
  agencyName?: string;
  version?: number;
}

/**
 * Отправляет email с приглашением согласовать SOW
 */
export async function sendApprovalEmail(payload: NotificationPayload): Promise<boolean> {
  const { to, subject, projectName, approvalLink, agencyName = 'Artvision', version = 1 } = payload;
  
  // HTML шаблон письма
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .card { background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .button:hover { background: #1d4ed8; }
    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
    .info { background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .shield { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${agencyName}</div>
    </div>
    
    <h1 style="text-align: center; margin-bottom: 10px;">Согласование Scope of Work</h1>
    <p style="text-align: center; color: #64748b; margin-bottom: 30px;">Проект: ${projectName}</p>
    
    <div class="card">
      <p>Здравствуйте!</p>
      <p>Агентство ${agencyName} подготовило ${version > 1 ? `новую версию (v${version})` : ''} Scope of Work по вашему проекту.</p>
      <p>Пожалуйста, ознакомьтесь с документом и подтвердите согласие:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalLink}" class="button">Открыть и согласовать</a>
      </div>
      
      <div class="info">
        <strong>ℹ️ Что это значит?</strong><br>
        Scope of Work — это документ, который фиксирует объём работ по проекту. 
        После вашего согласия он будет защищён блокчейном Bitcoin.
      </div>
      
      <div style="text-align: center;">
        <span class="shield">🔒 Защита OpenTimestamps + Bitcoin</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Ссылка действительна 7 дней</p>
      <p>${agencyName} • artvision.pro</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Текстовая версия
  const text = `
Согласование Scope of Work

Проект: ${projectName}

Здравствуйте!

Агентство ${agencyName} подготовило Scope of Work по вашему проекту.

Пожалуйста, ознакомьтесь с документом и подтвердите согласие:
${approvalLink}

Ссылка действительна 7 дней.

---
${agencyName} • artvision.pro
  `;
  
  try {
    // Используем Resend, SendGrid или другой сервис
    // Пример с Resend:
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Artvision <noreply@artvision.pro>',
          to: [to],
          subject: subject || `Согласование Scope of Work: ${projectName}`,
          html,
          text,
        }),
      });
      
      return response.ok;
    }
    
    // Fallback: логируем
    console.log('Email notification:', { to, subject, approvalLink });
    return true;
    
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

/**
 * Отправляет уведомление в Telegram
 */
export async function sendTelegramNotification(
  chatId: string | number,
  message: string,
  botToken?: string
): Promise<boolean> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('Telegram notification (no token):', { chatId, message });
    return false;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}

/**
 * Отправляет уведомление агентству о согласовании клиентом
 */
export async function notifyAgencyOfApproval(
  projectName: string,
  clientName: string,
  version: number,
  adminChatId?: string | number
): Promise<void> {
  const message = `
✅ <b>SOW согласован!</b>

Проект: ${projectName}
Клиент: ${clientName}
Версия: v${version}

Документ зафиксирован в блокчейне.
  `;
  
  if (adminChatId) {
    await sendTelegramNotification(adminChatId, message);
  }
}
