import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  ShieldCheck,
  Building,
  CreditCard,
  Cpu,
  Lock,
  Check,
  Sparkles,
  Layers,
  KeyRound,
  Sun,
  Moon,
  Palette
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-8 space-y-7 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-sm">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Settings & Configuration
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-10.5">
          Workflow rules, AI guardrail parameters, organizational profile, theme settings, and subscription tier
        </p>
      </div>

      {/* Appearance & Interface Theme */}
      <div className="glass-card rounded-3xl p-6 space-y-5 shadow-glass">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Appearance & Interface Theme</h2>
            <p className="text-xs text-slate-500">Select your preferred viewing contrast mode</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
              theme === 'light'
                ? 'bg-blue-500/10 border-blue-500/40 shadow-xs ring-2 ring-blue-500/20'
                : 'glass-card-subtle border-slate-200/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Light Mode</div>
                <div className="text-[11px] text-slate-500">Frosted clinical daylight workspace</div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
              theme === 'dark'
                ? 'bg-blue-500/20 border-blue-500/50 shadow-xs ring-2 ring-blue-500/30'
                : 'glass-card-subtle border-slate-200/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Dark Mode</div>
                <div className="text-[11px] text-slate-500">Deep midnight contrast for reduced eye strain</div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Organization Profile */}
      <div className="glass-card rounded-3xl p-6 space-y-5 shadow-glass">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Healthcare Organization Profile</h2>
            <p className="text-xs text-slate-500">Configured tenant and practice group parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 uppercase font-semibold text-[10px] mb-1.5 tracking-wider">Organization Name</label>
            <input
              type="text"
              readOnly
              value={user?.organization_name || 'Downtown Physician Group'}
              className="w-full glass-card-subtle rounded-xl p-2.5 font-semibold text-slate-800 border border-slate-200/60 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-semibold text-[10px] mb-1.5 tracking-wider">Organization Type</label>
            <input
              type="text"
              readOnly
              value={user?.organization_type || 'PRACTICE'}
              className="w-full glass-card-subtle rounded-xl p-2.5 font-semibold text-slate-800 font-mono border border-slate-200/60 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-semibold text-[10px] mb-1.5 tracking-wider">Active Locations</label>
            <input
              type="text"
              readOnly
              value="8 Ambulatory Locations & 24 Providers"
              className="w-full glass-card-subtle rounded-xl p-2.5 font-semibold text-slate-800 border border-slate-200/60 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-semibold text-[10px] mb-1.5 tracking-wider">EHR Primary Bridge</label>
            <input
              type="text"
              readOnly
              value="Epic Community Connect (SMART-on-FHIR R4)"
              className="w-full glass-card-subtle rounded-xl p-2.5 font-semibold text-slate-800 border border-slate-200/60 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* AI Guardrails & Clinical Safety Engine */}
      <div className="glass-card rounded-3xl p-6 space-y-5 shadow-glass">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">AI Guardrail & Clinical Safety Configuration</h2>
            <p className="text-xs text-slate-500">Autonomous operational boundaries enforced across all user roles</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 backdrop-blur-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-950">Mandatory Human Clinical Attestation</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                AI models are strictly forbidden from approving prescriptions or diagnosing patients. All renewals require provider click-sign.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-white/80 px-3 py-1 rounded-full font-mono border border-emerald-300 shadow-2xs shrink-0 ml-4">
              ENFORCED
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl glass-card-subtle border border-slate-200/60">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900">RAG Knowledge Grounding Requirement</span>
              <p className="text-slate-500 text-[11px]">
                Copilot and routing recommendations must cite specific Practice SOPs or administrative rules.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-700 bg-white/80 px-3 py-1 rounded-full font-mono border border-slate-200/80 shadow-2xs shrink-0 ml-4">
              ENABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl glass-card-subtle border border-slate-200/60">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900">Minimum AI Routing Confidence Threshold</span>
              <p className="text-slate-500 text-[11px]">
                Cases with blocker confidence &lt; 90% are automatically routed for manual staff triage.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-700 font-mono bg-white/80 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs shrink-0 ml-4">
              90.0%
            </span>
          </div>
        </div>
      </div>

      {/* Commercial Pricing Tier */}
      <div className="glass-card rounded-3xl p-6 space-y-5 shadow-glass">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Commercial SaaS Plan Architecture</h2>
            <p className="text-xs text-slate-500">Enterprise pricing models for physician practices and pharmacy networks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="glass-card-subtle p-5 rounded-2xl space-y-3 border border-slate-200/70">
            <div className="font-bold text-sm text-slate-900">Platform Core</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">$249 <span className="text-xs font-normal text-slate-500">/ loc / mo</span></div>
            <p className="text-slate-500 text-[11px] leading-relaxed">Standard EHR bridge, unlimited staff accounts, Kanban workflow queues.</p>
            <div className="pt-2 text-[10px] text-slate-400 font-mono font-medium">Ideal for 1-5 clinics</div>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-3 relative border-2 border-brand-500/40 shadow-glass">
            <span className="absolute -top-3 right-4 apple-btn-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ACTIVE DEMO TIER
            </span>
            <div className="font-bold text-sm text-brand-900">AI Operations Engine</div>
            <div className="text-2xl font-bold text-brand-900 tracking-tight">$599 <span className="text-xs font-normal text-slate-600">/ loc / mo</span></div>
            <p className="text-slate-700 text-[11px] leading-relaxed">Autonomous blocker detection, Copilot RAG grounding, automated prior-auth routing.</p>
            <div className="pt-2 text-[10px] text-brand-700 font-mono font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span>Includes Gemini NLP</span>
            </div>
          </div>

          <div className="glass-card-subtle p-5 rounded-2xl space-y-3 border border-slate-200/70">
            <div className="font-bold text-sm text-slate-900">Enterprise Health System</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">Custom <span className="text-xs font-normal text-slate-500">annual</span></div>
            <p className="text-slate-500 text-[11px] leading-relaxed">Dedicated VPC deployment, custom FHIR transformations, SLA guarantees, BAA compliance.</p>
            <div className="pt-2 text-[10px] text-slate-400 font-mono font-medium">20+ Locations</div>
          </div>
        </div>
      </div>
    </div>
  );
};
