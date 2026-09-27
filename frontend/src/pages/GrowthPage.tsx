import React from 'react';
import {
  TrendingUp,
  Target,
  Eye,
  PlayCircle,
  FlaskConical,
  CheckCircle,
  Expand,
  Building,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const GrowthPage: React.FC = () => {
  const funnelStages = [
    {
      id: 'TARGET',
      name: 'Target Identification',
      icon: Target,
      signal: 'Practice processes >500 refill requests/month with high phone call overhead (>3 staff hours/day)',
      action: 'Map chronic care prescription volume and pharmacy partner concentration',
      kpi: 'Identified accounts with >20 providers',
      color: 'bg-slate-100/80 text-slate-800 border-slate-200'
    },
    {
      id: 'AWARENESS',
      name: 'Awareness & Discovery',
      icon: Eye,
      signal: 'Operations leader complains about provider burnout over chart refill inboxes',
      action: 'Deliver Refill Bottleneck Benchmark report comparing practice turnaround to 24h SLA standards',
      kpi: 'Operations Leader & Chief Medical Officer discovery call scheduled',
      color: 'bg-sky-50/80 text-sky-800 border-sky-200'
    },
    {
      id: 'DEMO',
      name: 'Interactive Operational Demo',
      icon: PlayCircle,
      signal: 'Request to see cross-organization coordination between pharmacy technician and physician',
      action: 'Execute canonical RX-10482 demo showing automated triage, provider 1-click renewal, and audit ledger',
      kpi: 'Attending physician attestation of safety & human-in-the-loop controls',
      color: 'bg-indigo-50/80 text-indigo-800 border-indigo-200'
    },
    {
      id: 'PILOT',
      name: '30-Day Workflow Pilot',
      icon: FlaskConical,
      signal: 'Practice agrees to connect EHR sandbox and 3 partner retail pharmacy locations',
      action: 'Deploy RxResolve Orchestrator with RAG SOP grounding for internal medicine & family clinics',
      kpi: '>30% reduction in resolution turnaround time within first 21 days',
      color: 'bg-amber-50/80 text-amber-800 border-amber-200'
    },
    {
      id: 'ADOPTION',
      name: 'Full Clinical Adoption',
      icon: CheckCircle,
      signal: 'Practice staff handles 100% of routine refill authorizations through RxResolve without telephone tags',
      action: 'Expand live Surescripts / CoverMyMeds electronic Prior Authorization bridges',
      kpi: '92%+ SLA compliance rate across all active patient queues',
      color: 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
    },
    {
      id: 'EXPANSION',
      name: 'Enterprise Health System Expansion',
      icon: Expand,
      signal: 'Pharmacy chain or regional health system rolls out to specialty cardiology & endocrinology clinics',
      action: 'Deploy multi-location enterprise tenant and centralized operations command center',
      kpi: 'Contract expansion to all regional facilities & specialty pharmacy hubs',
      color: 'bg-purple-50/80 text-purple-800 border-purple-200'
    }
  ];

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Commercial Strategy & Go-To-Market
          </h1>
          <span className="text-[11px] bg-slate-900/90 text-white font-mono px-2.5 py-0.5 rounded-full font-bold shadow-xs">
            B2B HEALTHCARE SAAS
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-10.5">
          Go-to-market progression for converting physician practices and pharmacy chains into enterprise partners
        </p>
      </div>

      {/* Target Buyer & Market Positioning Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card-interactive p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <span>Target Customers</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 font-normal">
            <li>Mid-sized physician groups (15-100 providers)</li>
            <li>Independent and regional pharmacy groups</li>
            <li>Multi-location ambulatory care health systems</li>
            <li>Value-based chronic care management organizations</li>
          </ul>
        </div>

        <div className="glass-card-interactive p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Primary Decision Buyers</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 font-normal">
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span><strong className="text-slate-900 font-semibold">Practice Operations Leader</strong> (VP Operations, Practice Director)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span><strong className="text-slate-900 font-semibold">Pharmacy Operations Leader</strong> (Director of Pharmacy)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span><strong className="text-slate-900 font-semibold">Chief Medical Officer</strong> (CMO / Clinical Quality Lead)</span>
            </li>
          </ul>
        </div>

        <div className="glass-card-interactive p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span>Core Value Proposition</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Eliminates phone tag, cuts refill turnaround by 31%, protects physician time with structured AI briefings, and ensures zero prescription abandonment across outpatient clinics.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold font-mono">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Proven $4,120/provider/yr operational ROI</span>
          </div>
        </div>
      </div>

      {/* The 6-Stage GTM Funnel */}
      <div className="glass-card p-6 rounded-3xl space-y-5 shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Enterprise GTM Funnel Lifecycle</h2>
          <span className="text-xs text-slate-500 font-medium">Stage 01 to 06 Conversion Path</span>
        </div>
        
        <div className="space-y-3.5">
          {funnelStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="glass-card-subtle p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:bg-white/90 hover:shadow-glass hover:scale-[1.003]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-800 shrink-0 font-bold text-xs font-mono shadow-xs border border-white/80">
                    0{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{stage.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-xs ${stage.color}`}>
                        {stage.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-400">Customer Signal: </span>
                        <span className="text-slate-800 font-medium">{stage.signal}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">RxResolve Action: </span>
                        <span className="text-brand-700 font-semibold">{stage.action}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl text-xs shrink-0 md:text-right border border-white/80 shadow-xs">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target Success KPI</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{stage.kpi}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
