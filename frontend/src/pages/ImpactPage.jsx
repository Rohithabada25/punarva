import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import CertificateModal from '../components/CertificateModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import {
  Award,
  Leaf,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ImpactPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    async function loadImpact() {
      try {
        setLoading(true);
        const data = await api.getUserImpact(currentUser.id);
        setImpactData(data);
      } catch (err) {
        console.error('Failed to load impact:', err);
      } finally {
        setLoading(false);
      }
    }
    loadImpact();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Calculating environmental metrics...</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = impactData?.history?.map((item, idx) => ({
    name: item.material || `Exchange ${idx + 1}`,
    co2: item.co2_saved,
    kg: item.kg_diverted,
    date: new Date(item.completed_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('impact.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('impact.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedHistoryItem(null);
            setCertModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-black shadow-md transition-all hover:scale-[1.02]"
        >
          <Award className="w-4 h-4 text-eco-200" />
          <span>{t('impact.view_certificate_btn')}</span>
        </button>
      </div>

      {/* 4 Cumulative Impact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total kg Diverted */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('impact.total_diverted')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {impactData?.total_kg_diverted || 0} <span className="text-sm font-semibold text-slate-500">kg</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Zero-landfill diversion
          </p>
        </div>

        {/* Total CO2 Saved */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('impact.total_co2')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {impactData?.total_co2_saved || 0} <span className="text-sm font-semibold text-slate-500">kg</span>
          </p>
          <p className="text-[11px] text-blue-700 font-semibold">
            Embodied emissions avoided
          </p>
        </div>

        {/* Total Money Saved */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('impact.total_savings')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            ₹{impactData?.total_money_saved || 0}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold">
            Economic reuse value
          </p>
        </div>

        {/* Materials Reused */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('impact.total_items')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {impactData?.items_reused || 0}
          </p>
          <p className="text-[11px] text-purple-700 font-semibold">
            Completed exchanges
          </p>
        </div>

      </div>

      {/* CORE UX REQUIREMENT: VERIFIED VS ESTIMATED SEPARATION CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-eco-600" />
            <span>{t('impact.verified_vs_estimated')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict separation: Impact from unverified AI estimates carries an explicit "estimated" tag until physically weighed or seller verified.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Confirmed metrics card */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('impact.confirmed_data')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                100% VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-xl font-black text-emerald-950">
                  {impactData?.confirmed_metrics?.kg_diverted || 0} kg
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">Material Diverted</p>
              </div>
              <div>
                <p className="text-xl font-black text-emerald-950">
                  {impactData?.confirmed_metrics?.co2_saved || 0} kg
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">CO₂ Avoided</p>
              </div>
            </div>
          </div>

          {/* Estimated metrics card */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                {t('impact.estimated_data')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                AI ESTIMATE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-xl font-black text-amber-950">
                  {impactData?.estimated_metrics?.kg_diverted || 0} kg
                </p>
                <p className="text-[11px] text-amber-700 font-medium">Material Diverted</p>
              </div>
              <div>
                <p className="text-xl font-black text-amber-950">
                  {impactData?.estimated_metrics?.co2_saved || 0} kg
                </p>
                <p className="text-[11px] text-amber-700 font-medium">CO₂ Avoided</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart: Recharts Visualization */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-eco-600" />
            <span>{t('impact.timeline_chart_title')}</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="co2" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorCo2)" name="CO2 Saved (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Completed Exchange Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-eco-600" />
          <span>{t('impact.history_table_title')} ({impactData?.history?.length || 0})</span>
        </h2>

        {impactData?.history?.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">{t('impact.empty_history')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase font-bold text-slate-400">
                  <th className="py-3 px-2">Material / Listing</th>
                  <th className="py-3 px-2">Diverted</th>
                  <th className="py-3 px-2">CO₂ Avoided</th>
                  <th className="py-3 px-2">Saved Value</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {impactData?.history?.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-2">
                      <p className="font-bold text-slate-900">{row.title}</p>
                      <p className="text-[11px] text-slate-400">{row.material}</p>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-emerald-800">
                      {row.kg_diverted} kg
                    </td>
                    <td className="py-3.5 px-2 font-bold text-blue-800">
                      {row.co2_saved} kg
                    </td>
                    <td className="py-3.5 px-2 font-bold text-amber-800">
                      ₹{row.money_saved}
                    </td>
                    <td className="py-3.5 px-2">
                      {row.is_estimated ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Estimated
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={() => {
                          setSelectedHistoryItem(row);
                          setCertModalOpen(true);
                        }}
                        className="text-xs font-bold text-eco-700 hover:text-eco-800 underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reuse Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        userName={currentUser.name}
        listingTitle={selectedHistoryItem?.title || 'Community Material Salvage'}
        kgDiverted={selectedHistoryItem?.kg_diverted || impactData?.total_kg_diverted || 840}
        co2Saved={selectedHistoryItem?.co2_saved || impactData?.total_co2_saved || 126}
        moneySaved={selectedHistoryItem?.money_saved || impactData?.total_money_saved || 1800}
        completedDate={selectedHistoryItem?.completed_at}
        certId={`PUN-2026-AP-${selectedHistoryItem?.id || 'GLOBAL'}`}
      />

    </div>
  );
}
