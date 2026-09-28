import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Activity,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [queueCount, setQueueCount] = useState<number>(0);

  useEffect(() => {
    async function loadQueueCount() {
      try {
        const allCases = await api.getCases();
        if (Array.isArray(allCases)) {
          let count = 0;
          if (user?.role === 'PROVIDER') {
            count = allCases.filter(
              (c: any) =>
                c.status === 'WAITING_FOR_PROVIDER' ||
                c.owner_role === 'PROVIDER' ||
                c.ai_analysis?.recommended_role === 'PROVIDER'
            ).length;
          } else if (user?.role === 'PHARMACY_STAFF') {
            count = allCases.filter(
              (c: any) =>
                c.status === 'WAITING_FOR_PHARMACY' ||
                c.status === 'ACTION_REQUIRED' ||
                c.owner_role === 'PHARMACY_STAFF'
            ).length;
          } else if (user?.role === 'ADMIN') {
            count = allCases.filter((c: any) => c.status === 'ESCALATED' || c.sla_status === 'WARNING').length;
          } else {
            // PRACTICE_STAFF default
            count = allCases.filter(
              (c: any) =>
                c.status === 'TRIAGING' ||
                c.status === 'INVESTIGATING' ||
                c.status === 'WAITING_FOR_INFORMATION' ||
                c.status === 'WAITING_FOR_INSURANCE' ||
                c.owner_role === 'PRACTICE_STAFF'
            ).length;
          }
          setQueueCount(count);
        }
      } catch {}
    }
    loadQueueCount();
  }, [user?.role, location.pathname, location.search]);

  const isMyQueueActive = location.pathname === '/cases' && location.search.includes('queue=mine');
  const isRefillCasesActive = location.pathname === '/cases' && !location.search.includes('queue=mine');

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, isItemActive: location.pathname === '/dashboard' },
    { label: 'Refill Cases', to: '/cases', icon: Layers, isItemActive: isRefillCasesActive },
    { label: 'My Queue', to: '/cases?queue=mine', icon: Inbox, badge: queueCount > 0 ? String(queueCount) : undefined, isItemActive: isMyQueueActive },
    { label: 'Analytics', to: '/analytics', icon: BarChart3, isItemActive: location.pathname === '/analytics' },
    { label: 'Notifications', to: '/notifications', icon: Bell, isItemActive: location.pathname === '/notifications' },
    { label: 'Integrations', to: '/integrations', icon: Network, status: 'degraded', isItemActive: location.pathname === '/integrations' },
    { label: 'Audit Log', to: '/audit', icon: History, isItemActive: location.pathname === '/audit' },
    { label: 'Knowledge Base', to: '/knowledge', icon: BookOpen, isItemActive: location.pathname === '/knowledge' },
    { label: 'Commercial GTM', to: '/growth', icon: TrendingUp, isItemActive: location.pathname === '/growth' },
    { label: 'Settings', to: '/settings', icon: Settings, isItemActive: location.pathname === '/settings' },
  ];

  const renderContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/40">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>RxResolve</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono font-semibold px-1.5 py-0.2 rounded-full border border-blue-500/20">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none mt-0.5">Refill Orchestration</p>
          </div>
        </div>

        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current Active Workspace Info - Frosted Subcard */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/60 shadow-xs backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Organization</div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.organization_name || 'Downtown Physician Group'}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
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
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className={() =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  item.isItemActive
                    ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-400/20">
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
      <div className="p-3.5 m-3 rounded-xl bg-white/40 dark:bg-slate-800/50 border border-white/70 dark:border-slate-700/50 shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Workflow Engine</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">99.9%</span>
        </div>
        <div className="text-[10px] text-slate-400 text-center">
          HIPAA & SOC-2 Compliant v1.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-sidebar shrink-0 z-20">
        {renderContent(false)}
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] glass-sidebar flex flex-col z-50 md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderContent(true)}
      </aside>
    </>
  );
};
