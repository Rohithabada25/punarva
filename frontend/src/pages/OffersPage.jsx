import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusStepper from '../components/StatusStepper';
import DisputeModal from '../components/DisputeModal';
import CertificateModal from '../components/CertificateModal';
import {
  Tag,
  DollarSign,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Award,
  ArrowRight,
  User
} from 'lucide-react';

export default function OffersPage() {
  const { t } = useTranslation();
  const { currentUser, language, refreshKey, triggerGlobalRefresh } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [currentListing, setCurrentListing] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Pickup arrangement form
  const [pickupDate, setPickupDate] = useState('2026-11-10');
  const [pickupWindow, setPickupWindow] = useState('10:00 AM - 1:00 PM');
  const [pickupNote, setPickupNote] = useState('');

  // Modals
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Load seller's listings
  useEffect(() => {
    if (!currentUser) return;
    async function fetchListings() {
      try {
        setLoading(true);
        // If admin, show all listings, else show seller's listings
        const data = await api.getListings(currentUser.role === 'admin' ? {} : { seller_id: currentUser.id });
        setListings(data);

        // Preselect listing from URL query param or first listing
        const urlId = searchParams.get('listing') || searchParams.get('listingId');
        const targetId = urlId ? parseInt(urlId, 10) : (data.length > 0 ? data[0].id : null);
        setSelectedListingId(targetId);
      } catch (err) {
        setError(err.message || 'Failed to fetch listings');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [currentUser, searchParams, refreshKey]);

  // Load detail & ranked offers for selected listing
  useEffect(() => {
    if (!selectedListingId) {
      setCurrentListing(null);
      setOffers([]);
      return;
    }

    async function fetchOffers() {
      try {
        const [listingRes, offersRes] = await Promise.all([
          api.getListing(selectedListingId),
          api.getOffers(selectedListingId, language)
        ]);
        setCurrentListing(listingRes);
        setOffers(offersRes);
      } catch (err) {
        console.error('Failed to load offers:', err);
      }
    }
    fetchOffers();
  }, [selectedListingId, language, refreshKey]);

  const handleAcceptOffer = async (offerId) => {
    try {
      setActionLoading(true);
      await api.acceptOffer(offerId);
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error accepting offer: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      setActionLoading(true);
      await api.rejectOffer(offerId);
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error rejecting offer: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrangePickup = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.arrangePickup(selectedListingId, {
        pickup_date: pickupDate,
        pickup_window: pickupWindow,
        pickup_note: pickupNote || 'Loading assistance available at site'
      });
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error setting pickup: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      setActionLoading(true);
      const res = await api.confirmExchange(selectedListingId, 'seller');
      triggerGlobalRefresh();
      if (res.status === 'completed') {
        setCertModalOpen(true);
      }
    } catch (err) {
      alert('Error confirming exchange: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading Offers & Negotiation Ranking...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('offers.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('offers.subtitle')}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">You don't have any material listings yet.</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-2.5 rounded-xl bg-eco-700 text-white text-xs font-bold shadow-md hover:bg-eco-800"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Listings Selector */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Your Material Listings ({listings.length})
            </h2>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {listings.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedListingId(l.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedListingId === l.id
                      ? 'bg-eco-50/80 border-eco-500 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      l.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      l.status === 'disputed' ? 'bg-red-100 text-red-800' :
                      l.status === 'pickup_arranged' ? 'bg-blue-100 text-blue-800' :
                      l.status === 'accepted' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {l.status}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {l.is_free ? 'Free' : `₹${l.price}`}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{l.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {l.quantity} {l.unit} • {l.material}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Listing Detail, Status Stepper & Offers */}
          <div className="lg:col-span-2 space-y-6">
            
            {currentListing && (
              <>
                {/* Status Stepper */}
                <StatusStepper
                  status={currentListing.status}
                  sellerConfirmed={currentListing.seller_confirmed}
                  buyerConfirmed={currentListing.buyer_confirmed}
                  disputeReason={currentListing.dispute_reason}
                  disputeNote={currentListing.dispute_note}
                  pickupProposedBy={currentListing.pickup_proposed_by}
                />

                {/* Handover & Action Box: Propose Pickup (Initial or Countered) */}
                {currentListing.status === 'accepted' && (
                  <div className="bg-white p-6 rounded-3xl border border-purple-200 bg-purple-50/40 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                      <Clock className="w-5 h-5 text-purple-700" />
                      <span>{t('offers.arrange_pickup_btn')}</span>
                    </div>
                    <p className="text-xs text-purple-900 font-medium">
                      Offer accepted! Please propose an offline pickup date, time window, and loading instructions.
                    </p>

                    <form onSubmit={handleArrangePickup} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Pickup Date</label>
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          required
                          className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Time Window</label>
                        <input
                          type="text"
                          value={pickupWindow}
                          onChange={(e) => setPickupWindow(e.target.value)}
                          placeholder="e.g. 10:00 AM - 1:00 PM"
                          required
                          className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Loading Instructions / Gate Access</label>
                        <input
                          type="text"
                          value={pickupNote}
                          onChange={(e) => setPickupNote(e.target.value)}
                          placeholder="e.g. Loading area in front driveway, ring door bell"
                          className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          Send Pickup Proposal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Pickup Proposed State: Seller Review or Waiting */}
                {currentListing.status === 'pickup_proposed' && (
                  <div className="bg-white p-6 rounded-3xl border border-amber-300 bg-amber-50/40 shadow-xs space-y-4">
                    {currentListing.pickup_proposed_by === 'buyer' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                            <Clock className="w-5 h-5 text-amber-700" />
                            <span>Buyer Suggested Alternative Pickup Schedule</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            Action Needed
                          </span>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-1.5 text-xs">
                          <p className="font-bold text-slate-900">
                            Proposed Time: <span className="text-amber-900 font-black">{currentListing.pickup_date} ({currentListing.pickup_window})</span>
                          </p>
                          {currentListing.pickup_note && (
                            <p className="text-slate-700 italic">Buyer Note: "{currentListing.pickup_note}"</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setActionLoading(true);
                                await api.acceptPickup(currentListing.id, {
                                  actor_role: 'seller',
                                  actor_id: currentUser.id,
                                });
                                triggerGlobalRefresh();
                              } catch (err) {
                                alert(err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            disabled={actionLoading}
                            className="px-5 py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-sm transition-colors"
                          >
                            Accept Counter-Proposal
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const newDate = prompt("Enter revised pickup date (YYYY-MM-DD):", currentListing.pickup_date || "2026-11-12");
                              if (!newDate) return;
                              const newWindow = prompt("Enter revised time window:", currentListing.pickup_window || "11:00 AM - 2:00 PM");
                              try {
                                setActionLoading(true);
                                await api.counterPickup(currentListing.id, {
                                  pickup_date: newDate,
                                  pickup_window: newWindow || "10:00 AM - 1:00 PM",
                                  pickup_note: "Seller updated pickup schedule",
                                  actor_role: 'seller',
                                  actor_id: currentUser.id,
                                });
                                triggerGlobalRefresh();
                              } catch (err) {
                                alert(err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className="px-4 py-2.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold transition-colors"
                          >
                            Change Pickup Time
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>Pickup Schedule Proposed to Buyer</span>
                        </div>
                        <p className="text-slate-700 font-medium">
                          You proposed: <strong className="text-slate-900">{currentListing.pickup_date} ({currentListing.pickup_window})</strong>.
                        </p>
                        <p className="text-slate-500">
                          Awaiting buyer's confirmation or counter-proposal.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pickup Arranged State Actions */}
                {currentListing.status === 'pickup_arranged' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-eco-600" />
                        <h3 className="text-sm font-bold text-slate-900">{t('offers.pickup_arranged_title')}</h3>
                      </div>
                      <span className="text-xs font-bold text-eco-800 bg-eco-50 px-2.5 py-1 rounded-full border border-eco-200">
                        {currentListing.pickup_date} ({currentListing.pickup_window})
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Loading Note: {currentListing.pickup_note || 'Direct offline pickup arranged.'}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium space-y-1">
                      <p>Offline payment & physical handover: Verify item count with the buyer upon arrival.</p>
                      <p className="text-[11px] text-slate-500">
                        Buyer confirmation state: <strong className={currentListing.buyer_confirmed ? 'text-emerald-700' : 'text-slate-600'}>
                          {currentListing.buyer_confirmed ? 'Buyer has confirmed handover ✓' : 'Awaiting Buyer Confirmation'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setDisputeModalOpen(true)}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                      >
                        {t('offers.report_problem_btn')}
                      </button>

                      <button
                        onClick={handleConfirmCompletion}
                        disabled={actionLoading || currentListing.seller_confirmed}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          currentListing.seller_confirmed
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-eco-700 hover:bg-eco-800 text-white shadow-md'
                        }`}
                      >
                        {currentListing.seller_confirmed
                          ? '✓ Seller Confirmed Handover'
                          : t('offers.confirm_completion_btn')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed State Celebration Banner */}
                {currentListing.status === 'completed' && (
                  <div className="bg-emerald-800 bg-gradient-to-r from-emerald-700 to-eco-900 p-6 rounded-3xl text-white shadow-lg border border-emerald-600/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        <h3 className="text-base font-black">Exchange Successfully Completed!</h3>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium mt-1">
                        Both parties confirmed. Environmental impact calculated and accredited.
                      </p>
                    </div>
                    <button
                      onClick={() => setCertModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white text-eco-800 text-xs font-black shadow-sm hover:bg-eco-50 transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" />
                      <span>{t('impact.view_certificate_btn')}</span>
                    </button>
                  </div>
                )}

                {/* Offers List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-eco-600" />
                      <span>Incoming Offers ({offers.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400">Ranked by Negotiation Agent</span>
                  </div>

                  {offers.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 italic">
                      No offers received for this listing yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {offers.map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            offer.is_best_offer
                              ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-200 shadow-sm'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-slate-900">
                                  ₹{offer.price}
                                </span>
                                {offer.is_best_offer && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                                    <Sparkles className="w-3 h-3" />
                                    {t('offers.best_offer_badge')}
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  offer.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
                                  offer.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {offer.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-1 font-medium">
                                From: <strong>{offer.buyer_name}</strong> • {offer.buyer_city}
                              </p>
                              {offer.message && (
                                <p className="text-xs text-slate-700 italic mt-1 bg-white/60 p-2 rounded-lg border border-slate-100">
                                  "{offer.message}"
                                </p>
                              )}
                              {offer.negotiation_reason && (
                                <p className="text-[11px] text-amber-900 font-semibold mt-1">
                                  💡 {offer.negotiation_reason}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons for Pending Offers */}
                            {offer.status === 'pending' && currentListing.status === 'offer_received' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleRejectOffer(offer.id)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                                >
                                  {t('offers.reject')}
                                </button>
                                <button
                                  onClick={() => handleAcceptOffer(offer.id)}
                                  disabled={actionLoading}
                                  className="px-4 py-2 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-sm transition-colors"
                                >
                                  {t('offers.accept')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* Problem Report Modal */}
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        listingId={selectedListingId}
        userRole="seller"
        onDisputeRaised={() => triggerGlobalRefresh()}
      />

      {/* Reuse Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        userName={currentUser.name}
        listingTitle={currentListing?.title}
        kgDiverted={currentListing?.weight_kg || currentListing?.quantity * 2}
        co2Saved={Math.round((currentListing?.weight_kg || currentListing?.quantity * 2) * 0.4)}
        moneySaved={currentListing?.price || 500}
        completedDate={currentListing?.completed_at}
        certId={`PUN-2026-AP-${currentListing?.id}`}
      />

    </div>
  );
}
