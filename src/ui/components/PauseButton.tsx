import React from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { Pause, Play } from 'lucide-react';

interface PauseButtonProps {
  paused: boolean;
  isHost: boolean;
  className?: string;
}

export function PauseButton({ paused, isHost, className = '' }: PauseButtonProps) {
  const handleToggle = () => {
    if (paused && !isHost) return; // Only host can unpause
    getTransport().sendPause(!paused).catch(console.error);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={paused && !isHost}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-table-panel border border-table-border text-gray-300 hover:text-white transition-colors ${
        paused && !isHost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-table-border'
      } ${className}`}
      title={paused ? (isHost ? 'Reprendre la partie' : 'En pause (Hôte requis)') : 'Mettre en pause'}
    >
      {paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
    </button>
  );
}
