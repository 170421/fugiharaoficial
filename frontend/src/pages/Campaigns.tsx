import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Pause, X, Eye, Calendar, Users, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { campaignsApi, templatesApi, contactsApi, Campaign } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  RUNNING: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', SCHEDULED: 'Agendada', RUNNING: 'Em execução',
  PAUSED: 'Pausada', COMPLETED: 'Concluída', FAILED: 'Falha', CANCELLED: 'Cancelada',
};

export function CampaignsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: () => campaignsApi.list({ page, limit: 15 }).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.launch(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campanha iniciada!`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Erro ao iniciar campanha');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.pause(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campanha pausada'); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campanha cancelada'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total || 0} campanhas no total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {isLoading && <div className="card p-12 text-center text-gray-400">Carregando...</div>}

        {!isLoading && (data?.campaigns || []).length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <p>Nenhuma campanha criada ainda</p>
          </div>
        )}

        {(data?.campaigns || []).map((c: Campaign) => {
          const sentPct = c.totalContacts > 0 ? (c.sentCount / c.totalContacts) * 100 : 0;
          const deliveredPct = c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0;

          return (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <span className={`badge ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {c.contactList?.name}</span>
                    <span className="flex items-center gap-1"><Send size={12} /> {c.template?.name}</span>
                    {c.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(c.scheduledAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {c.totalContacts > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Enviadas: {c.sentCount.toLocaleString('pt-BR')}/{c.totalContacts.toLocaleString('pt-BR')}</span>
                        <span>{Math.round(sentPct)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-whatsapp-500 rounded-full" style={{ width: `${sentPct}%` }} />
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Entregues: {c.deliveredCount.toLocaleString('pt-BR')} ({Math.round(deliveredPct)}%)</span>
                        <span>Lidas: {c.readCount.toLocaleString('pt-BR')}</span>
                        <span className="text-red-400">Falhas: {c.failedCount.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDetailId(c.id)} className="btn-secondary text-xs py-1.5">
                    <Eye size={13} /> Ver detalhes
                  </button>

                  {['DRAFT', 'SCHEDULED'].includes(c.status) && (
                    <button onClick={() => launchMutation.mutate(c.id)} className="btn-primary text-xs py-1.5">
                      <Play size={13} /> Iniciar
                    </button>
                  )}
                  {c.status === 'RUNNING' && (
                    <button onClick={() => pauseMutation.mutate(c.id)} className="btn-secondary text-xs py-1.5">
                      <Pause size={13} /> Pausar
                    </button>
                  )}
                  {['DRAFT', 'SCHEDULED', 'PAUSED'].includes(c.status) && (
                    <button
                      onClick={() => { if (confirm('Cancelar campanha?')) cancelMutation.mutate(c.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                p === page ? 'bg-whatsapp-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{p}</button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', templateId: '', contactListId: '', scheduledAt: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-approved'],
    queryFn: () => templatesApi.list().then((r) => r.data.filter((t: { status: string }) => t.status === 'APPROVED')),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => contactsApi.getLists().then((r) => r.data),
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.templateId) return toast.error('Selecione um template aprovado');
    if (!form.contactListId) return toast.error('Selecione uma lista de contatos');

    setLoading(true);
    try {
      await campaignsApi.create({
        ...form,
        scheduledAt: form.scheduledAt || undefined,
      });
      toast.success('Campanha criada! Clique em "Iniciar" para disparar.');
      onCreated();
    } catch {
      toast.error('Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Nova Campanha de Disparo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha *</label>
            <input className="input" placeholder="Black Friday 2025" value={form.name}
              onChange={(e) => set('name', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template * <span className="text-gray-400 font-normal">(só aprovados)</span></label>
            <select className="input" value={form.templateId} onChange={(e) => set('templateId', e.target.value)} required>
              <option value="">Selecione um template...</option>
              {(templates as Array<{ id: string; name: string }>).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {(templates as unknown[]).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Nenhum template aprovado. Crie e envie um template para aprovação primeiro.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Contatos *</label>
            <select className="input" value={form.contactListId} onChange={(e) => set('contactListId', e.target.value)} required>
              <option value="">Selecione uma lista...</option>
              {(lists as Array<{ id: string; name: string; _count: { members: number } }>).map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l._count.members} contatos)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agendar para (opcional)</label>
            <input type="datetime-local" className="input" value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Deixe em branco para disparar manualmente</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input className="input" placeholder="Campanha de prospecção Q1..." value={form.description}
              onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Criando...' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
