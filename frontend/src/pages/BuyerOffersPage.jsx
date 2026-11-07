import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusStepper from '../components/StatusStepper';
import DisputeModal from '../components/DisputeModal';
import CertificateModal from '../components/CertificateModal';
import {
  Tag,
  Clock,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowRight,
  Send,
  Check,
  RotateCcw
} from 'lucide-react';

export default function BuyerOffersPage() {
  const { t } = useTranslation();
  const { currentUser, refreshKey, triggerGlobalRefresh } = useAuth();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const targetListingId = searchParams.get('listingId');

  const [offersList, setOffersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCounterFormId, setActiveCounterFormId] = useState(null);

  // Counter proposal form fields
  const [counterDate, setCounterDate] = useState('');
  const [counterWindow, setCounterWindow] = useState('10:00 AM - 1:00 PM');
  const [counterNote, setCounterNote] = useState('');

  // Modals
  const [disputeListingId, setDisputeListingId] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certListing, setCertListing] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    async function loadOffers() {
      try {
        setLoading(true);
        const allListings = await api.getListings();
        const myActiveOffers = [];
        for (const l of allListings) {
          const lOffers = await api.getOffers(l.id);
          const myOffer = lOffers.find((o) => o.buyer_id === currentUser.id);
          if (myOffer) {
            myActiveOffers.push({
              offer: myOffer,
              listing: l,
            });
          }
        }
        setOffersList(myActiveOffers);
      } catch (err) {
        console.error('Failed to load buyer offers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, [currentUser, refreshKey]);

  const handleWithdraw = async (offerId) => {
    try {
      setActionLoading(true);
      await api.withdrawOffer(offerId);
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error withdrawing offer: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptPickup = async (listingId) => {
    try {
      setActionLoading(true);
      await api.acceptPickup(listingId, {
        actor_role: 'buyer',
        actor_id: currentUser.id,
      });
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error accepting pickup schedule: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCounterProposal = async (e, listingId) => {
    e.preventDefault();
    if (!counterDate) {
      alert('Please select a date for your proposed pickup.');
      return;
    }
    try {
      setActionLoading(true);
      await api.counterPickup(listingId, {
        pickup_date: counterDate,
        pickup_window: counterWindow,
        pickup_note: counterNote.trim() || 'Buyer suggested another pickup time.',
        actor_role: 'buyer',
        actor_id: currentUser.id,
      });
      setActiveCounterFormId(null);
      setCounterDate('');
      setCounterNote('');
      triggerGlobalRefresh();
    } catch (err) {
      alert('Error submitting counter-proposal: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyerConfirm = async (listingId) => {
    try {
      setActionLoading(true);
      const res = await api.confirmExchange(listingId, 'buyer');
      triggerGlobalRefresh();
      if (res.status === 'completed') {
        setCertListing(res);
        setCertModalOpen(true);
      }
    } catch (err) {
      alert('Error confirming handover: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading your offers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Active Offers & Exchanges
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          Track offers you have submitted, negotiate pickup schedules, and confirm material handovers.
        </p>
      </div>

      {offersList.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">You haven't submitted any material offers yet.</p>
          <Link
            to="/browse"
            className="px-6 py-2.5 rounded-xl bg-eco-700 text-white text-xs font-bold shadow-md hover:bg-eco-800 inline-block"
          >
            Browse Available Materials
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {offersList.map(({ offer, listing }) => {
            const isHighlighted = targetListingId && parseInt(targetListingId, 10) === listing.id;

            return (
              <div
                key={offer.id}
                id={`offer-card-${listing.id}`}
                className={`bg-white rounded-3xl border p-6 shadow-xs space-y-5 transition-all ${
                  isHighlighted
                    ? 'border-eco-500 ring-2 ring-eco-400 shadow-md'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        offer.status === 'accepted'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : offer.status === 'declined'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : offer.status === 'withdrawn'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      Offer Status: {offer.status}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{listing.title}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Seller: <strong className="text-slate-800">{listing.seller_name}</strong> ({listing.seller_city}) • Listed Price: ₹{listing.price}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 font-medium">Your Offered Price</p>
                    <p className="text-xl font-black text-slate-900">₹{offer.price}</p>
                  </div>
                </div>

                {/* Status Stepper */}
                <StatusStepper
                  status={listing.status}
                  sellerConfirmed={listing.seller_confirmed}
                  buyerConfirmed={listing.buyer_confirmed}
                  disputeReason={listing.dispute_reason}
                  disputeNote={listing.dispute_note}
                  pickupProposedBy={listing.pickup_proposed_by}
                />

                {/* Status: ACCEPTED (Waiting for seller's pickup proposal) */}
                {listing.status === 'accepted' && (
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-purple-900">
                      <CheckCircle2 className="w-4 h-4 text-purple-700" />
                      <span>Offer Accepted by Seller!</span>
                    </div>
                    <p className="text-purple-900 font-medium">
                      The seller accepted your offer. They will propose a pickup date and time window shortly.
                    </p>
                    <p className="text-slate-600 font-medium pt-1">
                      Pickup Area: Near GBC Road, {listing.seller_city || 'Bapatla'}, Andhra Pradesh
                    </p>
                  </div>
                )}

                {/* Status: PICKUP PROPOSED (Pickup negotiation in action) */}
                {listing.status === 'pickup_proposed' && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-4">
                    {listing.pickup_proposed_by !== 'buyer' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <Calendar className="w-4 h-4 text-amber-700" />
                            <span className="text-sm">Seller accepted: please confirm pickup</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            Action Needed
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                          <p className="text-slate-900 font-bold">
                            Proposed Date & Time: <span className="text-eco-800">{listing.pickup_date} ({listing.pickup_window})</span>
                          </p>
                          {listing.pickup_note && (
                            <p className="text-slate-700 font-medium italic">
                              Seller Note: "{listing.pickup_note}"
                            </p>
                          )}
                          <p className="text-slate-600 font-medium text-[11px] pt-1">
                            Location: Near GBC Road, {listing.seller_city || 'Bapatla'}, Andhra Pradesh
                          </p>
                        </div>

                        {/* Two required negotiation buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcceptPickup(listing.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-eco-700 hover:bg-eco-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept pickup</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCounterFormId(
                                activeCounterFormId === listing.id ? null : listing.id
                              );
                              setCounterDate(listing.pickup_date || '');
                              setCounterWindow(listing.pickup_window || '10:00 AM - 1:00 PM');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs transition-colors"
                          >
                            <RotateCcw className="w-4 h-4 text-amber-700" />
                            <span>Suggest another time</span>
                          </button>
                        </div>

                        {/* Inline counter-proposal form */}
                        {activeCounterFormId === listing.id && (
                          <form
                            onSubmit={(e) => handleSendCounterProposal(e, listing.id)}
                            className="mt-3 p-4 bg-white rounded-xl border border-amber-300 space-y-3"
                          >
                            <p className="text-xs font-bold text-slate-900">
                              Suggest Alternative Pickup Schedule:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Your Preferred Date
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={counterDate}
                                  onChange={(e) => setCounterDate(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-slate-300 p-2 font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Time Window
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={counterWindow}
                                  onChange={(e) => setCounterWindow(e.target.value)}
                                  placeholder="e.g. 2:00 PM - 5:00 PM"
                                  className="w-full text-xs rounded-xl border border-slate-300 p-2 font-medium"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Note / Reason for Counter-Proposal
                              </label>
                              <input
                                type="text"
                                value={counterNote}
                                onChange={(e) => setCounterNote(e.target.value)}
                                placeholder="e.g. Arranging vehicle pickup, morning works better"
                                className="w-full text-xs rounded-xl border border-slate-300 p-2 font-medium"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveCounterFormId(null)}
                                className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Counter-Proposal</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-amber-950">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>Counter-Proposal Sent</span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          You suggested: <strong className="text-amber-900">{listing.pickup_date} ({listing.pickup_window})</strong>.
                        </p>
                        {listing.pickup_note && (
                          <p className="text-slate-600 italic">Your note: "{listing.pickup_note}"</p>
                        )}
                        <p className="text-xs text-slate-500 pt-1">
                          Awaiting seller's acceptance or updated proposal.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status: PICKUP ARRANGED (Both agreed, coordinate offline handover) */}
                {(listing.status === 'pickup_arranged' || listing.status === 'completed') && (
                  <div className="p-4 rounded-2xl bg-eco-50/70 border border-eco-200 text-xs text-eco-950 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-eco-950">
                        <MapPin className="w-4 h-4 text-eco-700" />
                        <span className="text-sm">Agreed Pickup Schedule & Exact Address</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        Pickup Arranged
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-800">
                      <p className="font-semibold">
                        Scheduled Window: <span className="text-eco-900 font-bold">{listing.pickup_date} ({listing.pickup_window})</span>
                      </p>
                      <p className="text-slate-700 font-medium">
                        Exact Location: Near GBC Road, {listing.seller_city || 'Bapatla'}, Andhra Pradesh
                      </p>
                      {listing.pickup_note && (
                        <p className="italic text-slate-600">Instructions: "{listing.pickup_note}"</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-eco-200/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
                      <span className="text-slate-700 font-medium">
                        Seller Confirmation State: <strong className={listing.seller_confirmed ? 'text-emerald-700' : 'text-slate-600'}>
                          {listing.seller_confirmed ? 'Confirmed ✓' : 'Awaiting Seller Confirmation'}
                        </strong>
                      </span>
                      <span className="text-slate-700 font-medium">
                        Your Confirmation State: <strong className={listing.buyer_confirmed ? 'text-emerald-700' : 'text-slate-600'}>
                          {listing.buyer_confirmed ? 'Confirmed ✓' : 'Pending Your Confirmation'}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {/* Withdraw Offer if still pending */}
                  {offer.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleWithdraw(offer.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                    >
                      Withdraw Offer
                    </button>
                  )}

                  {/* Dual Confirmation Actions: ONLY available after pickup_arranged */}
                  {listing.status === 'pickup_arranged' && (
                    <div className="flex flex-wrap items-center justify-between w-full gap-3">
                      <button
                        type="button"
                        onClick={() => setDisputeListingId(listing.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Report a Problem</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBuyerConfirm(listing.id)}
                        disabled={actionLoading || listing.buyer_confirmed}
                        className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          listing.buyer_confirmed
                            ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default'
                            : 'bg-eco-700 hover:bg-eco-800 text-white shadow-md'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {listing.buyer_confirmed
                            ? '✓ Handover Confirmed by You'
                            : 'Confirm Handover Completed'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Completed Reuse Certificate */}
                  {listing.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCertListing(listing);
                        setCertModalOpen(true);
                      }}
                      className="ml-auto px-5 py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Reuse Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Problem Report Modal */}
      {disputeListingId && (
        <DisputeModal
          isOpen={Boolean(disputeListingId)}
          onClose={() => setDisputeListingId(null)}
          listingId={disputeListingId}
          userRole="buyer"
          onDisputeRaised={() => triggerGlobalRefresh()}
        />
      )}

      {/* Reuse Certificate Modal */}
      {certListing && (
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          userName={currentUser.name}
          listingTitle={certListing.title}
          kgDiverted={certListing.weight_kg || certListing.quantity * 2}
          co2Saved={Math.round((certListing.weight_kg || certListing.quantity * 2) * 0.4)}
          moneySaved={certListing.price || 500}
          completedDate={certListing.completed_at}
          certId={`PUN-2026-AP-${certListing.id}`}
        />
      )}
    </div>
  );
}
