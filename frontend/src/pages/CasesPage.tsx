import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RefillCase, CaseStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Layers,
  Inbox,
  Kanban,
  Table as TableIcon,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building,
  UserCheck
} from 'lucide-react';

export const CasesPage: React.FC<{ onOpenNewCase: () => void }> = ({ onOpenNewCase }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<RefillCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [blockerFilter, setBlockerFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Queue mode: All Refill Cases vs My Queue
  const isMyQueue = searchParams.get('queue') === 'mine';

  const filterMyQueue = (c: RefillCase): boolean => {
    if (user?.role === 'PROVIDER') {
      return (
        c.status === 'WAITING_FOR_PROVIDER' ||
        c.owner_role === 'PROVIDER' ||
        c.ai_analysis?.recommended_role === 'PROVIDER'
      );
    }
    if (user?.role === 'PHARMACY_STAFF') {
      return (
        c.status === 'WAITING_FOR_PHARMACY' ||
        c.status === 'ACTION_REQUIRED' ||
        c.owner_role === 'PHARMACY_STAFF'
      );
    }
    if (user?.role === 'ADMIN') {
      return c.status === 'ESCALATED' || c.sla_status === 'WARNING';
    }
    // PRACTICE_STAFF default
    return (
      c.status === 'TRIAGING' ||
      c.status === 'INVESTIGATING' ||
      c.status === 'WAITING_FOR_INFORMATION' ||
      c.status === 'WAITING_FOR_INSURANCE' ||
      c.owner_role === 'PRACTICE_STAFF'
    );
  };

  const displayedCases = isMyQueue ? cases.filter(filterMyQueue) : cases;

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (blockerFilter !== 'ALL') params.blocker = blockerFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (roleFilter !== 'ALL') params.owner_role = roleFilter;

      const res = await api.getCases(params);
      setCases(res);
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, blockerFilter, priorityFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  // Kanban column grouping
  const kanbanColumns = [
    {
      id: 'NEW_TRIAGE',
      title: 'New & Triaging',
      filter: (c: RefillCase) => c.status === 'NEW' || c.status === 'TRIAGING',
      badgeColor: 'bg-sky-100 text-sky-800'
    },
    {
      id: 'INVESTIGATING',
      title: 'Investigating',
      filter: (c: RefillCase) => c.status === 'INVESTIGATING',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'WAITING',
      title: 'Waiting for Action',
      filter: (c: RefillCase) =>
        c.status === 'WAITING_FOR_PROVIDER' ||
        c.status === 'WAITING_FOR_INFORMATION' ||
        c.status === 'WAITING_FOR_PHARMACY' ||
        c.status === 'WAITING_FOR_INSURANCE',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'ACTION_REQUIRED',
      title: 'Action Required',
      filter: (c: RefillCase) => c.status === 'ACTION_REQUIRED' || c.status === 'ESCALATED',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'RESOLVED',
      title: 'Resolved',
      filter: (c: RefillCase) => c.status === 'RESOLVED',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Refill Case Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, triage, investigate, and unblock prescription refills across all care channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Apple Segmented Pill View Mode Toggle */}
          <div className="flex items-center bg-slate-200/50 p-1 rounded-full border border-slate-300/40 backdrop-blur-md">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 scale-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-slate-900 scale-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={onOpenNewCase}
            className="apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Refill Case</span>
          </button>
        </div>
      </div>

      {/* Directory Mode Switcher Tabs: All Refill Cases vs My Queue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('queue');
              setSearchParams(nextParams);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isMyQueue
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/70 text-slate-600 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Refill Cases</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              !isMyQueue ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}>
              {cases.length}
            </span>
          </button>

          <button
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('queue', 'mine');
              setSearchParams(nextParams);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isMyQueue
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/70 text-slate-600 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>My Queue ({user?.role_title || 'Assigned'})</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isMyQueue ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-blue-700 font-bold'
            }`}>
              {cases.filter(filterMyQueue).length}
            </span>
          </button>
        </div>

        {isMyQueue && (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Filtering cases requiring action by <strong className="text-slate-800">{user?.role_title || user?.name}</strong></span>
          </div>
        )}
      </div>

      {isMyQueue && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-between text-xs text-blue-900 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Active Filter: My Queue ({user?.role_title || user?.role})</span>
              <p className="text-[11px] text-blue-700/90 font-medium">
                Showing {displayedCases.length} case{displayedCases.length === 1 ? '' : 's'} requiring clinical or operational action by your role.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('queue');
              setSearchParams(nextParams);
            }}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Show All {cases.length} Cases
          </button>
        </div>
      )}

      {/* Filter and Search Bar - Frosted Glass Card */}
      <div className="glass-card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Case ID, patient name, medication, pharmacy, or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200/80 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 transition shadow-xs placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="apple-btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Search Cases
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="TRIAGING">Triaging</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="WAITING_FOR_PROVIDER">Waiting for Provider</option>
            <option value="WAITING_FOR_INFORMATION">Waiting for Information</option>
            <option value="WAITING_FOR_PHARMACY">Waiting for Pharmacy</option>
            <option value="WAITING_FOR_INSURANCE">Waiting for Insurance</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Blocker Category Filter */}
          <select
            value={blockerFilter}
            onChange={(e) => setBlockerFilter(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Blockers</option>
            <option value="No refills remaining">No refills remaining</option>
            <option value="Prior authorization required">Prior authorization</option>
            <option value="Missing patient information">Missing patient info</option>
            <option value="Quantity clarification">Quantity clarification</option>
            <option value="Patient visit may be required">Visit required</option>
            <option value="EHR unavailable">EHR unavailable</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Owner Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="PROVIDER">Provider</option>
            <option value="PRACTICE_STAFF">Practice Staff</option>
            <option value="PHARMACY_STAFF">Pharmacy Staff</option>
            <option value="ADMIN">Operations Admin</option>
          </select>

          {(statusFilter !== 'ALL' || blockerFilter !== 'ALL' || priorityFilter !== 'ALL' || roleFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setBlockerFilter('ALL');
                setPriorityFilter('ALL');
                setRoleFilter('ALL');
                setSearch('');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold ml-auto bg-rose-500/10 px-3 py-1 rounded-full border border-rose-400/20 transition active:scale-95"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-white/60 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Medication & Sig</th>
                  <th className="py-3 px-4">Root Blocker</th>
                  <th className="py-3 px-4">Current Owner</th>
                  <th className="py-3 px-4">Workflow State</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">SLA Clock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40 backdrop-blur-xs">
                {displayedCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No refill cases match the selected filters.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  displayedCases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="hover:bg-white/80 transition-all cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.patient_name}</div>
                        <div className="text-[11px] text-slate-400">DOB: {c.patient_dob}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.medication_name}</div>
                        <div className="text-[11px] text-slate-400">{c.dosage} • {c.days_supply}d supply</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{c.blocker}</div>
                        <div className="text-[11px] text-slate-500">{c.blocker_category}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.owner_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{c.owner_role}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        <span className={c.sla_status === 'BREACHED' ? 'text-rose-600' : (c.sla_status === 'WARNING' ? 'text-amber-600' : 'text-slate-700')}>
                          {c.sla_hours_remaining.toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View - 5 Frosted Glass Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colCases = displayedCases.filter(col.filter);
            return (
              <div key={col.id} className="glass-card-subtle p-3.5 flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">{col.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/20 backdrop-blur-md">
                    {colCases.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1">
                  {colCases.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300/80 rounded-2xl">
                      Empty column
                    </div>
                  ) : (
                    colCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="glass-card-interactive p-3.5 cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-400/20">{c.id}</span>
                          <PriorityBadge priority={c.priority} />
                        </div>

                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                            {c.patient_name}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">{c.medication_name}</div>
                        </div>

                        <div className="bg-white/60 p-2 rounded-xl border border-white/80 text-[11px] text-slate-700 backdrop-blur-xs">
                          <span className="font-bold text-slate-800">Blocker: </span>
                          {c.blocker}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span className="truncate max-w-[120px]">{c.owner_name?.split(',')[0]}</span>
                          <span className="font-mono font-bold text-slate-800 flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {c.sla_hours_remaining.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
