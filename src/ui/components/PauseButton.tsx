import React from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { Pause, Play } from 'lucide-react';

interface PauseButtonProps {
  paused: boolean;
  isHost: boolean;
  className?: string;
}

export function PauseButton({ paused, className = '' }: PauseButtonProps) {
  const handleToggle = () => {
    getTransport().sendPause(!paused).catch(console.error);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-table-panel border border-table-border text-gray-300 hover:text-white hover:bg-table-border transition-colors ${className}`}
      title={paused ? 'Reprendre la partie' : 'Mettre en pause'}
    >
      {paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
    </button>
  );
}
