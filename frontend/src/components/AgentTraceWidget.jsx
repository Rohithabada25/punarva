import React, { useState } from 'react';
import { Eye, BookOpen, DollarSign, CheckCircle2, Clock, Cpu, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function AgentTraceWidget({ traces = [], isRunning = false, activeStep = 0 }) {
  const [expanded, setExpanded] = useState(true);

  const agentConfig = {
    'Vision Agent': {
      icon: Eye,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description: 'Gemini Vision model analyzing image features, condition & hazard detection',
    },
    'Reuse Agent (RAG)': {
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'ChromaDB RAG vector retrieval & BIS standard guidelines recommendation',
    },
    'Pricing Agent': {
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Secondary salvage valuation engine using condition multiplier matrix',
    },
    'Matching Agent': {
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description: 'Semantic vector similarity + Haversine distance proximity ranker',
    },
    'Negotiation Agent': {
      icon: DollarSign,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'Proximity and offer price optimizer',
    },
    'Fallback Agent': {
      icon: AlertCircle,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      description: 'Local recycler directory & DIY circular upcycling alternative finder',
    },
  };

  const totalDuration = traces.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Header bar */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-eco-600 text-white flex items-center justify-center shadow-sm">
            <Cpu className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Agentic AI Pipeline Trace
              </span>
              {isRunning && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">
                  Running...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              LangGraph Orchestrated Agents • Total: {totalDuration} ms
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Traces List */}
      {expanded && (
        <div className="p-4 space-y-3">
          {traces.map((trace, idx) => {
            const conf = agentConfig[trace.agent] || {
              icon: Cpu,
              color: 'text-slate-600 bg-slate-50 border-slate-200',
              description: '',
            };
            const Icon = conf.icon;

            const isMocked = trace.status === 'mocked';
            const isCached = trace.status === 'cached';
            const isSuccess = trace.status === 'success';

            return (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all shadow-xs"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${conf.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {trace.agent}
                      </span>
                      {isCached && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                          CACHED
                        </span>
                      )}
                      {isMocked && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          ⚠️ Mocked / Default Result
                        </span>
                      )}
                      {isSuccess && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{trace.duration_ms}ms</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 mt-0.5 font-medium">
                    {trace.summary}
                  </p>
                  {conf.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {conf.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* If currently running and pending more agents */}
          {isRunning && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/40 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700">
                <Cpu className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900">Executing Next Agent...</p>
                <p className="text-[11px] text-blue-700">Communicating with Gemini model...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
