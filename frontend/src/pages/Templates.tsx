import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { templatesApi, Template } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TEMPLATE_STATUS } from '../design-system/status';

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilitário',
  AUTHENTICATION: 'Autenticação',
};

export function TemplatesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => templatesApi.submitToMeta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template enviado para aprovação na Meta');
    },
    onError: () => toast.error('Falha ao enviar para a Meta'),
  });

  const syncMutation = useMutation({
    mutationFn: () => templatesApi.syncFromMeta(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success(`Sincronizado: ${res.data.synced} templates`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template removido');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Templates de mensagem aprovados pela Meta
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn-secondary"
          >
            <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
            Sincronizar Meta
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Novo Template
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium">Como funcionam os templates?</p>
        <p className="mt-1 text-amber-700">
          A API Oficial do WhatsApp exige que todas as mensagens de marketing usem templates pré-aprovados pela Meta.
          Crie o template aqui, envie para aprovação e aguarde (geralmente 24h). Só templates com status <strong>Aprovado</strong> podem ser usados em campanhas.
        </p>
      </div>

      {/* Templates Grid */}
      {isLoading && (
        <div className="text-center py-16 text-gray-400">Carregando templates...</div>
      )}

      <div className="grid gap-4">
        {(templates as Template[]).map((t) => {
          const cfg = TEMPLATE_STATUS[t.status] || TEMPLATE_STATUS.PENDING;

          return (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-gray-800">{t.name}</span>
                    <span className="badge bg-purple-100 text-purple-700">{CATEGORY_LABELS[t.category]}</span>
                    <span className="badge bg-gray-100 text-gray-500 text-xs">{t.language}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.body}</p>
                  {t.footer && <p className="text-xs text-gray-400 mt-1 italic">{t.footer}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge {...cfg} />

                  {t.status === 'PENDING' && (
                    <button
                      onClick={() => submitMutation.mutate(t.id)}
                      disabled={submitMutation.isPending}
                      className="btn-primary text-xs py-1.5"
                    >
                      <Send size={13} />
                      Enviar p/ Meta
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('Remover template?')) deleteMutation.mutate(t.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!isLoading && (templates as Template[]).length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-base">Nenhum template cadastrado</p>
            <p className="text-sm mt-1">Crie seu primeiro template de mensagem</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['templates'] });
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    category: 'MARKETING' as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    language: 'pt_BR',
    body: '',
    footer: '',
    headerType: '' as '' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT',
    headerContent: '',
  });
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await templatesApi.create({
        ...form,
        headerType: form.headerType || undefined,
        headerContent: form.headerContent || undefined,
        footer: form.footer || undefined,
      });
      toast.success('Template criado! Envie para aprovação na Meta.');
      onCreated();
    } catch {
      toast.error('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card p-6 w-full max-w-lg my-4">
        <h2 className="text-lg font-semibold mb-4">Novo Template</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome (snake_case) *</label>
              <input className="input" placeholder="meu_template_vendas" value={form.name}
                onChange={(e) => set('name', e.target.value.toLowerCase().replace(/\s/g, '_'))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilitário</option>
                <option value="AUTHENTICATION">Autenticação</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
              <select className="input" value={form.language} onChange={(e) => set('language', e.target.value)}>
                <option value="pt_BR">Português (BR)</option>
                <option value="en_US">Inglês (EUA)</option>
                <option value="es_ES">Espanhol</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo do Header</label>
              <select className="input" value={form.headerType} onChange={(e) => set('headerType', e.target.value)}>
                <option value="">Sem header</option>
                <option value="TEXT">Texto</option>
                <option value="IMAGE">Imagem</option>
                <option value="VIDEO">Vídeo</option>
                <option value="DOCUMENT">Documento</option>
              </select>
            </div>
          </div>

          {form.headerType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.headerType === 'TEXT' ? 'Texto do Header' : 'URL da mídia'}
              </label>
              <input className="input"
                placeholder={form.headerType === 'TEXT' ? 'Promoção Especial!' : 'https://...'}
                value={form.headerContent} onChange={(e) => set('headerContent', e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corpo da mensagem * <span className="text-gray-400 font-normal">(use {`{{1}}`}, {`{{2}}`} para variáveis)</span>
            </label>
            <textarea className="input" rows={4}
              placeholder={`Olá {{1}}, temos uma oferta especial para você!\n\nAcesse agora com {{2}}% de desconto.`}
              value={form.body} onChange={(e) => set('body', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer (opcional)</label>
            <input className="input" placeholder="Para cancelar responda PARAR" value={form.footer}
              onChange={(e) => set('footer', e.target.value)} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
