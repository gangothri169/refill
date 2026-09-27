import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Eye,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface DemoStep {
  step: number;
  title: string;
  description: string;
  action: string;
  path?: string;
  highlight?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'See the Stuck Refill',
    description: 'Open the canonical demo case — RX-10482. Margaret Chen needs Lisinopril but has 0 refills remaining.',
    action: 'Open RX-10482',
    path: '/cases/RX-10482',
    highlight: 'BLOCKER HERO CARD'
  },
  {
    step: 2,
    title: 'Read the AI Diagnosis',
    description: 'The AI engine has already classified the blocker, cited the SOP, and recommended an action — before any human touched the case.',
    action: 'Review AI Analysis (Section B)',
    path: '/cases/RX-10482',
    highlight: 'SECTION B'
  },
  {
    step: 3,
    title: 'Accept the AI Recommendation',
    description: 'Click "Accept Recommendation" to route the case to Dr. Sarah Wilson for provider review. The AI routes — the physician decides.',
    action: 'Accept & Route to Provider',
    path: '/cases/RX-10482',
    highlight: 'ACCEPT BUTTON'
  },
  {
    step: 4,
    title: 'Switch to Provider Role',
    description: 'Use the role switcher in the banner to become Dr. Sarah Wilson. See her filtered view — only cases requiring her sign-off.',
    action: 'Switch to PROVIDER role',
    path: '/dashboard',
    highlight: 'DEMO BANNER SWITCHER'
  },
  {
    step: 5,
    title: 'Provider 1-Click Approval',
    description: 'Dr. Wilson reviews the AI-generated clinical briefing and approves the renewal with a single attested click. No phone call needed.',
    action: 'Authorize Renewal (Section E)',
    path: '/cases/RX-10482',
    highlight: 'SECTION E'
  },
  {
    step: 6,
    title: 'Patient Is Notified',
    description: 'Scroll to the Patient Communication Log — Margaret received real-time SMS and portal updates throughout the resolution. Zero phone tag.',
    action: 'View Patient Notifications',
    path: '/cases/RX-10482',
    highlight: 'PATIENT LOG'
  },
  {
    step: 7,
    title: 'See the Immutable Audit Trail',
    description: 'Every action is SHA-256 hashed and timestamped — who did what, when, and why. Full regulatory observability.',
    action: 'Review Audit Log',
    path: '/audit-logs',
    highlight: 'AUDIT LEDGER'
  }
];

export const DemoGuidePill: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const current = DEMO_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === DEMO_STEPS.length - 1;

  const handleNavigate = () => {
    if (current.path) {
      navigate(current.path);
    }
  };

  return (
    <>
      {/* Floating Demo Guide Pill */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 apple-btn-primary px-4 py-2.5 rounded-full shadow-xl shadow-brand-500/25 text-sm font-semibold"
        title="Open Demo Guide"
      >
        <Map className="w-4 h-4" />
        <span>Demo Guide</span>
        <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
          {DEMO_STEPS.length} Steps
        </span>
      </button>

      {/* Demo Walkthrough Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative glass-modal rounded-3xl p-6 w-full max-w-md shadow-glass-modal border border-white/80 space-y-5 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-brand-500/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">RxResolve Demo Guide</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Guided walkthrough — 7 steps</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-1.5">
              {DEMO_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'flex-[3] bg-brand-600'
                      : i < step
                      ? 'flex-1 bg-brand-300'
                      : 'flex-1 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Current Step Content */}
            <div className="glass-card-subtle rounded-2xl p-4 space-y-3 border border-white/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Step {current.step} of {DEMO_STEPS.length}
                </span>
                {current.highlight && (
                  <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {current.highlight}
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900 tracking-tight">{current.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{current.description}</p>

              {/* Navigate Action Button */}
              <button
                onClick={handleNavigate}
                className="apple-btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl"
              >
                <Zap className="w-4 h-4" />
                <span>{current.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={isFirst}
                className="apple-btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {isLast ? (
                <button
                  onClick={() => { setOpen(false); setStep(0); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Demo Complete</span>
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(DEMO_STEPS.length - 1, s + 1))}
                  className="apple-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
