'use client';

import { useState } from 'react';
import { Check, Clock, FileText, Shield, AlertCircle, Send } from 'lucide-react';

interface Service {
  name: string;
  description: string;
  deliverables: string[];
}

interface SOWVersion {
  id: string;
  version_number: number;
  content: {
    services: Service[];
    terms: string;
    budget: string;
    notes?: string;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  content_hash: string;
  created_at: string;
  change_reason?: string;
}

interface Approval {
  id: string;
  user_email: string;
  user_name?: string;
  role: 'agency' | 'client';
  approved: boolean;
  approved_at?: string;
}

interface BlockchainProof {
  id: string;
  data_hash: string;
  ots_status: 'pending' | 'stamped' | 'verified';
  bitcoin_tx_id?: string;
  bitcoin_block_height?: number;
}

interface ScopeOfWorkProps {
  projectId: string;
  projectName: string;
  version: SOWVersion;
  approvals: Approval[];
  proofs: BlockchainProof[];
  isAgency: boolean;
  onSubmitForApproval?: (clientEmail: string, clientName: string) => void;
  onCreateNewVersion?: () => void;
}

export default function ScopeOfWork({
  projectId,
  projectName,
  version,
  approvals,
  proofs,
  isAgency,
  onSubmitForApproval,
  onCreateNewVersion,
}: ScopeOfWorkProps) {
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    draft: 'Черновик',
    pending_approval: 'На согласовании',
    approved: 'Согласовано',
    rejected: 'Отклонено',
  };

  const latestProof = proofs[proofs.length - 1];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scope of Work</h1>
          <p className="text-gray-600">{projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[version.status]}`}>
            {statusLabels[version.status]}
          </span>
          <span className="text-sm text-gray-500">
            v{version.version_number}
          </span>
        </div>
      </div>

      {/* Blockchain Status */}
      {latestProof && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Blockchain Protection</span>
          </div>
          <div className="text-sm text-blue-800">
            {latestProof.ots_status === 'verified' ? (
              <>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-600" />
                  Подтверждено в Bitcoin блоке #{latestProof.bitcoin_block_height}
                </span>
                <a 
                  href={`https://blockstream.info/tx/${latestProof.bitcoin_tx_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Проверить транзакцию
                </a>
              </>
            ) : latestProof.ots_status === 'stamped' ? (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                Ожидает подтверждения в блокчейне (1-24 часа)
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-600" />
                Отправлено в OpenTimestamps
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-600 font-mono break-all">
            SHA-256: {latestProof.data_hash}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Услуги и работы
        </h2>
        <div className="space-y-4">
          {version.content.services.map((service, idx) => (
            <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900">{service.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{service.description}</p>
              {service.deliverables.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Результаты:</span>
                  <ul className="mt-1 space-y-1">
                    {service.deliverables.map((d, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Budget */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Срок</span>
          <p className="text-lg font-medium text-gray-900">{version.content.terms}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Бюджет</span>
          <p className="text-lg font-medium text-gray-900">{version.content.budget} ₽/мес</p>
        </div>
      </div>

      {/* Notes */}
      {version.content.notes && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-xs text-yellow-700 uppercase tracking-wider">Примечания</span>
          <p className="mt-1 text-gray-800">{version.content.notes}</p>
        </div>
      )}

      {/* Change Reason */}
      {version.change_reason && version.version_number > 1 && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <span className="text-xs text-orange-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Изменения в версии {version.version_number}
          </span>
          <p className="mt-1 text-gray-800">{version.change_reason}</p>
        </div>
      )}

      {/* Approvals */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Согласования</h2>
        <div className="space-y-2">
          {approvals.map((approval) => (
            <div 
              key={approval.id} 
              className={`p-3 rounded-lg flex items-center justify-between ${
                approval.approved ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div>
                <span className="font-medium text-gray-900">
                  {approval.user_name || approval.user_email}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({approval.role === 'agency' ? 'Агентство' : 'Клиент'})
                </span>
              </div>
              {approval.approved ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(approval.approved_at!).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Ожидает
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isAgency && version.status === 'draft' && (
        <div className="border-t pt-6">
          {!showApprovalForm ? (
            <button
              onClick={() => setShowApprovalForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Send className="w-4 h-4" />
              Отправить на согласование
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">Отправить клиенту на согласование</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email клиента</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="client@company.ru"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Имя клиента</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSubmitForApproval?.(clientEmail, clientName);
                    setShowApprovalForm(false);
                  }}
                  disabled={!clientEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Отправить
                </button>
                <button
                  onClick={() => setShowApprovalForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAgency && version.status === 'approved' && (
        <div className="border-t pt-6">
          <button
            onClick={onCreateNewVersion}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FileText className="w-4 h-4" />
            Создать новую версию (доп. соглашение)
          </button>
        </div>
      )}
    </div>
  );
}
