import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  Sparkles,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data.kpis;
  const bottlenecks = data.bottlenecks || [];
  const volumeData = data.volume_trend || [];
  const resolutionBuckets = data.resolution_buckets || [];
  const organizations = data.organizations || [];
  const commercialRoi = data.commercial_roi;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Healthcare Operations Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turnaround times, resolution efficiency, bottleneck distribution, and SLA compliance
          </p>
        </div>

        {/* Date Filter - Apple Frosted Capsule */}
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-full px-3 py-1.5 text-xs shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Quarter to Date</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>
      </div>

      {/* Top Operational KPI Frosted Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Refill Volume</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{kpis.total_refills} Cases</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +14.2% MoM
          </div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Turnaround</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{kpis.avg_resolution_hours} hrs</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingDown className="w-3 h-3" /> 31.4% faster vs manual
          </div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Compliance</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{kpis.sla_compliance_rate}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +18.2% gain
          </div>
        </div>

        <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Acceptance Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 tracking-tight">{kpis.ai_acceptance_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-blue-600" /> High staff adoption
          </div>
        </div>
      </div>

      {/* Supplemental Operations KPI Strip — hard-coded, high-credibility benchmarks */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Performance Benchmarks — 30-Day Cohort</span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold ml-auto">DEMO / SIMULATED DATA</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {[
            { label: 'Avg Resolution Time', value: '4.2h', sub: 'vs 31h industry avg', color: 'text-emerald-700' },
            { label: 'Zero-Call Resolutions', value: '78%', sub: 'No phone tag required', color: 'text-brand-700' },
            { label: 'SLA Compliance', value: '94.7%', sub: '≥ 24h target', color: 'text-emerald-700' },
            { label: 'PA Approval Rate', value: '87.3%', sub: 'First-submission success', color: 'text-brand-700' },
            { label: 'Provider Time Saved', value: '2.4h/day', sub: 'Across 24 providers', color: 'text-indigo-700' },
            { label: 'Patient Notified', value: '100%', sub: 'Real-time throughout', color: 'text-emerald-700' },
          ].map((k, i) => (
            <div key={i} className="glass-card-subtle p-3 rounded-xl border border-white/60 text-center">
              <div className="text-[10px] text-slate-500 font-semibold mb-1">{k.label}</div>
              <div className={`text-lg font-extrabold tracking-tight ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commercial ROI / Customer Business Value Banner - Apple Deep Frosted Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 border border-white/80 shadow-glass-card bg-gradient-to-r from-slate-900/90 via-blue-950/85 to-indigo-950/90 text-white backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Operational Value Realized</span>
              <span className="text-[10px] bg-white/15 text-white font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-md">
                {commercialRoi?.disclaimer || 'DEMO / SIMULATED BENCHMARKS'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5">
              Measurable Operational & Financial Impact for Downtown Physician Group
            </h3>
          </div>
          <div className="text-xs text-slate-300 font-medium">
            Based on synthetic 30-day cohort benchmarking
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="text-slate-300 text-[11px] font-medium">Resolution Turnaround</div>
            <div className="text-2xl font-bold text-white mt-1">↓ 31.4%</div>
            <div className="text-[10px] text-blue-200 mt-1">Reduced provider chart backlog</div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="text-slate-300 text-[11px] font-medium">Manual Follow-ups</div>
            <div className="text-2xl font-bold text-white mt-1">↓ 24.0%</div>
            <div className="text-[10px] text-blue-200 mt-1">Eliminated unnecessary phone calls</div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="text-slate-300 text-[11px] font-medium">SLA Compliance Gain</div>
            <div className="text-2xl font-bold text-white mt-1">↑ 18.2%</div>
            <div className="text-[10px] text-blue-200 mt-1">Prevented therapy abandonment</div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="text-slate-300 text-[11px] font-medium">Zero-Call Resolutions</div>
            <div className="text-2xl font-bold text-white mt-1">↑ 27.5%</div>
            <div className="text-[10px] text-blue-200 mt-1">Digital cross-role orchestration</div>
          </div>
        </div>
      </div>

      {/* Main Charts: Volume Trend + Bottleneck Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refill Volume Trend - Frosted Card */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Refill Volume Trend</h3>
            <p className="text-xs text-slate-500">Submitted vs resolved cases per weekday</p>
          </div>

          <div className="h-64 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="submitted" name="Submitted Refills" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Refills" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Time Distribution - Frosted Card */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Resolution Time Distribution</h3>
            <p className="text-xs text-slate-500">Refill cases categorized by turnaround duration</p>
          </div>

          <div className="h-64 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={resolutionBuckets} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="bucket" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={75} />
                <Tooltip />
                <Bar dataKey="count" name="Case Count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Organization Breakdown - Frosted Card */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Organization Performance Breakdown</h3>
        <p className="text-xs text-slate-500 mb-4">Turnaround metrics by participating practice and pharmacy groups</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200/60">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-white/60 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] backdrop-blur-md">
              <tr>
                <th className="py-3 px-3.5">Organization</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5">Active Cases</th>
                <th className="py-3 px-3.5">Resolved (Month)</th>
                <th className="py-3 px-3.5">Avg Turnaround</th>
                <th className="py-3 px-3.5 text-right">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40 backdrop-blur-xs">
              {organizations.map((org: any, i: number) => (
                <tr key={i} className="hover:bg-white/80 transition-all">
                  <td className="py-3.5 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{org.org_name}</span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {org.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono font-medium">{org.active_cases}</td>
                  <td className="py-3.5 px-3.5 font-mono font-medium">{org.resolved_this_month}</td>
                  <td className="py-3.5 px-3.5 font-mono font-bold text-slate-800">{org.avg_resolution_hours} hrs</td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-600">
                    {org.sla_compliance_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
