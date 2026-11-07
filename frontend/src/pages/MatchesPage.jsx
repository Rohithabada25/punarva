import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Users,
  Building2,
  MapPin,
  DollarSign,
  Tag,
  ArrowRight,
  AlertCircle,
  Recycle,
  Sparkles,
  Phone,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export default function MatchesPage() {
  const { t } = useTranslation();
  const { listingId } = useParams();
  const { language } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [listingRes, matchesRes] = await Promise.all([
          api.getListing(listingId),
          api.getMatches(listingId, language),
        ]);
        setListing(listingRes);
        setMatchData(matchesRes);
      } catch (err) {
        setError(err.message || 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [listingId, language]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-700">Matching Agent Analyzing Potential Buyers...</p>
        <p className="text-xs text-slate-400 mt-1">Comparing semantic vectors and calculating Haversine distance...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-sm font-bold text-red-600">{error || 'Listing not found'}</p>
        <Link to="/" className="text-xs font-bold text-eco-700 underline mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Listing Summary Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-eco-100 text-eco-800">
            Material Listed
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {listing.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {listing.quantity} {listing.unit} • {listing.is_free ? 'Free Donation' : `₹${listing.price}`} • {listing.condition} condition
          </p>
        </div>

        <button
          onClick={() => navigate(`/offers?listing=${listing.id}`)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{t('matches.view_offers')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* MATCHES CASE: Suitable buyers exist */}
      {matchData?.has_matches ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-eco-600" />
              <span>{t('matches.title')} ({matchData.matches.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('matches.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchData.matches.map((match) => (
              <div
                key={match.buyer_id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-eco-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        match.is_org ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.is_org ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{match.buyer_name}</h3>
                        <p className="text-[11px] text-slate-400">{match.city}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-50 text-eco-800 border border-eco-200">
                      {Math.round(match.match_score * 100)}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Proximity</p>
                      <p className="font-semibold text-slate-800">{match.distance_km} km away</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Budget</p>
                      <p className="font-semibold text-slate-800">₹{match.budget}</p>
                    </div>
                  </div>

                  <p className="text-xs text-eco-900 font-semibold bg-eco-50/60 p-2 rounded-lg border border-eco-100">
                    💡 {match.match_reason}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Needs ~{match.requested_qty} {listing.unit}</span>
                  <span className="text-eco-700 font-bold flex items-center gap-1">
                    Buyer notified in-app <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* NO-MATCH FALLBACK WORKFLOW */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-amber-900">
                {t('matches.no_matches_title')}
              </h2>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {t('matches.no_matches_subtitle')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Recycle className="w-5 h-5 text-eco-600" />
              <span>{t('matches.alternatives_title')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep material in the circular loop with vetted facilities around Bapatla & Guntur:
            </p>
          </div>

          <div className="space-y-3">
            {matchData?.fallbacks?.map((fb, idx) => {
              const isRecycler = fb.type === 'recycler';
              const isDonation = fb.type === 'donation';
              const isDiy = fb.type === 'diy';

              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-eco-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isRecycler ? 'bg-blue-100 text-blue-800' :
                        isDonation ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isRecycler ? t('matches.type_recycler') :
                         isDonation ? t('matches.type_donation') : t('matches.type_diy')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{fb.name}</h4>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {fb.description}
                    </p>

                    {fb.location && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{fb.location}</span>
                      </p>
                    )}
                  </div>

                  {fb.contact && (
                    <div className="shrink-0 flex items-center gap-2">
                      <a
                        href={`tel:${fb.contact}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-eco-600" />
                        <span>{fb.contact}</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
