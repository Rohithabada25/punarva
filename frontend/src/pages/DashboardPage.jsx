import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  UploadCloud,
  Search,
  Tag,
  Award,
  Bell,
  ArrowRight,
  TrendingUp,
  Leaf,
  DollarSign,
  AlertCircle,
  MapPin,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser, refreshKey } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await api.getUserDashboard(currentUser.id);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [currentUser, refreshKey]);

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('dashboard.greeting')}, {currentUser.name}! 👋
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-eco-100 text-eco-800 border border-eco-200">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Serving {currentUser.city} & Greater Guntur District • Preferred: {currentUser.preferred_language.toUpperCase()}</span>
          </p>
        </div>

        {/* Impact Pill quick highlight */}
        {dashboardData && (
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-eco-100 text-eco-800 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5 text-eco-700" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Impact Achieved</p>
              <p className="text-xs font-black text-slate-900">
                {dashboardData.stats?.kg_diverted || 0} kg Diverted • {dashboardData.stats?.co2_saved || 0} kg CO₂
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CORE UX REQUIREMENT: 2 LARGE CLEAR CALL-TO-ACTION BUTTONS (High-contrast WCAG >= 4.5:1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sell / Donate CTA */}
        <div
          onClick={() => navigate('/upload')}
          className="group relative overflow-hidden rounded-3xl bg-eco-800 bg-gradient-to-br from-emerald-700 via-eco-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-eco-900/30 border border-emerald-600/40 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                  {t('dashboard.cta_sell')}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-300 text-emerald-950 uppercase tracking-wider shadow-xs">
                  ~15 sec AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1.5 max-w-sm leading-relaxed">
                Photo → AI surveys quantity, RAG suggests reuse, and instant buyers are matched.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white group-hover:translate-x-1.5 transition-transform">
              <span>Start Material Survey</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* Background Decorative Icon */}
          <Leaf className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 rotate-12 pointer-events-none" />
        </div>

        {/* Find / Buy Material CTA */}
        <div
          onClick={() => navigate('/browse')}
          className="group relative overflow-hidden rounded-3xl bg-blue-900 bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/30 border border-blue-600/40 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                  {t('dashboard.cta_buy')}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-300 text-blue-950 uppercase tracking-wider shadow-xs">
                  Search & Save
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1.5 max-w-sm leading-relaxed">
                Filter by material, budget, location radius, condition, and free community donations.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white group-hover:translate-x-1.5 transition-transform">
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4 text-blue-300" />
            </div>
          </div>

          <Search className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 rotate-12 pointer-events-none" />
        </div>

      </div>

      {/* Summary KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{dashboardData.stats?.active_listings || 0}</p>
              <p className="text-xs font-bold text-slate-600">{t('dashboard.active_listings')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{dashboardData.stats?.new_offers || 0}</p>
              <p className="text-xs font-bold text-slate-600">{t('dashboard.new_offers')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{dashboardData.stats?.unread_notifications || 0}</p>
              <p className="text-xs font-bold text-slate-600">{t('dashboard.unread_alerts')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">₹{dashboardData.stats?.money_saved || 0}</p>
              <p className="text-xs font-bold text-slate-600">{t('dashboard.money_saved')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended For You Section with Match Reasons */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-eco-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {t('dashboard.recommended_title')}
            </h2>
          </div>
          <Link to="/browse" className="text-xs font-bold text-eco-700 hover:text-eco-800 flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {dashboardData?.recommendations?.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-4">{t('dashboard.no_recommendations')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.recommendations?.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/browse')}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-slate-50/70 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 rounded-xl overflow-hidden bg-slate-200 relative mb-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md ${
                        item.is_free ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        {item.is_free ? 'FREE DONATION' : `₹${item.price}`}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-eco-800 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-700 mt-0.5 font-medium">
                    Quantity: <strong>{item.quantity} {item.unit}</strong> • <span className="capitalize">{item.condition} condition</span>
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-eco-900 font-bold line-clamp-1">
                    💡 {item.match_reason}
                  </span>
                  <span className="text-slate-600 shrink-0 font-semibold">{item.seller_city}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
