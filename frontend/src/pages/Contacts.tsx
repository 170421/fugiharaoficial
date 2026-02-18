import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Search, Trash2, Tag, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactsApi, Contact } from '../services/api';

export function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () => contactsApi.list({ page, limit: 20, search: search || undefined }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato removido');
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => contactsApi.importCSV(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Importado: ${res.data.created} criados, ${res.data.skipped} ignorados`);
      setShowImport(false);
      setImportFile(null);
    },
    onError: () => toast.error('Falha ao importar CSV'),
  });

  function handleImport() {
    if (!importFile) return toast.error('Selecione um arquivo CSV');
    importMutation.mutate(importFile);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total?.toLocaleString('pt-BR') || 0} contatos cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} /> Importar CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Novo Contato
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tags</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            )}
            {!isLoading && data?.contacts?.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum contato encontrado</td></tr>
            )}
            {data?.contacts?.map((c: Contact) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="flex items-center gap-1"><Phone size={13} /> {c.phone}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map((t) => (
                      <span key={t} className="badge bg-blue-50 text-blue-700 flex items-center gap-0.5">
                        <Tag size={10} /> {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.optedOut
                    ? <span className="badge bg-red-100 text-red-700">Opt-out</span>
                    : <span className="badge bg-green-100 text-green-700">Ativo</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm('Remover contato?')) deleteMutation.mutate(c.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                p === page ? 'bg-whatsapp-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Importar Contatos via CSV</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Formato esperado:</p>
              <code className="text-xs">phone,nome,email</code>
              <br />
              <code className="text-xs">+5511999999999,João Silva,joao@email.com</code>
            </div>
            <input
              type="file"
              accept=".csv"
              className="input mb-4"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowImport(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="btn-primary"
              >
                {importMutation.isPending ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal placeholder */}
      {showCreate && (
        <CreateContactModal onClose={() => setShowCreate(false)} onCreated={() => {
          qc.invalidateQueries({ queryKey: ['contacts'] });
          setShowCreate(false);
        }} />
      )}
    </div>
  );
}

function CreateContactModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await contactsApi.create({ phone, name, email: email || undefined });
      toast.success('Contato criado!');
      onCreated();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Novo Contato</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input className="input" placeholder="+5511999999999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input className="input" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input className="input" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Criar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
