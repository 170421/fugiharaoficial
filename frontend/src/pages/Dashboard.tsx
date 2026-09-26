import { useQuery } from '@tanstack/react-query';
import { Users, Megaphone, Send, CheckCheck, Eye, XCircle, TrendingUp, Activity } from 'lucide-react';
import { reportsApi, DashboardStats, Campaign } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CAMPAIGN_STATUS } from '../design-system/status';

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString('pt-BR')}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = data as DashboardStats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema de disparo</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Contatos Ativos" value={stats.totals.contacts} icon={Users} color="bg-blue-500" />
        <StatCard label="Campanhas" value={stats.totals.campaigns} icon={Megaphone} color="bg-purple-500"
          sub={`${stats.totals.activeCampaigns} ativas`} />
        <StatCard label="Mensagens Enviadas" value={stats.totals.messages} icon={Send} color="bg-channel-600" />
        <StatCard label="Entregues" value={stats.totals.delivered} icon={CheckCheck} color="bg-emerald-500"
          sub={`${stats.rates.delivery}% taxa`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Lidas" value={stats.totals.read} icon={Eye} color="bg-cyan-500"
          sub={`${stats.rates.read}% das entregues`} />
        <StatCard label="Falhas" value={stats.totals.failed} icon={XCircle} color="bg-red-500" />
        <StatCard label="Opt-outs" value="—" icon={Activity} color="bg-orange-500" />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-700" />
            <h3 className="font-semibold text-gray-700">Taxa de Entrega</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-brand-700">{stats.rates.delivery}%</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${stats.rates.delivery}%` }}
            />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-cyan-600" />
            <h3 className="font-semibold text-gray-700">Taxa de Leitura</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-cyan-600">{stats.rates.read}%</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${stats.rates.read}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Campanhas Recentes</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentCampaigns.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">Nenhuma campanha criada ainda</p>
          )}
          {stats.recentCampaigns.map((c: Campaign) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.template?.name || '—'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-gray-500">
                  <p>{c.sentCount.toLocaleString('pt-BR')} enviadas</p>
                  <p>{c.totalContacts.toLocaleString('pt-BR')} total</p>
                </div>
                <StatusBadge {...CAMPAIGN_STATUS[c.status]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
