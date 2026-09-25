import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Send, CheckCheck, Eye, XCircle, Download } from 'lucide-react';
import { reportsApi, DashboardStats } from '../services/api';

function MetricRow({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-sm text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-sm text-gray-700 w-20 text-right shrink-0">
        {value.toLocaleString('pt-BR')} <span className="text-gray-400">({pct}%)</span>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: optOutData } = useQuery({
    queryKey: ['opt-outs'],
    queryFn: () => reportsApi.optOuts().then((r) => r.data),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = data as DashboardStats;

  function exportCSV() {
    const rows = [
      ['Métrica', 'Valor'],
      ['Contatos Ativos', stats.totals.contacts],
      ['Total de Campanhas', stats.totals.campaigns],
      ['Campanhas Ativas', stats.totals.activeCampaigns],
      ['Mensagens Enviadas', stats.totals.messages],
      ['Mensagens Entregues', stats.totals.delivered],
      ['Mensagens Lidas', stats.totals.read],
      ['Falhas', stats.totals.failed],
      ['Taxa de Entrega (%)', stats.rates.delivery],
      ['Taxa de Leitura (%)', stats.rates.read],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas consolidadas de todas as campanhas</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contatos Ativos', value: stats.totals.contacts, icon: Users, color: 'text-blue-600' },
          { label: 'Total Enviadas', value: stats.totals.messages, icon: Send, color: 'text-channel-600' },
          { label: 'Entregues', value: stats.totals.delivered, icon: CheckCheck, color: 'text-emerald-600' },
          { label: 'Lidas', value: stats.totals.read, icon: Eye, color: 'text-cyan-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <Icon size={20} className={color} />
            <p className="text-2xl font-bold text-gray-900 mt-2">{value.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-brand-700" />
          <h3 className="font-semibold text-gray-900">Funil de Entrega</h3>
        </div>
        <div className="space-y-4">
          <MetricRow label="Enviadas" value={stats.totals.messages} total={stats.totals.messages} color="bg-brand-500" />
          <MetricRow label="Entregues" value={stats.totals.delivered} total={stats.totals.messages} color="bg-emerald-500" />
          <MetricRow label="Lidas" value={stats.totals.read} total={stats.totals.messages} color="bg-cyan-500" />
          <MetricRow label="Falhas" value={stats.totals.failed} total={stats.totals.messages} color="bg-red-500" />
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Taxa de Entrega</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-5xl font-bold text-brand-700">{stats.rates.delivery}%</p>
              <p className="text-sm text-gray-400 mt-2">mensagens chegaram ao destinatário</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Taxa de Leitura</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-5xl font-bold text-cyan-600">{stats.rates.read}%</p>
              <p className="text-sm text-gray-400 mt-2">das entregues foram lidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Opt-outs */}
      {optOutData && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle size={18} className="text-red-500" />
            <h3 className="font-semibold text-gray-900">Opt-outs</h3>
          </div>
          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-3xl font-bold text-red-600">{(optOutData as { optedOut: number }).optedOut.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-gray-500">contatos removidos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-700">{(optOutData as { rate: number }).rate}%</p>
              <p className="text-sm text-gray-500">da base total</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <p>Contatos que responderam palavras como "PARAR", "SAIR", "STOP" são automaticamente marcados como opt-out e não recebem mais mensagens.</p>
          </div>
        </div>
      )}
    </div>
  );
}
