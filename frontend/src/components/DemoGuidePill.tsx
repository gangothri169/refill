import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Map,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  Minimize2,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface DemoStep {
  step: number;
  title: string;
  description: string;
  action: string;
  path?: string;
  targetRole?: UserRole;
  targetElementId?: string;
  highlightBadge: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: '1. Inspect the Stuck Refill (RX-10482)',
    description: 'Open the canonical hero refill case RX-10482 for Alex Johnson (Demo Medication 10mg). Notice the primary blocker: "No refills remaining" under Practice SOP §4.2.',
    action: 'Open Hero Case RX-10482',
    path: '/cases/RX-10482',
    targetElementId: 'section-a-state',
    targetRole: 'PRACTICE_STAFF',
    highlightBadge: 'HERO CASE'
  },
  {
    step: 2,
    title: '2. Review Autonomous AI Classification',
    description: 'Section B displays the autonomous AI triage engine. It classified the blocker as "Provider-related" with 94% confidence, formulated clinical reasoning, and cited Practice SOP §4.2.',
    action: 'Inspect Section B: AI Analysis',
    path: '/cases/RX-10482',
    targetElementId: 'section-b-ai',
    targetRole: 'PRACTICE_STAFF',
    highlightBadge: 'AI CLASSIFICATION'
  },
  {
    step: 3,
    title: '3. Care Coordinator Triaging & Routing',
    description: 'Care Coordinators verify information completeness and route the case to Dr. Sarah Wilson for renewal evaluation. The AI assists, but the human coordinates.',
    action: 'Focus Section F: Route to Provider',
    path: '/cases/RX-10482',
    targetElementId: 'section-f-action',
    targetRole: 'PRACTICE_STAFF',
    highlightBadge: 'CLINICAL TRIAGE'
  },
  {
    step: 4,
    title: '4. Switch Persona to Attending Physician',
    description: 'Switch persona to Dr. Sarah Wilson, MD. The interface adapts instantly to her dedicated physician queue — displaying cases requiring clinical renewal sign-off.',
    action: 'Switch to Dr. Sarah Wilson (Provider)',
    path: '/cases/RX-10482',
    targetRole: 'PROVIDER',
    targetElementId: 'section-f-action',
    highlightBadge: 'PHYSICIAN PERSONA'
  },
  {
    step: 5,
    title: '5. Provider 1-Click Renewal Authorization',
    description: 'In Section F, Dr. Wilson evaluates the patient chart and authorizes 3 renewals (90-day supply) with a single attested click. The electronic script is dispatched via Surescripts.',
    action: 'Focus Section F: Authorize Renewal',
    path: '/cases/RX-10482',
    targetRole: 'PROVIDER',
    targetElementId: 'section-f-action',
    highlightBadge: 'E-SIGN RENEWAL'
  },
  {
    step: 6,
    title: '6. Real-Time Patient & Care Team Communications',
    description: 'View Section E (Care Team communication audit stream) and Section G (Patient SMS & Portal notifications). The patient is kept informed with zero phone tag.',
    action: 'View Communication History (Section E)',
    path: '/cases/RX-10482',
    targetElementId: 'communication-history-section',
    highlightBadge: 'REAL-TIME COMMS'
  },
  {
    step: 7,
    title: '7. Verify Immutable Audit Ledger',
    description: 'Every single AI inference, human triage action, message dispatch, and provider signature is cryptographically recorded in the append-only audit ledger with full HIPAA compliance.',
    action: 'Inspect Immutable Audit Ledger',
    path: '/audit?case_id=RX-10482',
    targetRole: 'ADMIN',
    highlightBadge: 'AUDIT LEDGER'
  }
];

export const DemoGuidePill: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();

  const current = DEMO_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === DEMO_STEPS.length - 1;

  const handleExecuteAction = async () => {
    // 1. Switch persona role if required
    if (current.targetRole && user?.role !== current.targetRole) {
      await switchRole(current.targetRole);
    }

    // 2. Navigate to destination path
    if (current.path) {
      navigate(current.path);
    }

    // 3. Scroll to target section smoothly & briefly pulse highlight ring
    if (current.targetElementId) {
      setTimeout(() => {
        const el = document.getElementById(current.targetElementId!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-blue-500/50', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-blue-500/50');
          }, 2400);
        }
      }, 150);
    }
  };

  const handleNextStep = async () => {
    const nextIdx = Math.min(DEMO_STEPS.length - 1, step + 1);
    setStep(nextIdx);
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  // If closed completely, render floating trigger pill
  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 apple-btn-primary px-4 py-2.5 rounded-full shadow-xl shadow-blue-500/25 text-xs font-bold transition-all hover:scale-105 active:scale-95"
        title="Open Interactive Demo Walkthrough Guide"
      >
        <Map className="w-4 h-4 text-blue-200" />
        <span>Demo Guide</span>
        <span className="bg-white/20 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">
          Step {step + 1}/{DEMO_STEPS.length}
        </span>
      </button>
    );
  }

  // If minimized, render a docked compact companion pill
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-full shadow-2xl border border-white/20 text-xs animate-in fade-in">
        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="font-semibold truncate max-w-[200px]">
          Step {step + 1}: {current.highlightBadge}
        </span>
        <button
          onClick={handleExecuteAction}
          className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded-md text-[11px] font-bold"
          title="Run step action"
        >
          Run
        </button>
        <button
          onClick={() => setMinimized(false)}
          className="text-slate-400 hover:text-white p-1"
          title="Expand guide"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-white p-1"
          title="Close guide"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded Floating Non-Blocking Interactive Card
  return (
    <aside 
      aria-label="Interactive Demo Walkthrough"
      className="fixed bottom-6 right-6 z-40 w-[92vw] sm:w-[400px] glass-modal rounded-3xl p-5 shadow-2xl border border-white/90 space-y-4 animate-in slide-in-from-bottom-4 duration-200 bg-white/95 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>RxResolve Interactive Guide</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-700 font-mono font-bold px-1.5 py-0.2 rounded-full border border-blue-400/20">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Click "Run Step" to automate workflow navigation</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Minimize guide"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Close guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Progress Pill Indicator */}
      <div className="flex items-center gap-1.5">
        {DEMO_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            title={`Jump to step ${i + 1}: ${s.highlightBadge}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? 'flex-[3] bg-blue-600'
                : i < step
                ? 'flex-1 bg-blue-300'
                : 'flex-1 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Current Step Content Box */}
      <div className="glass-card-subtle rounded-2xl p-4 space-y-2.5 border border-white/80 bg-white/70">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Step {current.step} of {DEMO_STEPS.length}
          </span>
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-400/25">
            {current.highlightBadge}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
          {current.title}
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {current.description}
        </p>

        {/* Primary Interactive Action Button */}
        <button
          onClick={handleExecuteAction}
          className="apple-btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl mt-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>{current.action}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={handlePrevStep}
          disabled={isFirst}
          className="apple-btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400 font-semibold">
          {step + 1} / {DEMO_STEPS.length}
        </span>

        {isLast ? (
          <button
            onClick={() => {
              setStep(0);
              setMinimized(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 rounded-xl transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Finish Walkthrough</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="apple-btn-primary flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold"
          >
            <span>Next Step</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};
