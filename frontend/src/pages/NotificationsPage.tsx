import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { NotificationItem } from '../types';
import { Bell, CheckCheck, Clock, ShieldAlert, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    await fetchNotifs();
  };

  const handleMarkRead = async (id: string, actionUrl?: string) => {
    await api.markNotificationRead(id);
    await fetchNotifs();
    if (actionUrl) navigate(actionUrl);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operational Notification Center
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-10.5">
            Role-targeted alerts, SLA warnings, and cross-organization updates
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="apple-btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5"
        >
          <CheckCheck className="w-4 h-4 text-brand-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notification List Frosted Glass Card */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-glass divide-y divide-slate-100/80">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center mx-auto text-slate-400 shadow-xs mb-2">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">No active notifications.</p>
            <p className="text-slate-400">All assigned refill cases are currently on track and within SLA.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id, n.action_url)}
              className={`p-4.5 flex items-start justify-between gap-4 cursor-pointer transition-all duration-200 ${
                n.read
                  ? 'bg-transparent hover:bg-white/50 opacity-75 hover:opacity-100'
                  : 'bg-brand-500/5 hover:bg-brand-500/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-2xs backdrop-blur-xs ${
                    n.priority === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-700 border-rose-200'
                      : n.priority === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-700 border-amber-200'
                      : 'bg-brand-500/10 text-brand-700 border-brand-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 tracking-tight">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(37,99,235,0.7)] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                    <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="bg-white/80 px-2 py-0.2 rounded-md border border-slate-200/60 font-semibold text-slate-600">
                      {n.case_id ? `Case ${n.case_id}` : 'General Protocol'}
                    </span>
                  </div>
                </div>
              </div>

              {n.action_url && (
                <div className="text-xs text-brand-600 font-semibold flex items-center gap-1.5 shrink-0 self-center px-3 py-1.5 rounded-lg hover:bg-brand-50/60 transition">
                  <span>View Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
