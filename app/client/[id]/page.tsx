'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  TrendingUp, 
  Shield, 
  Clock, 
  Check, 
  AlertCircle,
  ChevronRight,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  client_name: string;
  created_at: string;
}

interface SOW {
  id: string;
  title: string;
  current_version: {
    id: string;
    version_number: number;
    status: string;
    content: {
      services: Array<{ name: string; description: string }>;
      terms: string;
      budget: string;
    };
    created_at: string;
  };
}

interface BlockchainProof {
  ots_status: string;
  bitcoin_tx_id?: string;
}

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [sow, setSOW] = useState<SOW | null>(null);
  const [proof, setProof] = useState<BlockchainProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    try {
      // Fetch project
      const projectRes = await fetch(`/api/clients/${projectId}`);
      if (projectRes.ok) {
        setProject(await projectRes.json());
      }
      
      // Fetch SOW
      const sowRes = await fetch(`/api/sow/${projectId}`);
      if (sowRes.ok) {
        const sowData = await sowRes.json();
        setSOW(sowData);
        if (sowData.current_version?.proofs?.length > 0) {
          setProof(sowData.current_version.proofs[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching data:', e);
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

  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-700', label: 'Черновик', icon: FileText },
    pending_approval: { color: 'bg-yellow-100 text-yellow-700', label: 'На согласовании', icon: Clock },
    approved: { color: 'bg-green-100 text-green-700', label: 'Согласовано', icon: Check },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Отклонено', icon: AlertCircle },
  };

  const sowStatus = sow?.current_version?.status as keyof typeof statusConfig || 'draft';
  const StatusIcon = statusConfig[sowStatus]?.icon || FileText;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-700">Проекты</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{project?.name || 'Проект'}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4" />
                {project?.client_name}
                <span className="text-gray-400">•</span>
                {project?.domain}
              </p>
            </div>
            {proof && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                {proof.ots_status === 'verified' ? 'Bitcoin Verified' : 'Blockchain Protected'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SOW Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Scope of Work
                  </h2>
                  {sow && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[sowStatus].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[sowStatus].label}
                      </span>
                      <span className="text-sm text-gray-500">
                        v{sow.current_version?.version_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {sow ? (
                <div className="p-6">
                  {/* Services */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Услуги
                    </h3>
                    <div className="space-y-3">
                      {sow.current_version?.content?.services?.map((service, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms & Budget */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Срок</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {sow.current_version?.content?.terms}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Бюджет</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {sow.current_version?.content?.budget} ₽/мес
                      </p>
                    </div>
                  </div>

                  {/* Blockchain Proof */}
                  {proof && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Защита блокчейном</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        {proof.ots_status === 'verified' ? (
                          <>
                            Документ подтверждён в Bitcoin.{' '}
                            <a 
                              href={`https://blockstream.info/tx/${proof.bitcoin_tx_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Проверить →
                            </a>
                          </>
                        ) : proof.ots_status === 'stamped' ? (
                          'Ожидает подтверждения в блокчейне (1-24 часа)'
                        ) : (
                          'Отправлено в OpenTimestamps'
                        )}
                      </p>
                    </div>
                  )}

                  {/* Link to full SOW */}
                  <div className="mt-6 pt-6 border-t">
                    <Link 
                      href={`/client/${projectId}/sow`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      Открыть полный Scope of Work
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Scope of Work ещё не создан</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Быстрый доступ</h3>
              <div className="space-y-2">
                <Link 
                  href={`/client/${projectId}/positions`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Позиции</p>
                    <p className="text-sm text-gray-500">Динамика в поиске</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                
                <Link 
                  href={`/client/${projectId}/sow`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Scope of Work</p>
                    <p className="text-sm text-gray-500">Договор и условия</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>

                <Link 
                  href={`/client/${projectId}/history`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">История</p>
                    <p className="text-sm text-gray-500">Все версии и изменения</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">О проекте</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Создан</span>
                  <span className="text-gray-900">
                    {project?.created_at ? new Date(project.created_at).toLocaleDateString('ru-RU') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Домен</span>
                  <a 
                    href={`https://${project?.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {project?.domain}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Версия SOW</span>
                  <span className="text-gray-900">
                    {sow ? `v${sow.current_version?.version_number}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
