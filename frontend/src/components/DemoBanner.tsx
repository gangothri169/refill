import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DemoBanner: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'PHARMACY_STAFF', label: 'Pharmacy Staff', icon: '💊' },
    { role: 'PRACTICE_STAFF', label: 'Practice Staff', icon: '📋' },
    { role: 'PROVIDER', label: 'Provider (Dr.)', icon: '🩺' },
    { role: 'ADMIN', label: 'Operations Admin', icon: '⚙️' }
  ];

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 text-xs py-1.5 px-4 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Environment Notice */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide border border-amber-400/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            <ShieldCheck className="w-3 h-3 text-amber-600" /> Demo Sandbox
          </span>
          <span className="text-slate-500 text-[11px] hidden sm:inline font-normal">
            Pre-loaded with synthetic EHR data • HIPAA-compliant simulated workflow
          </span>
        </div>

        {/* Quick Hero Case Jump & Role Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases/RX-10482')}
            className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-3 py-1 rounded-full text-xs transition-all shadow-sm shadow-blue-500/20 active:scale-95"
            title="Open canonical hero case RX-10482 (Alex Johnson)"
          >
            <Sparkles className="w-3 h-3 text-blue-200" />
            <span>Canonical Hero Case RX-10482</span>
          </button>

          {/* Apple Segmented Control */}
          <div className="flex items-center gap-0.5 bg-slate-200/50 p-1 rounded-full border border-slate-300/40 backdrop-blur-md">
            <span className="text-[10px] text-slate-500 px-2 hidden lg:inline font-semibold tracking-wider">PERSONA</span>
            {roles.map((r) => {
              const active = user?.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => switchRole(r.role)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5 font-semibold scale-100 border border-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <span className="text-xs">{r.icon}</span>
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
