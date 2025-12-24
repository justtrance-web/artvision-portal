/**
 * OpenTimestamps Service
 * Фиксация документов в Bitcoin блокчейне
 */

import crypto from 'crypto';

// OpenTimestamps календари (публичные серверы)
const OTS_CALENDARS = [
  'https://alice.btc.calendar.opentimestamps.org',
  'https://bob.btc.calendar.opentimestamps.org',
  'https://finney.calendar.eternitywall.com',
];

export interface TimestampResult {
  hash: string;
  otsData: Buffer | null;
  status: 'pending' | 'stamped' | 'verified' | 'error';
  bitcoinTxId?: string;
  bitcoinBlockHeight?: number;
  bitcoinBlockTime?: Date;
  error?: string;
}

/**
 * Вычисляет SHA-256 хеш данных
 */
export function computeHash(data: string | object): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Создаёт timestamp через OpenTimestamps
 * Отправляет хеш на календари OTS для включения в Bitcoin блокчейн
 */
export async function createTimestamp(data: string | object): Promise<TimestampResult> {
  const hash = computeHash(data);
  const hashBytes = Buffer.from(hash, 'hex');
  
  try {
    // Пробуем каждый календарь
    for (const calendar of OTS_CALENDARS) {
      try {
        const response = await fetch(`${calendar}/digest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: hashBytes,
        });
        
        if (response.ok) {
          const otsData = Buffer.from(await response.arrayBuffer());
          
          return {
            hash,
            otsData,
            status: 'pending', // Ожидает включения в блок
          };
        }
      } catch (e) {
        console.error(`Calendar ${calendar} failed:`, e);
        continue;
      }
    }
    
    // Если все календари недоступны
    return {
      hash,
      otsData: null,
      status: 'error',
      error: 'All OTS calendars unavailable',
    };
    
  } catch (error) {
    return {
      hash,
      otsData: null,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Проверяет статус timestamp
 * Возвращает информацию о Bitcoin транзакции если подтверждён
 */
export async function verifyTimestamp(otsData: Buffer, originalHash: string): Promise<TimestampResult> {
  try {
    // Для верификации используем публичный API
    // В продакшене лучше использовать собственный Bitcoin нод
    
    const response = await fetch('https://api.opentimestamps.org/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: otsData,
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.verified) {
        return {
          hash: originalHash,
          otsData,
          status: 'verified',
          bitcoinTxId: result.txId,
          bitcoinBlockHeight: result.blockHeight,
          bitcoinBlockTime: new Date(result.blockTime * 1000),
        };
      } else {
        return {
          hash: originalHash,
          otsData,
          status: 'stamped', // Отправлен, но ещё не в блоке
        };
      }
    }
    
    return {
      hash: originalHash,
      otsData,
      status: 'pending',
    };
    
  } catch (error) {
    return {
      hash: originalHash,
      otsData,
      status: 'error',
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Генерирует человекочитаемый proof
 */
export function generateProofDocument(
  entityType: string,
  entityId: string,
  hash: string,
  timestamp: TimestampResult,
  metadata: Record<string, any>
): string {
  const now = new Date().toISOString();
  
  let proofText = `
═══════════════════════════════════════════════════════════════
                    BLOCKCHAIN PROOF CERTIFICATE
                         Artvision CRM
═══════════════════════════════════════════════════════════════

Document Type: ${entityType}
Document ID: ${entityId}
Generated: ${now}

───────────────────────────────────────────────────────────────
                         HASH VERIFICATION
───────────────────────────────────────────────────────────────

SHA-256 Hash: ${hash}

This hash uniquely identifies the document content at the time
of timestamping. Any modification to the document will result
in a different hash.

───────────────────────────────────────────────────────────────
                       BLOCKCHAIN TIMESTAMP
───────────────────────────────────────────────────────────────

Status: ${timestamp.status.toUpperCase()}
`;

  if (timestamp.status === 'verified' && timestamp.bitcoinTxId) {
    proofText += `
Bitcoin Transaction: ${timestamp.bitcoinTxId}
Block Height: ${timestamp.bitcoinBlockHeight}
Block Time: ${timestamp.bitcoinBlockTime?.toISOString()}

Verify at: https://blockstream.info/tx/${timestamp.bitcoinTxId}
`;
  } else if (timestamp.status === 'pending') {
    proofText += `
The document has been submitted to OpenTimestamps calendars
and is pending inclusion in the Bitcoin blockchain.

This typically takes 1-24 hours depending on Bitcoin network
activity.
`;
  }

  proofText += `
───────────────────────────────────────────────────────────────
                         DOCUMENT METADATA
───────────────────────────────────────────────────────────────

${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}

───────────────────────────────────────────────────────────────

This certificate proves that the document existed in its current
form at the time of timestamping. The proof is secured by the
Bitcoin blockchain and cannot be forged or altered.

Protocol: OpenTimestamps (https://opentimestamps.org)
Network: Bitcoin Mainnet

═══════════════════════════════════════════════════════════════
`;

  return proofText;
}
