'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Shield, 
  Clock, 
  Check, 
  ChevronRight,
  ChevronDown,
  History,
  Download,
  ExternalLink
} from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  status: string;
  content: {
    services: Array<{ name: string; description: string; deliverables: string[] }>;
    terms: string;
    budget: string;
    notes?: string;
  };
  content_hash: string;
  change_reason?: string;
  created_at: string;
}

interface Approval {
  id: string;
  user_email: string;
  user_name?: string;
  role: 'agency' | 'client';
  approved: boolean;
  approved_at?: string;
}

interface Proof {
  id: string;
  data_hash: string;
  ots_status: string;
  bitcoin_tx_id?: string;
  bitcoin_block_height?: number;
  created_at: string;
}

interface SOWData {
  id: string;
  title: string;
  current_version: Version;
  versions: Version[];
  approvals: Approval[];
  proofs: Proof[];
}

export default function SOWPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [sow, setSOW] = useState<SOWData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    fetchSOW();
  }, [projectId]);

  async function fetchSOW() {
    try {
      const res = await fetch(`/api/sow/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSOW(data);
        setSelectedVersion(data.current_version);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">SOW не найден</h1>
          <Link href={`/client/${projectId}`} className="text-blue-600 hover:underline">
            ← Вернуться к проекту
          </Link>
        </div>
      </div>
    );
  }

  const version = selectedVersion || sow.current_version;
  const versionProof = sow.proofs.find(p => p.data_hash === version.content_hash);
  const versionApprovals = sow.approvals.filter(a => 
    // Тут нужно связывать approvals с versions, упрощаю
    true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href={`/client/${projectId}`} className="hover:text-gray-700">Проект</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Scope of Work</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">{sow.title}</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                v{version.version_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <History className="w-4 h-4" />
                История
                <ChevronDown className={`w-4 h-4 transition ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Download className="w-4 h-4" />
                Скачать PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Version History Dropdown */}
        {showHistory && (
          <div className="border-t bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">История версий</h3>
              <div className="space-y-2">
                {sow.versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVersion(v);
                      setShowHistory(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
                      v.id === version.id 
                        ? 'bg-blue-100 border border-blue-200' 
                        : 'bg-white border hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className="font-medium">Версия {v.version_number}</span>
                      {v.change_reason && (
                        <span className="text-sm text-gray-500 ml-2">— {v.change_reason}</span>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(v.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      v.status === 'approved' ? 'bg-green-100 text-green-700' :
                      v.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {v.status === 'approved' ? 'Согласовано' : 
                       v.status === 'pending_approval' ? 'На согласовании' : 'Черновик'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Reason */}
            {version.change_reason && version.version_number > 1 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <h3 className="font-medium text-orange-800 mb-1">
                  Изменения в версии {version.version_number}
                </h3>
                <p className="text-orange-700">{version.change_reason}</p>
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Услуги и работы</h2>
              <div className="space-y-4">
                {version.content.services.map((service, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                    {service.deliverables?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Результаты работ:
                        </p>
                        <ul className="space-y-1">
                          {service.deliverables.map((d, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
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

            {/* Terms */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Условия</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Срок действия</p>
                  <p className="text-xl font-semibold text-gray-900">{version.content.terms}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Ежемесячный бюджет</p>
                  <p className="text-xl font-semibold text-gray-900">{version.content.budget} ₽</p>
                </div>
              </div>
              {version.content.notes && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-sm text-gray-500 mb-1">Примечания</p>
                  <p className="text-gray-800">{version.content.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Статус</h3>
              <div className={`p-3 rounded-lg ${
                version.status === 'approved' ? 'bg-green-50' :
                version.status === 'pending_approval' ? 'bg-yellow-50' :
                'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  {version.status === 'approved' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : version.status === 'pending_approval' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="font-medium">
                    {version.status === 'approved' ? 'Согласовано' :
                     version.status === 'pending_approval' ? 'На согласовании' : 'Черновик'}
                  </span>
                </div>
              </div>

              {/* Approvals */}
              {versionApprovals.length > 0 && (
                <div className="mt-4 space-y-2">
                  {versionApprovals.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-900">{a.user_name || a.user_email}</p>
                        <p className="text-gray-500 text-xs">
                          {a.role === 'agency' ? 'Агентство' : 'Клиент'}
                        </p>
                      </div>
                      {a.approved ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-xs">
                            {new Date(a.approved_at!).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blockchain Proof */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Блокчейн</h3>
              </div>
              
              {versionProof ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {versionProof.ots_status === 'verified' ? (
                        <>✓ Подтверждено в Bitcoin</>
                      ) : versionProof.ots_status === 'stamped' ? (
                        <>⏳ Ожидает блок (1-24ч)</>
                      ) : (
                        <>📤 Отправлено в OTS</>
                      )}
                    </p>
                  </div>
                  
                  {versionProof.bitcoin_tx_id && (
                    <a 
                      href={`https://blockstream.info/tx/${versionProof.bitcoin_tx_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Транзакция в Bitcoin
                    </a>
                  )}
                  
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">SHA-256 хеш</p>
                    <code className="text-xs text-gray-600 break-all block bg-gray-50 p-2 rounded">
                      {version.content_hash}
                    </code>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Документ ещё не зафиксирован в блокчейне
                </p>
              )}
            </div>

            {/* Document Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Документ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Версия</span>
                  <span className="text-gray-900">{version.version_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Создан</span>
                  <span className="text-gray-900">
                    {new Date(version.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Всего версий</span>
                  <span className="text-gray-900">{sow.versions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
