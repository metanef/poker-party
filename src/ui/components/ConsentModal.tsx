import React, { useState } from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { t } from '@/i18n/languageStore';

interface ConsentModalProps {
  onConsented: () => void;
}

export function ConsentModal({ onConsented }: ConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConsent = async () => {
    if (!isChecked) return;
    setIsSubmitting(true);
    try {
      await getTransport().sendConsent();
      onConsented();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleLeave = () => {
    getTransport().leaveTable().then(() => {
      window.location.href = '/';
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-table-panel border border-table-border rounded-panel max-w-md w-full p-8 shadow-2xl flex flex-col my-auto">
        
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6 mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <h2 className="font-title text-2xl font-bold text-white text-center mb-4">
          {t('consent_warning_title')}
        </h2>
        
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed mb-8">
          <p>
            {t('consent_body_1')}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{t('consent_item_1')}</li>
            <li>{t('consent_item_2')}</li>
            <li>{t('consent_item_3')}</li>
          </ul>
        </div>
        
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-black/40 rounded-xl border border-white/5 mb-8 hover:bg-black/60 transition-colors">
          <div className="pt-0.5">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded bg-table-bg border-table-border text-felt-accent focus:ring-felt-accent focus:ring-offset-table-panel"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
          </div>
          <span className="text-sm font-medium text-white">
            {t('consent_checkbox')}
          </span>
        </label>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConsent}
            disabled={!isChecked || isSubmitting}
            className={`w-full py-3.5 rounded-full font-title font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isChecked 
                ? 'bg-felt-accent text-table-bg hover:brightness-110 active:scale-[0.98] shadow-lg shadow-felt-accent/20' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {isSubmitting ? t('consent_accept_submitting') : t('consent_accept_btn')}
          </button>
          
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-full font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t('consent_decline_btn')}
          </button>
        </div>
        
      </div>
    </div>
  );
}
