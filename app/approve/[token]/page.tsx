'use client';

import { useState, useEffect } from 'react';
import { Check, Shield, FileText, AlertTriangle } from 'lucide-react';

interface ApprovalPageProps {
  params: { token: string };
}

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetchApprovalData();
  }, [params.token]);

  async function fetchApprovalData() {
    try {
      const res = await fetch(`/api/sow/approval/${params.token}`);
      if (!res.ok) throw new Error('Ссылка недействительна или истекла');
      const json = await res.json();
      setData(json);
      if (json.approval.approved) {
        setConfirmed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/sow/approve/${params.token}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Ошибка подтверждения');
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Scope of Work согласован!
          </h1>
          <p className="text-gray-600 mb-4">
            Ваше согласие зафиксировано и будет сохранено в блокчейне Bitcoin.
          </p>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <Shield className="w-4 h-4 inline mr-1" />
            Документ защищён OpenTimestamps
          </div>
        </div>
      </div>
    );
  }

  const { version, project, approval } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-2xl font-bold">Согласование Scope of Work</h1>
            <p className="text-blue-100 mt-1">{project.name}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Info */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>{approval.user_name || 'Уважаемый клиент'}</strong>, 
                агентство Artvision предлагает согласовать объём работ по проекту.
                Пожалуйста, ознакомьтесь с содержимым и подтвердите согласие.
              </p>
            </div>

            {/* Version info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Версия {version.version_number}</span>
              {version.change_reason && (
                <span className="text-orange-600">
                  • Изменение: {version.change_reason}
                </span>
              )}
            </div>

            {/* Services */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Услуги и работы</h2>
              <div className="space-y-3">
                {version.content.services.map((service: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    {service.deliverables?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {service.deliverables.map((d: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase">Срок</span>
                <p className="text-lg font-medium">{version.content.terms}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase">Бюджет</span>
                <p className="text-lg font-medium">{version.content.budget} ₽/мес</p>
              </div>
            </div>

            {/* Notes */}
            {version.content.notes && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <span className="text-xs text-blue-700 uppercase">Примечания</span>
                <p className="mt-1 text-gray-800">{version.content.notes}</p>
              </div>
            )}

            {/* Hash */}
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Shield className="w-4 h-4" />
                Цифровой отпечаток документа (SHA-256)
              </div>
              <code className="text-xs text-gray-500 break-all">
                {version.content_hash}
              </code>
            </div>

            {/* Approval button */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Нажимая кнопку «Согласовать», вы подтверждаете, что ознакомились 
                с объёмом работ и согласны с условиями. Ваше согласие будет 
                зафиксировано в блокчейне Bitcoin через OpenTimestamps.
              </p>
              <button
                onClick={handleApprove}
                disabled={confirming}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Подтверждение...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Согласовать Scope of Work
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Artvision Marketing Agency • artvision.pro</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Защищено OpenTimestamps + Bitcoin
          </p>
        </div>
      </div>
    </div>
  );
}
