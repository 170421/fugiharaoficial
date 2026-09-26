import type { LucideIcon } from 'lucide-react';
import { STATUS_TONE_CLASS, type StatusTone } from '../../design-system/status';

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon;
}

export function StatusBadge({ label, tone, icon: Icon }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_TONE_CLASS[tone]}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
}
