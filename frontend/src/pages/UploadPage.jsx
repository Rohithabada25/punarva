import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AgentTraceWidget from '../components/AgentTraceWidget';
import {
  UploadCloud,
  Camera,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  DollarSign,
  Edit2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function UploadPage() {
  const { t } = useTranslation();
  const { currentUser, language, triggerGlobalRefresh } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Upload & Agent state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [agentTraces, setAgentTraces] = useState([]);
  const [isMockedResult, setIsMockedResult] = useState(false);

  // Survey Form state (auto-populated by AI, fully editable by seller)
  const [title, setTitle] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('construction');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pieces');
  const [weightKg, setWeightKg] = useState('');
  const [quantitySource, setQuantitySource] = useState('ai_estimate');
  const [quantityVerified, setQuantityVerified] = useState(false);
  const [confidence, setConfidence] = useState(0.85);
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [priceExplanation, setPriceExplanation] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [reuseRecommendation, setReuseRecommendation] = useState('');
  const [reuseSources, setReuseSources] = useState([]);
  const [hazardFlag, setHazardFlag] = useState(false);
  const [hazardNote, setHazardNote] = useState('');

  // Manual quantity toggle
  const [showManualOverride, setShowManualOverride] = useState(false);

  // Sample demo photos stored locally for instant, offline-reliable demo testing
  const sampleItems = [
    {
      name: 'sample_bricks',
      label: 'Red Clay Bricks',
      url: '/samples/bricks.jpg',
    },
    {
      name: 'sample_cement',
      label: 'Cement Bags',
      url: '/samples/cement_bag.jpg',
    },
    {
      name: 'sample_wood',
      label: 'Wooden Furniture',
      url: '/samples/wooden_furniture.jpg',
    },
    {
      name: 'sample_ewaste',
      label: 'E-Waste Electronics',
      url: '/samples/ewaste.jpg',
    },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    setError('');
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    runAnalysis(file);
  };

  const handleSelectSample = async (sample) => {
    try {
      setAnalyzing(true);
      setError('');
      setImagePreview(sample.url);

      // Fetch sample as blob from local static assets
      const res = await fetch(sample.url);
      if (!res.ok) throw new Error(`HTTP ${res.status} failed to load sample`);
      const blob = await res.blob();
      const file = new File([blob], `${sample.name}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);

      await runAnalysis(file);
    } catch (err) {
      setError('Could not load sample image: ' + err.message);
      setAnalyzing(false);
    }
  };

  const runAnalysis = async (file) => {
    try {
      setAnalyzing(true);
      setError('');
      setAgentTraces([
        {
          agent: 'Vision Agent',
          status: 'running',
          summary: 'Surveying image features, estimating volume & detecting condition...',
          duration_ms: 100,
        }
      ]);

      const data = await api.analyzeListing(file, language);

      const anyMocked = Boolean(data.is_mocked) || (data.agent_trace && data.agent_trace.some(t => t.status === 'mocked'));
      setIsMockedResult(anyMocked);

      // Auto-fill state from AI agents
      setMaterial(data.material_type || '');
      setTitle(`Salvaged ${data.material_type || 'Material'}`);
      setCategory(data.category || 'construction');
      setQuantity(data.estimated_quantity || 1);
      setUnit(data.unit || 'pieces');
      setConfidence(data.confidence || 0.85);
      setCondition(data.condition || 'good');
      setHazardFlag(Boolean(data.hazard_flag));
      setHazardNote(data.hazard_note || '');

      setPrice(data.suggested_price || 0);
      setPriceRange(data.price_range || { min: 0, max: 0 });
      setPriceExplanation(data.price_explanation || '');

      setReuseRecommendation(data.reuse_recommendation || '');
      setReuseSources(data.reuse_sources || []);

      setAgentTraces(data.agent_trace || []);
      setQuantitySource('ai_estimate');
      setQuantityVerified(false);
    } catch (err) {
      setError(err.message || 'Image analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!material) {
      setError('Please provide a material name.');
      return;
    }

    try {
      setPublishing(true);
      setError('');

      const payload = {
        seller_id: currentUser.id,
        title: title || `Salvaged ${material}`,
        material,
        category,
        quantity: parseFloat(quantity) || 1.0,
        unit,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        quantity_source: quantitySource,
        quantity_verified: quantityVerified,
        confidence,
        condition,
        price: isFree ? 0.0 : parseFloat(price) || 0.0,
        is_free: isFree,
        image_url: imagePreview || null,
        reuse_recommendation: reuseRecommendation,
        reuse_sources: reuseSources,
        hazard_flag: hazardFlag,
        hazard_note: hazardNote,
      };

      const created = await api.publishListing(payload);
      triggerGlobalRefresh();

      // Seamlessly transition to matches page!
      navigate(`/matches/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to publish listing');
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 lg:pb-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('upload.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          {t('upload.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-900 text-xs flex items-center gap-2 border border-red-300 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* Photo Upload Card / Drag & Drop */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            imagePreview
              ? 'border-eco-500 bg-eco-50/30'
              : 'border-slate-300 hover:border-eco-600 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 rounded-xl overflow-hidden shadow-md mb-3 relative group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                  Click to replace photo
                </div>
              </div>
              <p className="text-xs text-eco-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-eco-600" /> Photo uploaded successfully
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-eco-100 text-eco-800 flex items-center justify-center shadow-inner">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {t('upload.drag_drop')}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {t('upload.supported_formats')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Demo Sample Photos Selection */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-800 mr-1">
            {t('upload.sample_photos')}
          </span>
          {sampleItems.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 hover:bg-eco-50 hover:text-eco-950 hover:border-eco-600 transition-all shadow-xs"
            >
              {t(`upload.${sample.name}`)}
            </button>
          ))}
        </div>

      </div>

      {/* Agent Trace Widget */}
      {(analyzing || agentTraces.length > 0) && (
        <AgentTraceWidget traces={agentTraces} isRunning={analyzing} />
      )}

      {/* Mocked / Default Result Alert Banner */}
      {isMockedResult && !analyzing && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-medium flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <span className="uppercase tracking-wider text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded mr-2 shadow-xs">
              Mocked / Default Result
            </span>
            <span>AI fallback was used for this analysis. All survey fields below are fully editable.</span>
          </div>
        </div>
      )}

      {/* AI Results & Editable Form */}
      {material && !analyzing && (
        <form onSubmit={handlePublish} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-eco-600" />
                <span>{t('upload.ai_results_title')}</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                AI estimates are fully editable before publishing.
              </p>
            </div>

            {/* AI Confidence Badge */}
            <div className="flex items-center gap-2 bg-eco-50 px-3 py-1.5 rounded-full border border-eco-300">
              <span className="text-[11px] font-bold text-eco-900">
                Confidence: {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Hazard Alert Banner (if hazard_flag is true) */}
          {hazardFlag && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  {t('upload.hazard_warning')}
                </p>
                <p className="text-xs text-amber-900 mt-0.5 font-medium">
                  {hazardNote || 'Potential sharp edges, jagged metal, or heavy weight. Handle with protective gloves during loading.'}
                </p>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Listing Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
              />
            </div>

            {/* Material Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('upload.material_name')}
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('upload.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
              >
                <option value="construction">Construction & Masonry</option>
                <option value="tiles">Tiles & Granite</option>
                <option value="wood">Timber & Wood</option>
                <option value="furniture">Furniture</option>
                <option value="metals">Metals & Steel</option>
                <option value="plastics">Plastics & Pipes</option>
                <option value="electronics">Electronics & Wiring</option>
                <option value="other">Other Salvage</option>
              </select>
            </div>

            {/* Quantity with AI Probable Estimate Badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {t('upload.quantity')}
                  </label>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    {t('upload.probable_estimate_badge')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowManualOverride(!showManualOverride);
                    setQuantityVerified(true);
                    setQuantitySource('manual');
                  }}
                  className="text-xs font-bold text-eco-800 hover:text-eco-950 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('upload.manual_override_btn')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setQuantityVerified(true);
                      setQuantitySource('manual');
                    }}
                    required
                    className="w-full text-sm font-bold rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-eco-500"
                  />
                </div>
                <div>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-sm font-bold rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-eco-500"
                  >
                    <option value="pieces">pieces</option>
                    <option value="bags">bags</option>
                    <option value="tons">tons</option>
                    <option value="kg">kg</option>
                    <option value="sqft">sqft</option>
                    <option value="cft">cft</option>
                    <option value="sheets">sheets</option>
                    <option value="meters">meters</option>
                  </select>
                </div>
              </div>

              {/* Optional exact weight in kg */}
              {showManualOverride && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Exact Total Weight in Kilograms (Optional):
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 850"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-hidden focus:ring-2 focus:ring-eco-500"
                  />
                </div>
              )}
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('upload.condition')}
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 font-medium focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
              >
                <option value="new">New / Surplus unused</option>
                <option value="good">Good (minor handling signs)</option>
                <option value="fair">Fair (needs light cleaning/scraping)</option>
                <option value="poor">Poor (for scrap / recycling)</option>
              </select>
            </div>

            {/* Price with explanation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('upload.suggested_price')}
                </label>
                <span className="text-[11px] text-slate-600 font-bold">
                  Range: ₹{priceRange.min} - ₹{priceRange.max}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-600 font-bold">₹</span>
                <input
                  type="number"
                  disabled={isFree}
                  value={isFree ? 0 : price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 text-xs font-bold rounded-xl border border-slate-300 p-3 bg-slate-50 disabled:opacity-50 focus:ring-2 focus:ring-eco-500 focus:bg-white outline-hidden text-slate-900"
                />
              </div>
            </div>

          </div>

          {/* Pricing Explanation banner */}
          {priceExplanation && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-eco-700 shrink-0 mt-0.5" />
              <span><strong className="text-slate-900">Valuation Basis: </strong>{priceExplanation}</span>
            </div>
          )}

          {/* Free Donation Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-eco-50/60 border border-eco-200/80">
            <input
              type="checkbox"
              id="isFreeCheck"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 text-eco-600 rounded border-slate-300 focus:ring-eco-500"
            />
            <label htmlFor="isFreeCheck" className="text-xs font-bold text-eco-900 cursor-pointer">
              {t('upload.mark_free')}
            </label>
          </div>

          {/* RAG Reuse Guidance Card */}
          {reuseRecommendation && (
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>{t('upload.reuse_recommendation_title')}</span>
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {reuseRecommendation}
              </p>
              {reuseSources.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800">
                  <span className="font-bold">{t('upload.cited_sources')} </span>
                  {reuseSources.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Publish Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={publishing}
              className="px-8 py-3.5 rounded-2xl text-sm font-black bg-eco-700 hover:bg-eco-800 text-white shadow-lg shadow-eco-700/25 flex items-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              <span>{publishing ? t('upload.publishing') : t('upload.publish_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
