import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Sparkles,
  PlusCircle,
  LogOut,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCopilot: () => void;
  copilotOpen: boolean;
  onOpenNewCase: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCopilot,
  copilotOpen,
  onOpenNewCase,
  unreadNotificationsCount = 2
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 glass-nav px-6 flex items-center justify-between shrink-0 z-10 sticky top-0">
      {/* Search Bar with Frosted Glass Pill Capsule */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, medication, case ID (e.g. RX-10482), or pharmacy..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white/60 border border-slate-200/80 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:bg-white text-slate-800 transition-all shadow-xs backdrop-blur-md placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val) navigate(`/cases?search=${encodeURIComponent(val)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Create Refill Request (Apple glossy primary pill button) */}
        <button
          onClick={onOpenNewCase}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-md shadow-blue-500/25 active:scale-95 transition-all border border-white/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Refill Request</span>
        </button>

        {/* Copilot Assistant Trigger - Apple visionOS translucent pill */}
        <button
          onClick={onOpenCopilot}
          className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 backdrop-blur-md shadow-xs ${
            copilotOpen
              ? 'bg-blue-600/15 text-blue-700 border-blue-400/40 ring-4 ring-blue-500/10'
              : 'bg-white/70 text-slate-700 border-slate-200/80 hover:bg-white hover:border-slate-300'
          }`}
          title="Toggle RxResolve Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="hidden sm:inline">RxResolve Copilot</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-full border border-transparent hover:border-slate-200/60 transition-all backdrop-blur-md"
          title="View Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Subtle vertical divider */}
        <div className="h-6 w-px bg-slate-200/70" />

        {/* User Card - Frosted Capsule */}
        <div className="flex items-center gap-2.5 pl-1 bg-white/40 border border-white/80 rounded-full px-2 py-1 shadow-xs backdrop-blur-md">
          <div className="w-7 h-7 rounded-full bg-slate-200 border border-white overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
          <div className="hidden lg:block text-left pr-1">
            <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-500 leading-tight font-medium">{user?.role_title}</div>
          </div>
          <button
            onClick={logout}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-full transition ml-0.5"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
