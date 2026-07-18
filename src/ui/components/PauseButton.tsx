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
    if (!isHost) return; // Only host can pause/unpause
    getTransport().sendPause(!paused).catch(console.error);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!isHost}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-table-panel border border-table-border text-gray-300 hover:text-white transition-colors ${
        !isHost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-table-border'
      } ${className}`}
      title={isHost ? (paused ? 'Reprendre la partie' : 'Mettre en pause') : (paused ? 'En pause (Hôte requis)' : 'Mettre en pause (Hôte requis)')}
    >
      {paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
    </button>
  );
}
