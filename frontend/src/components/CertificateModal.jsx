import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Award, Printer, X, CheckCircle, ShieldCheck, Leaf, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CertificateModal({
  isOpen,
  onClose,
  userName = 'Eco Champion',
  listingTitle = 'Salvaged Construction Material',
  kgDiverted = 840,
  co2Saved = 126,
  moneySaved = 1800,
  completedDate = null,
  certId = 'PUN-2026-AP-0842'
}) {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open & manage focus
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus modal container for keyboard users
      modalRef.current?.focus();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Fire eco celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#4ade80', '#86efac', '#eab308']
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = completedDate
    ? new Date(completedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 outline-hidden"
      >
        
        {/* Modal Action Bar (Hidden in print) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Award className="w-4 h-4 text-eco-600" />
            <span>Punarva Circular Materials Registry Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-eco-600 hover:bg-eco-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('certificate.print_btn')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              {t('certificate.close_btn', 'Close')}
            </button>
            <button
              onClick={onClose}
              aria-label="Close certificate modal"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Area */}
        <div id="printable-certificate" className="p-8 sm:p-12 text-center bg-radial from-eco-50/50 via-white to-white relative">
          
          {/* Certificate Decorative Border */}
          <div className="border-4 border-double border-eco-700/60 rounded-2xl p-6 sm:p-8 relative">
            
            {/* Watermark Leaf Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Leaf className="w-80 h-80 text-eco-900" />
            </div>

            {/* Top Seal & Heading */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-eco-700 text-white flex items-center justify-center shadow-lg shadow-eco-700/30 mb-3">
                <Leaf className="w-8 h-8 text-eco-200" />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-eco-800">
                Official Circular Economy Verification
              </p>
              
              {/* EXACT BRANDING TITLE SPECIFICATION */}
              <h1 id="certificate-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 mb-1">
                Certificate of Reuse, issued by Punarva
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {t('certificate.subtitle')}
              </p>
            </div>

            {/* Recipient Line */}
            <div className="my-6">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                {t('certificate.presented_to')}
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-eco-900 underline decoration-eco-400 decoration-2 underline-offset-4 mt-1">
                {userName}
              </h2>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                {t('certificate.for_diverting')}
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1 italic">
                Material: "{listingTitle}"
              </p>
            </div>

            {/* Certified Impact Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 my-6 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-eco-50 border border-eco-200 text-center">
                <p className="text-lg sm:text-2xl font-black text-eco-800">{kgDiverted} kg</p>
                <p className="text-[10px] sm:text-xs font-semibold text-eco-700 uppercase tracking-wider">{t('certificate.metric_diverted')}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-lg sm:text-2xl font-black text-blue-800">{co2Saved} kg</p>
                <p className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wider">{t('certificate.metric_co2')}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-lg sm:text-2xl font-black text-amber-800">₹{moneySaved}</p>
                <p className="text-[10px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider">{t('certificate.metric_savings')}</p>
              </div>
            </div>

            {/* Footer with Seal & Signatures */}
            <div className="pt-6 border-t border-slate-200/80 flex items-end justify-between text-left">
              <div>
                <p className="text-[11px] text-slate-400">Date Issued:</p>
                <p className="text-xs font-bold text-slate-800">{formattedDate}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Cert ID: {certId}</p>
              </div>

              {/* Gold Certified Seal */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-100 flex items-center justify-center text-amber-800 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mt-1">Verified</span>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-slate-400">{t('certificate.issued_by')}</p>
                <p className="text-xs font-bold text-eco-800">Punarva Platform</p>
                <p className="text-[10px] text-slate-400">Bapatla & Guntur Hub</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
