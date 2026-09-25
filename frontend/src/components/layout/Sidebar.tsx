import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  BarChart3,
  LogOut,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contatos' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
];

export function Sidebar({ onLogout, userName }: SidebarProps) {
  return (
    <aside className="w-64 bg-brand-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Farma-X</p>
            <p className="text-xs text-brand-200 opacity-80">WhatsApp Marketing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-brand-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-brand-200 opacity-70">Operador</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
