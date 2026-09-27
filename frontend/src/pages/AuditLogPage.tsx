import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AuditLogItem } from '../types';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Bot,
  User,
  Activity,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [caseId, setCaseId] = useState(searchParams.get('case_id') || '');
  const [actorType, setActorType] = useState('ALL');
  const [eventType, setEventType] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (caseId) params.case_id = caseId;
      if (actorType !== 'ALL') params.actor_type = actorType;
      if (eventType !== 'ALL') params.event_type = eventType;
      if (search) params.search = search;

      const res = await api.getAuditLogs(params);
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [caseId, actorType, eventType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Audit Ledger</h1>
            <span className="inline-flex items-center gap-1.5 bg-slate-200/50 text-slate-700 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-slate-300/40 backdrop-blur-md">
              <Lock className="w-3 h-3 text-slate-500" /> Read-Only / Append-Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            HIPAA & 21 CFR Part 11 operational record of all refill actions, AI recommendations, and provider decisions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="apple-btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar - Frosted Glass Card */}
      <div className="glass-card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit actions, actors, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200/80 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/50 transition shadow-xs placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="apple-btn-secondary px-5 py-2.5 text-xs font-semibold"
          >
            Filter Records
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Case ID Filter */}
          <input
            type="text"
            placeholder="Case ID (e.g. RX-10482)"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-mono font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none w-44 backdrop-blur-md shadow-xs text-slate-700 placeholder:text-slate-400"
          />

          {/* Actor Type */}
          <select
            value={actorType}
            onChange={(e) => setActorType(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Actors (AI & Human)</option>
            <option value="AI">AI Only</option>
            <option value="HUMAN">Human Only</option>
            <option value="SYSTEM">System Only</option>
          </select>

          {/* Event Type */}
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="bg-white/70 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-medium focus:ring-4 focus:ring-blue-500/15 focus:outline-none backdrop-blur-md shadow-xs text-slate-700"
          >
            <option value="ALL">All Event Types</option>
            <option value="WORKFLOW_TRANSITION">Workflow Transition</option>
            <option value="AI_INFERENCE">AI Inference / Classification</option>
            <option value="CASE_CREATION">Case Creation</option>
            <option value="INTEGRATION_RECOVERY">Integration Recovery</option>
          </select>

          {(caseId || actorType !== 'ALL' || eventType !== 'ALL' || search) && (
            <button
              onClick={() => {
                setCaseId('');
                setActorType('ALL');
                setEventType('ALL');
                setSearch('');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold ml-auto bg-rose-500/10 px-3 py-1 rounded-full border border-rose-400/20 transition active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table - Frosted Glass Card */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-white/60 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] backdrop-blur-md">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action & Event</th>
                <th className="py-3 px-4">State Shift</th>
                <th className="py-3 px-4">Confidence / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40 backdrop-blur-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No audit records found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isAI = log.actor_type === 'AI';
                  return (
                    <tr key={log.id} className="hover:bg-white/80 transition-all">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        <span className="bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-400/20">{log.case_id || 'SYSTEM'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {isAI ? (
                            <Bot className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span>{log.actor_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">
                          {log.actor_role} • {log.actor_type}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{log.action}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">{log.event_type}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.previous_state || log.new_state ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-slate-400">{log.previous_state || 'NONE'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-800">{log.new_state}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {log.confidence && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-400/20 backdrop-blur-md">
                            Confidence: {Math.round(log.confidence * 100)}%
                          </span>
                        )}
                        {log.details && (
                          <div className="text-[11px] text-slate-600 truncate max-w-xs mt-1 font-mono">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
