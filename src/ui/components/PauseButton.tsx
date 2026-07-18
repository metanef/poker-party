import React from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { Pause, Play } from 'lucide-react';
import { useLanguageStore } from '@/i18n/languageStore';

interface PauseButtonProps {
  paused: boolean;
  isHost: boolean;
  className?: string;
}

export function PauseButton({ paused, className = '' }: PauseButtonProps) {
  const handleToggle = () => {
    getTransport().sendPause(!paused).catch(console.error);
  };
  const language = useLanguageStore((s) => s.language);

  const tooltipText = paused
    ? (language === 'en' ? 'Resume game' : 'Reprendre la partie')
    : (language === 'en' ? 'Pause game' : 'Mettre en pause');

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-table-panel border border-table-border text-gray-300 hover:text-white hover:bg-table-border transition-colors cursor-pointer ${className}`}
      title={tooltipText}
    >
      {paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
    </button>
  );
}
