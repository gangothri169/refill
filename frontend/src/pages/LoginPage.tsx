import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pill, ShieldCheck, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('practice@rxresolve.demo');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const demoPersonas: { role: UserRole; name: string; title: string; org: string; avatar: string; desc: string }[] = [
    {
      role: 'PHARMACY_STAFF',
      name: 'Elena Rostova, CPhT',
      title: 'Lead Pharmacy Technician',
      org: 'Downtown Pharmacy',
      avatar: 'https://images.unsplash.com/photo-1594824813583-30f14652c206?w=150',
      desc: 'Creates refill requests, reviews blocker status, and responds to practice inquiries.'
    },
    {
      role: 'PRACTICE_STAFF',
      name: 'Maya Lin, BSN',
      title: 'Practice Care Coordinator',
      org: 'Downtown Physician Group',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      desc: 'Triages cases, unblocks missing info, resolves PAs, and routes to attending physicians.'
    },
    {
      role: 'PROVIDER',
      name: 'Dr. Sarah Wilson, MD',
      title: 'Attending Physician',
      org: 'Downtown Physician Group',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      desc: 'Reviews clinical summaries, evaluates AI recommendations, and authorizes refills.'
    },
    {
      role: 'ADMIN',
      name: 'Marcus Vance',
      title: 'Director of Clinical Operations',
      org: 'Metropolitan Health System',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      desc: 'Monitors bottlenecks, tracks SLA compliance, manages integrations, and inspects audit trails.'
    }
  ];

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (role: UserRole) => {
    setLoading(true);
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Radiant Apple mesh backdrops & light pools */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-brand-400/20 via-sky-300/20 to-purple-300/10 blur-[130px]" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-teal-300/20 via-sky-400/15 to-indigo-400/10 blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-brand-300/15 via-indigo-300/15 to-rose-300/10 blur-[130px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Apple Style App Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 text-white shadow-xl shadow-brand-500/30 mb-4 p-0.5 border border-white/60">
          <div className="w-full h-full rounded-[22px] flex items-center justify-center bg-gradient-to-tr from-brand-600/90 to-sky-400/90 backdrop-blur-xs">
            <Pill className="w-8 h-8 text-white drop-shadow-sm" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          RxResolve
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Turn stuck refills into resolved care.
        </p>

        {/* Demo environment frosted pill */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-subtle text-amber-800 border border-amber-300/60 text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Demo Environment • Synthetic Healthcare Data</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 glass-card p-6 sm:p-8 rounded-3xl shadow-glass-modal border border-white/80">
          {/* Left: 1-Click Demo Persona Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Demo Role
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Choose an authenticated healthcare persona to experience role-specific workflows:
            </p>

            <div className="space-y-2.5">
              {demoPersonas.map((p) => (
                <button
                  key={p.role}
                  onClick={() => handlePersonaSelect(p.role)}
                  className="w-full text-left p-3 rounded-2xl glass-card-interactive transition-all duration-200 flex items-center gap-3.5 group shadow-xs border border-white/80"
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-700 border border-slate-200/60 font-semibold">
                        {p.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-brand-700 truncate">{p.title}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.org}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 shrink-0 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Standard Healthcare Login */}
          <div className="md:border-l md:border-slate-200/60 md:pl-7 flex flex-col justify-between pt-4 md:pt-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-slate-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Standard Sign In
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Sign in with organizational credentials (JWT authenticated):
              </p>

              <form onSubmit={handleStandardLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 apple-btn-primary py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 text-[11px] text-slate-500 glass-card-subtle p-3 rounded-xl">
              <span className="font-semibold text-slate-700">Quick Test Credentials:</span>
              <br />
              <code className="text-brand-700 font-mono font-medium">practice@rxresolve.demo</code> / <code className="text-brand-700 font-mono font-medium">demo123</code>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          RxResolve Refill Orchestration Platform • Designed for Pharmacies, Health Systems & Physician Practices
        </p>
      </div>
    </div>
  );
};
