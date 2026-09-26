// Fonte única de verdade para rótulos e tom visual de status.
// Antes desta extração, Dashboard.tsx e Campaigns.tsx duplicavam o mesmo
// STATUS_COLORS/STATUS_LABELS de campanha, e Templates.tsx mantinha um
// terceiro mapa próprio (STATUS_CONFIG) com chaves parcialmente diferentes —
// qualquer novo status exigia lembrar de editar os três arquivos.
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock, PauseCircle, XCircle } from 'lucide-react';

export type StatusTone = 'neutral' | 'muted' | 'info' | 'success' | 'warning' | 'danger';

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  muted: 'bg-gray-100 text-gray-500',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  DRAFT: { label: 'Rascunho', tone: 'neutral' },
  SCHEDULED: { label: 'Agendada', tone: 'info' },
  RUNNING: { label: 'Em execução', tone: 'success' },
  PAUSED: { label: 'Pausada', tone: 'warning' },
  COMPLETED: { label: 'Concluída', tone: 'success' },
  FAILED: { label: 'Falha', tone: 'danger' },
  CANCELLED: { label: 'Cancelada', tone: 'muted' },
};

export const TEMPLATE_STATUS: Record<string, { label: string; tone: StatusTone; icon: LucideIcon }> = {
  PENDING: { label: 'Pendente', tone: 'neutral', icon: Clock },
  SUBMITTED: { label: 'Em análise', tone: 'info', icon: Clock },
  APPROVED: { label: 'Aprovado', tone: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Rejeitado', tone: 'danger', icon: XCircle },
  PAUSED: { label: 'Pausado', tone: 'warning', icon: PauseCircle },
};
