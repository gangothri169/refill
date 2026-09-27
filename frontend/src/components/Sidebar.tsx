import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Inbox,
  BarChart3,
  Bell,
  Network,
  History,
  BookOpen,
  TrendingUp,
  Settings,
  Pill,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Refill Cases', to: '/cases', icon: Layers },
    { label: 'My Queue', to: '/cases?queue=mine', icon: Inbox, badge: user?.role === 'PROVIDER' ? '4' : '12' },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Integrations', to: '/integrations', icon: Network, status: 'degraded' },
    { label: 'Audit Log', to: '/audit', icon: History },
    { label: 'Knowledge Base', to: '/knowledge', icon: BookOpen },
    { label: 'Commercial GTM', to: '/growth', icon: TrendingUp },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-sidebar flex flex-col shrink-0 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-200/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/40">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
            <span>RxResolve</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-700 font-mono font-semibold px-1.5 py-0.2 rounded-full border border-blue-500/20">PRO</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">Refill Orchestration</p>
        </div>
      </div>

      {/* Current Active Workspace Info - Frosted Subcard */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-white/50 border border-white/80 shadow-xs backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Organization</div>
        <div className="text-xs font-semibold text-slate-800 truncate">{user?.organization_name || 'Downtown Physician Group'}</div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
          <span>{user?.role_title || 'Healthcare Operations'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-700 border border-blue-500/20 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 border border-blue-400/20">
                  {item.badge}
                </span>
              )}
              {item.status === 'degraded' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]" title="1 degraded integration" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3.5 m-3 rounded-xl bg-white/40 border border-white/70 shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Workflow Engine</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-600 font-bold">99.9%</span>
        </div>
        <div className="text-[10px] text-slate-400 text-center">
          HIPAA & SOC-2 Compliant v1.0
        </div>
      </div>
    </aside>
  );
};
