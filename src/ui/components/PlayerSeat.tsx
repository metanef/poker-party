import React, { useState, useEffect } from 'react';
import { Player } from '@/engine/model/Player';
import { useTableStore } from '@/store/tableStore';
import { PlayingCard } from './PlayingCard';
import { Check } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  isLocal?: boolean;
  isActiveTurn?: boolean; // True during exchange stages if they haven't acted
  className?: string;
  isWaiting?: boolean; // True in lobby
}

export function PlayerSeat({ player, isLocal, isActiveTurn, isWaiting, className = '' }: PlayerSeatProps) {
  const emotes = useTableStore(s => s.emotes);
  const activeEmotes = emotes.filter(e => e.playerId === player.id);
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);

  useEffect(() => {
    if (activeEmotes.length > 0) {
      // Pick the most recent emote
      const latest = activeEmotes[activeEmotes.length - 1];
      setCurrentEmote(latest.emoji);
      
      const timer = setTimeout(() => {
        setCurrentEmote(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeEmotes]);

  const hasActed = player.hasActedThisRound;
  const needsToAct = isActiveTurn && !hasActed && player.active;

  return (
    <div className={`relative flex flex-col items-center ${!player.active ? 'opacity-40' : !player.connected ? 'opacity-70' : ''} ${className}`}>
      
      {/* Emote Bubble */}
      {currentEmote && (
        <div className="absolute -top-12 z-50 animate-float-up text-4xl pointer-events-none drop-shadow-md">
          {currentEmote}
        </div>
      )}

      {/* Cards - Only show backs for other players if not showdown, local player cards are handled in ExchangeConsole / TableView */}
      {!isLocal && player.active && !isWaiting && (
        <div
          className={
            player.holeCards && player.holeCards.length > 0
              ? "flex -space-x-3 mb-2 scale-110 sm:scale-125 origin-bottom opacity-100 z-30 transition-all duration-300"
              : "flex -space-x-2.5 mb-2 scale-85 sm:scale-100 origin-bottom opacity-90 z-20 transition-all duration-300"
          }
        >
           {player.holeCards && player.holeCards.length > 0 ? (
             player.holeCards.map((c, i) => (
               <PlayingCard key={i} card={c} size="md" className="shadow-lg" />
             ))
           ) : (
             // Render 2 face down cards as a placeholder before showdown
             Array.from({ length: 2 }).map((_, i) => (
               <PlayingCard key={i} size="sm" className="shadow-lg" />
             ))
           )}
        </div>
      )}

      {/* Avatar Container */}
      <div className="relative">
        <div 
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl bg-table-panel border-2 shadow-lg transition-all ${
            needsToAct ? 'border-felt-accent shadow-[0_0_15px_rgba(61,217,196,0.5)]' : 'border-table-border'
          } ${isLocal ? 'border-gray-400' : ''}`}
        >
          {player.avatar}
        </div>

        {/* Offline Badge */}
        {!player.connected && (
          <div 
            className="absolute -top-1 -left-1 bg-rose-600 text-white rounded-full px-1.5 py-0.5 shadow-md border border-rose-500 flex items-center justify-center pointer-events-none" 
            title="Déconnecté (IA temporaire)"
          >
            <span className="text-[7px] font-bold uppercase tracking-wider scale-90">OFF</span>
          </div>
        )}
        
        {/* Ready Badge (Lobby) or Acted Badge (Game) */}
        {isWaiting && player.ready && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 shadow">
            <Check className="w-3 h-3" />
          </div>
        )}
        {!isWaiting && hasActed && isActiveTurn && (
          <div className="absolute -bottom-1 -right-1 bg-felt-accent text-table-bg rounded-full p-1 shadow">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Name and Stats */}
      <div className="mt-1 sm:mt-2 text-center flex flex-col items-center max-w-[80px] sm:max-w-none">
        <span className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1 truncate w-full justify-center">
          {player.pseudo}
          {player.isHost && <span className="text-[8px] sm:text-[10px] bg-white/10 px-1 sm:px-1.5 py-0.5 rounded text-gray-400 uppercase">Hôte</span>}
        </span>
        
        {!isWaiting && player.active && (
          <div className="flex flex-col items-center gap-0.5 mt-0.5 sm:mt-1">
            <span className="text-[10px] sm:text-xs font-semibold text-rank-gold">
              {player.points} pt{player.points > 1 ? 's' : ''}
            </span>
            <span className="text-[8px] sm:text-[10px] text-gray-400 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
              👕 {player.clothingRemaining} restant{player.clothingRemaining > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {!player.active && !isWaiting && (
          <span className="text-[10px] sm:text-xs text-red-400 mt-1 italic">Éliminé</span>
        )}
      </div>
    </div>
  );
}
