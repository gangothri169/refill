import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RefillCase, CaseEvent, AuditLogItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  UserCheck,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  TrendingDown,
  Building,
  ShieldCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<RefillCase[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [casesRes, analyticsRes, auditsRes] = await Promise.all([
        api.getCases(),
        api.getAnalytics(),
        api.getAuditLogs({ limit: '8' })
      ]);
      setCases(casesRes);
      setAnalytics(analyticsRes);
      setRecentAudits(auditsRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const urgentCases = cases
    .filter((c) => c.status !== 'RESOLVED' && c.status !== 'CANCELLED')
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Refill Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time orchestration across community pharmacies and physician care teams
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="apple-btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Refresh Queues</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Frosted Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Refills</span>
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{analytics?.kpis?.active_refills ?? 16}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Across all queues</div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting MD</span>
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 tracking-tight">{analytics?.kpis?.awaiting_provider ?? 4}</div>
          <div className="text-[11px] text-blue-600/80 mt-1 font-semibold">Physician sign-off</div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Missing Info</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600">
              <FileQuestion className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">{analytics?.kpis?.missing_information ?? 2}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-semibold">Pharmacy inquiry</div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">At Risk (SLA)</span>
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">{analytics?.kpis?.at_risk ?? 2}</div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-semibold">&lt; 2h SLA clock</div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved Today</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">{analytics?.kpis?.resolved_today ?? 4}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-semibold">91.8% compliant</div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution</span>
            <div className="p-1 rounded-lg bg-slate-500/10 text-slate-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">{analytics?.kpis?.avg_resolution_hours ?? 7.2}h</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-0.5 font-semibold">
            <TrendingDown className="w-3 h-3" />
            <span>31% faster</span>
          </div>
        </div>
      </div>

      {/* Grid: Cases Needing Attention + Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Needing Immediate Attention (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Cases Needing Immediate Attention</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Prioritized by SLA urgency, blocker category, and case age</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentCases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="p-3.5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-blue-400/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group backdrop-blur-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-400/20">{c.id}</span>
                    <span className="font-bold text-xs text-slate-900">{c.patient_name}</span>
                    <span className="text-xs text-slate-500">• {c.medication_name} ({c.dosage})</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Blocker:</span> {c.blocker}
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{c.pharmacy_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge status={c.status} size="sm" />
                  <PriorityBadge priority={c.priority} />
                  <div className="text-right text-[11px]">
                    <div className="font-mono font-bold text-slate-800">
                      {c.sla_hours_remaining.toFixed(1)}h SLA
                    </div>
                    <div className="text-[10px] text-slate-400">Owner: {c.owner_name?.split(',')[0]}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Bottlenecks (1 col) */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Workflow Bottlenecks</h2>
            <p className="text-xs text-slate-500 mb-4">Distribution of root blockers holding refill requests</p>

            <div className="space-y-3.5">
              {(analytics?.bottlenecks || [
                { category: 'Provider-related', percentage: 32.0, count: 8, color: '#3b82f6' },
                { category: 'Information-related', percentage: 18.0, count: 4, color: '#f59e0b' },
                { category: 'Insurance/administrative', percentage: 14.0, count: 3, color: '#8b5cf6' },
                { category: 'Pharmacy-related', percentage: 11.0, count: 2, color: '#10b981' },
                { category: 'System/integration', percentage: 25.0, count: 3, color: '#ef4444' }
              ]).map((b: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{b.category}</span>
                    <span className="font-mono text-slate-600 font-bold">{b.percentage}% ({b.count})</span>
                  </div>
                  <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${b.percentage}%`, backgroundColor: b.color || '#3b82f6' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>AI Automated Acceptance Rate:</span>
            <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20">94.2%</span>
          </div>
        </div>
      </div>

      {/* Refill Operations Table - Frosted Card */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Refill Operations Queue</h2>
            <p className="text-xs text-slate-500">Live operational ledger across all clinical and dispensing partners</p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Advanced Filters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/60">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-white/60 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] backdrop-blur-md">
              <tr>
                <th className="py-3 px-3.5">Case ID</th>
                <th className="py-3 px-3.5">Patient</th>
                <th className="py-3 px-3.5">Medication</th>
                <th className="py-3 px-3.5">Blocker & Category</th>
                <th className="py-3 px-3.5">Owner</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5 text-right">SLA Clock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40 backdrop-blur-xs">
              {cases.slice(0, 10).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="hover:bg-white/80 transition-all cursor-pointer"
                >
                  <td className="py-3.5 px-3.5 font-mono font-bold text-blue-600">{c.id}</td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-semibold text-slate-900">{c.patient_name}</div>
                    <div className="text-[11px] text-slate-400">DOB: {c.patient_dob}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-medium text-slate-800">{c.medication_name}</div>
                    <div className="text-[11px] text-slate-400">{c.dosage} • Qty {c.quantity}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-medium text-slate-900">{c.blocker}</div>
                    <div className="text-[11px] text-slate-500">{c.blocker_category}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-medium text-slate-800">{c.owner_name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{c.owner_role}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-3.5">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-semibold">
                    <span className={c.sla_status === 'BREACHED' ? 'text-rose-600' : (c.sla_status === 'WARNING' ? 'text-amber-600' : 'text-slate-700')}>
                      {c.sla_hours_remaining.toFixed(1)}h
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity / Audit Feed - Frosted Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live Refill Audit Stream</h2>
            <p className="text-xs text-slate-500">Immutable ledger events generated by staff, providers, and AI</p>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Full Audit Ledger →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {recentAudits.map((a) => (
            <div key={a.id} className="p-3 rounded-xl border border-white/80 bg-white/50 backdrop-blur-md flex items-start justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-700 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">{a.case_id || 'SYSTEM'}</span>
                  <span className="font-semibold text-slate-800">{a.action.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Actor: <span className="font-medium text-slate-700">{a.actor_name}</span> ({a.actor_role})
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
