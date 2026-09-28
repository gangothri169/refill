import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Bell,
  Sparkles,
  PlusCircle,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCopilot: () => void;
  copilotOpen: boolean;
  onOpenNewCase: () => void;
  unreadNotificationsCount?: number;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCopilot,
  copilotOpen,
  onOpenNewCase,
  unreadNotificationsCount = 2,
  onToggleMobileSidebar
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-16 glass-nav px-3 sm:px-6 flex items-center justify-between shrink-0 z-10 sticky top-0 gap-2 sm:gap-4">
      {/* Left side: Mobile Hamburger Toggle + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white/60 dark:hover:bg-slate-800 transition md:hidden shrink-0"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Bar with Frosted Glass Pill Capsule */}
        <div className="relative w-full min-w-0">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient, Rx, case ID..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-xs backdrop-blur-md placeholder:text-slate-400 truncate"
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
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Create Refill Request (Apple glossy primary pill button) */}
        <button
          onClick={onOpenNewCase}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-full shadow-md shadow-blue-500/25 active:scale-95 transition-all border border-white/20 shrink-0"
          title="New Refill Request"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Refill Request</span>
          <span className="sm:hidden text-[11px]">New</span>
        </button>

        {/* Copilot Assistant Trigger - Apple visionOS translucent pill */}
        <button
          onClick={onOpenCopilot}
          className={`inline-flex items-center gap-1.5 sm:gap-2 text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-full border transition-all active:scale-95 backdrop-blur-md shadow-xs shrink-0 ${
            copilotOpen
              ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-400/40 ring-4 ring-blue-500/10'
              : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
          }`}
          title="Toggle RxResolve Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="hidden sm:inline">RxResolve Copilot</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800 rounded-full border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700 transition-all backdrop-blur-md shrink-0"
          title="View Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-amber-300 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-full border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 transition-all backdrop-blur-md shrink-0"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Subtle vertical divider */}
        <div className="h-5 sm:h-6 w-px bg-slate-200/70 dark:bg-slate-700/70 shrink-0" />

        {/* User Card - Frosted Capsule */}
        <div className="flex items-center gap-2 pl-1 bg-white/40 dark:bg-slate-800/40 border border-white/80 dark:border-slate-700/80 rounded-full p-1 sm:px-2 shadow-xs backdrop-blur-md shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-600 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div className="hidden lg:block text-left pr-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">{user?.role_title}</div>
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
