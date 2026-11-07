import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Search,
  Filter,
  MapPin,
  Tag,
  Star,
  CheckCircle2,
  DollarSign,
  Send,
  X,
  Sparkles,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BrowsePage() {
  const { t } = useTranslation();
  const { currentUser, triggerGlobalRefresh } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchMaterial, setSearchMaterial] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [freeOnly, setFreeOnly] = useState(false);

  // Offer Modal
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState('');
  const offerModalRef = useRef(null);

  // Keyboard accessibility & scroll lock for Offer Modal
  useEffect(() => {
    if (!offerModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOfferModalOpen(false);
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    offerModalRef.current?.focus();

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [offerModalOpen]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        user_lat: currentUser?.lat || 15.9042,
        user_lng: currentUser?.lng || 80.4674,
      };

      if (searchMaterial) params.material = searchMaterial;
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      if (radiusKm) params.radius_km = parseFloat(radiusKm);
      if (selectedCondition) params.condition = selectedCondition;
      if (freeOnly) params.free_only = true;

      const data = await api.searchListings(params);
      // Filter category in-memory if set
      const filtered = selectedCategory
        ? data.filter(d => d.category === selectedCategory)
        : data;

      setListings(filtered);
    } catch (err) {
      setError(err.message || 'Failed to search listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [currentUser, selectedCategory, selectedCondition, freeOnly]);

  const handleOpenOfferModal = (item) => {
    setSelectedListing(item);
    setOfferPrice(item.is_free ? '0' : item.price.toString());
    setOfferMessage(`Interested in taking this ${item.material} for immediate pickup.`);
    setOfferSuccess('');
    setError('');
    setOfferModalOpen(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setSubmittingOffer(true);
      setError('');
      await api.submitOffer({
        listing_id: selectedListing.id,
        buyer_id: currentUser.id,
        price: parseFloat(offerPrice) || 0.0,
        message: offerMessage.trim() || null,
      });

      setOfferSuccess('Offer submitted successfully! Seller has been notified.');
      triggerGlobalRefresh();
      setTimeout(() => {
        setOfferModalOpen(false);
        setOfferSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('browse.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            {t('browse.subtitle')}
          </p>
        </div>

        <Link
          to="/wanted"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-950 text-xs font-bold hover:bg-blue-100 transition-colors shadow-2xs"
        >
          <PlusCircle className="w-4 h-4 text-blue-700" />
          <span>Post a Wanted Request</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Search input + button */}
        <form onSubmit={(e) => { e.preventDefault(); fetchSearchResults(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={t('browse.search_placeholder')}
              value={searchMaterial}
              onChange={(e) => setSearchMaterial(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 text-xs">
          
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-slate-50 font-medium text-slate-900"
            >
              <option value="">{t('browse.filter_category')}</option>
              <option value="construction">Construction & Masonry</option>
              <option value="tiles">Tiles & Granite</option>
              <option value="wood">Timber & Wood</option>
              <option value="furniture">Furniture</option>
              <option value="metals">Metals & Steel</option>
              <option value="plastics">Plastics & Pipes</option>
              <option value="electronics">Electronics & Wiring</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-slate-50 font-medium text-slate-900"
            >
              <option value="">{t('browse.filter_condition')}</option>
              <option value="new">New / Unused</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor (Recycling)</option>
            </select>
          </div>

          {/* Max Budget */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('browse.filter_budget')}</label>
            <input
              type="number"
              placeholder="e.g. 3000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={fetchSearchResults}
              className="w-full rounded-xl border border-slate-300 p-2 bg-slate-50 font-medium text-slate-900"
            />
          </div>

          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">{t('browse.filter_radius')}</label>
              <span className="text-[11px] font-bold text-eco-800">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              onMouseUp={fetchSearchResults}
              onTouchEnd={fetchSearchResults}
              className="w-full accent-eco-700 cursor-pointer"
            />
          </div>

          {/* Free donations only checkbox */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 pt-4 sm:pt-6">
            <input
              type="checkbox"
              id="browseFreeCheck"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="w-4 h-4 text-eco-700 rounded border-slate-300 focus:ring-eco-500"
            />
            <label htmlFor="browseFreeCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
              {t('browse.filter_free_only')}
            </label>
          </div>

        </div>

      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Searching materials in radius...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">{t('browse.no_listings')}</p>
          <p className="text-xs text-slate-600 font-medium">Try adjusting your budget or increasing the search radius.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image & Badges */}
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Price Tag Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-black px-3 py-1 rounded-full shadow-md ${
                      item.is_free ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {item.is_free ? t('browse.free_badge') : `₹${item.price}`}
                    </span>
                  </div>

                  {/* Distance Pill */}
                  {item.distance_km !== undefined && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 shadow-xs flex items-center gap-1 border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-eco-700" />
                      <span>{item.distance_km} km away</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="uppercase font-bold tracking-wider text-[10px] text-eco-900 bg-eco-100 border border-eco-200 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{item.seller_rating || 4.8}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-eco-800 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-700 font-medium">
                    Quantity: <strong>{item.quantity} {item.unit}</strong> • Condition: <span className="capitalize font-semibold">{item.condition}</span>
                  </p>

                  <p className="text-[11px] text-slate-600 font-medium">
                    Seller: <span className="font-semibold text-slate-800">{item.seller_name}</span> ({item.seller_city})
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleOpenOfferModal(item)}
                  className="w-full py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t('browse.make_offer_btn')}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Offer Submission Modal */}
      {offerModalOpen && selectedListing && (
        <div
          onClick={() => setOfferModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            ref={offerModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 outline-hidden"
          >
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 id="offer-modal-title" className="text-sm font-bold text-slate-900">Make an Offer</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedListing.title}</p>
              </div>
              <button
                onClick={() => setOfferModalOpen(false)}
                aria-label="Close offer modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {offerSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{offerSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Your Offer Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    required
                    className="w-full pl-8 text-sm font-bold rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Listed Price: {selectedListing.is_free ? 'Free' : `₹${selectedListing.price}`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Message / Pickup Arrangement Note
                </label>
                <textarea
                  rows={2}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500">
                Rule: One active offer per listing. Exact pickup address will be revealed once the seller accepts your offer.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2.5 rounded-xl bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingOffer ? 'Submitting...' : 'Send Offer to Seller'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
