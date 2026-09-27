import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { KnowledgeDoc } from '../types';
import {
  BookOpen,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle,
  Tag,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getKnowledge();
        setDocs(Array.isArray(res) ? res : (res && res.documents) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ['ALL', 'Practice SOPs', 'Administrative Rules', 'Internal Workflow Rules'];

  const filteredDocs = docs.filter((d) => {
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.source_name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Knowledge Base & RAG Index
            </h1>
            <span className="text-[11px] bg-brand-500/10 text-brand-700 font-mono px-2.5 py-0.5 rounded-full font-bold border border-brand-500/20 backdrop-blur-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" />
              RAG GROUNDED
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-10.5">
            Clinical practice SOPs, administrative rules, and SLA policies retrieved by RxResolve AI for operational answers
          </p>
        </div>

        <div className="glass-card-subtle px-3.5 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 font-medium">
          <Layers className="w-4 h-4 text-brand-600" />
          <span>{filteredDocs.length} Active Protocol Documents</span>
        </div>
      </div>

      {/* Search and Category Frosted Glass Bar */}
      <div className="glass-card p-4 rounded-2xl space-y-3.5 shadow-glass">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SOPs by clinical protocol, blocker rule, or keyword (e.g. '0 refills', 'prior authorization', 'SLA', 'missing info')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-inner"
          />
        </div>

        {/* Apple Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/60 rounded-xl border border-slate-200/50 backdrop-blur-md overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {cat === 'ALL' ? 'All Knowledge Documents' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Frosted Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="glass-card-interactive rounded-2xl p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100/80 text-slate-700 border border-slate-200/80 backdrop-blur-xs">
                  {doc.category}
                </span>
                <span className="text-[10px] text-brand-700 font-semibold font-mono bg-brand-50/80 px-2.5 py-0.5 rounded-full border border-brand-200/80 backdrop-blur-xs">
                  Source: {doc.source_name}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug tracking-tight">
                {doc.title}
              </h3>

              <div className="glass-card-subtle p-3.5 rounded-xl text-xs text-slate-700 leading-relaxed border border-white/60">
                {doc.content}
              </div>
            </div>

            {/* Keywords and Version */}
            <div className="pt-3 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3 h-3 text-slate-400" />
                {doc.keywords?.slice(0, 4).map((kw, i) => (
                  <span
                    key={i}
                    className="bg-white/80 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200/60 shadow-2xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <span className="font-mono text-slate-400 font-medium">v2.4 Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
