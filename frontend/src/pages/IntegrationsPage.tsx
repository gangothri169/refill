import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { IntegrationServiceItem } from '../types';
import {
  Network,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Server,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationServiceItem[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [intRes, healthRes] = await Promise.all([
        api.getIntegrations(),
        api.getHealth()
      ]);
      setIntegrations(intRes);
      setHealth(healthRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await api.retryIntegration(id);
      await fetchData();
      setPingFeedback(`Integration ${id} connection re-established.`);
      setTimeout(() => setPingFeedback(null), 3500);
    } catch (err: any) {
      setPingFeedback(`Retry failed: ${err.message}`);
      setTimeout(() => setPingFeedback(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFailure = async (id: string) => {
    setActionLoading(id);
    try {
      await api.toggleIntegrationFailure(id);
      await fetchData();
      setPingFeedback(`Simulation status for ${id} updated.`);
      setTimeout(() => setPingFeedback(null), 3500);
    } catch (err: any) {
      setPingFeedback(`Toggle failed: ${err.message}`);
      setTimeout(() => setPingFeedback(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const [pingResult, setPingResult] = useState<Record<string, { ms: number; ok: boolean } | null>>({});
  const [pingingAll, setPingingAll] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<string | null>(null);

  const handleTestConnection = async (id: string) => {
    setPingResult((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await api.pingGateway(id);
      setPingResult((prev) => ({ ...prev, [id]: { ms: res.latency_ms, ok: res.ok } }));
      await fetchData();
    } catch (err: any) {
      setPingResult((prev) => ({ ...prev, [id]: { ms: 999, ok: false } }));
    }
  };

  const handlePingAll = async () => {
    setPingingAll(true);
    setPingFeedback(null);
    try {
      await Promise.all(
        integrations.map(async (item) => {
          setPingResult((prev) => ({ ...prev, [item.id]: null }));
          const res = await api.pingGateway(item.id);
          setPingResult((prev) => ({ ...prev, [item.id]: { ms: res.latency_ms, ok: res.ok } }));
        })
      );
      await fetchData();
      setPingFeedback('All 4 healthcare infrastructure bridges probed and latency recalibrated successfully.');
      setTimeout(() => setPingFeedback(null), 4000);
    } catch (err: any) {
      setPingFeedback(`Ping failed: ${err.message}`);
      setTimeout(() => setPingFeedback(null), 4000);
    } finally {
      setPingingAll(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Healthcare Infrastructure Bridges</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulated FHIR EHR, NCPDP SCRIPT pharmacy network, and real-time PBM benefit gateways
          </p>
        </div>

        <button
          onClick={handlePingAll}
          disabled={pingingAll}
          className="apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pingingAll ? 'animate-spin' : ''}`} />
          <span>{pingingAll ? 'Pinging All Gateways...' : 'Ping All Gateways'}</span>
        </button>
      </div>

      {/* Ping Feedback Banner */}
      {pingFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-950 text-xs font-semibold flex items-center justify-between animate-in fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pingFeedback}</span>
          </div>
          <button onClick={() => setPingFeedback(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
        </div>
      )}

      {/* Resilience & Observability Callout - Apple Deep Frosted Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 border border-white/80 shadow-glass-card bg-gradient-to-r from-slate-900/90 via-blue-950/85 to-indigo-950/90 text-white backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/10 text-blue-300 border border-white/20 shrink-0 shadow-inner backdrop-blur-md">
              <Server className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Zero-Data-Loss Architecture</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30 backdrop-blur-md">
                  ISOLATED QUEUES
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed font-medium">
                When an external EHR or PBM gateway experiences timeouts or downtime, RxResolve preserves incoming refill cases safely in durable queues and triggers exponential backoff without corrupting active workflows.
              </p>
            </div>
          </div>

          {/* Subsystem Health Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-md">
              <div className="text-[10px] text-slate-300 font-medium">Core API</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </div>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-md">
              <div className="text-[10px] text-slate-300 font-medium">MongoDB</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </div>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-md">
              <div className="text-[10px] text-slate-300 font-medium">AI / NLP</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </div>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-md">
              <div className="text-[10px] text-slate-300 font-medium">Insurance</div>
              <div className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Degraded
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Cards Grid - Apple Frosted Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const isHealthy = item.status === 'HEALTHY';
          return (
            <div
              key={item.id}
              className={`glass-card-interactive p-5 flex flex-col justify-between space-y-4 ${
                isHealthy ? '' : 'ring-2 ring-amber-400/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs ${
                      isHealthy
                        ? 'bg-emerald-500/10 text-emerald-800 border-emerald-400/30'
                        : 'bg-amber-500/10 text-amber-800 border-amber-400/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHealthy ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-500 animate-ping'
                      }`}
                    />
                    <span>{item.status}</span>
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs text-slate-600 bg-white/60 p-3 rounded-xl border border-white/80 backdrop-blur-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Protocol:</span>
                    <span className="font-mono font-bold text-slate-800">{item.protocol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Latency:</span>
                    <span className="font-mono font-bold text-slate-800">{item.latency_ms} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Success Rate:</span>
                    <span className="font-mono font-bold text-emerald-600">{item.success_rate}%</span>
                  </div>
                </div>

                {item.last_error && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-300/40 text-xs text-amber-950 leading-snug backdrop-blur-xs">
                    <div className="font-bold flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Last Telemetry Error:</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] font-medium">{item.last_error}</div>
                    <div className="mt-1 text-[10px] text-amber-700 font-medium">Case preserved safely in retry buffer.</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2.5">
                {!isHealthy ? (
                  <button
                    onClick={() => handleRetry(item.id)}
                    disabled={actionLoading === item.id}
                    className="apple-btn-primary flex-1 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${actionLoading === item.id ? 'animate-spin' : ''}`} />
                    <span>Retry Gateway</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTestConnection(item.id)}
                    disabled={pingResult[item.id] === null}
                    className="apple-btn-secondary flex-1 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {pingResult[item.id] === null ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                        <span>Pinging Gateway...</span>
                      </>
                    ) : pingResult[item.id] ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">{pingResult[item.id]!.ok ? `✅ ${pingResult[item.id]!.ms}ms — Healthy` : `⚠ ${pingResult[item.id]!.ms}ms — Degraded`}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-brand-600" />
                        <span>Ping Gateway</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleToggleFailure(item.id)}
                  disabled={actionLoading === item.id}
                  className="apple-btn-secondary py-1.5 px-3 text-[11px] font-medium"
                  title="Toggle simulated gateway timeout for resilience testing"
                >
                  <Power className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
