import React from 'react';
import { HandResult } from '@/engine/model/Table';
import { Player } from '@/engine/model/Player';
import { Trophy, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { PlayingCard } from './PlayingCard';

interface HandResultBannerProps {
  result: HandResult;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  onNextHand: () => void;
  localPlayerPoints: number;
  localPlayerClothingRemaining: number;
  startingClothing: number;
  buybackCost: number;
  onRestoreClothing: () => void;
}

export function HandResultBanner({
  result,
  players,
  localPlayerId,
  isHost,
  onNextHand,
  localPlayerPoints,
  localPlayerClothingRemaining,
  startingClothing,
  buybackCost,
  onRestoreClothing,
}: HandResultBannerProps) {
  const isWinner = result.winnerIds.includes(localPlayerId);
  const isLoser = result.loserIds.includes(localPlayerId);
  
  const localHandLabel = result.handLabels[localPlayerId];

  // Helper to get pseudo from ID
  const getName = (id: string) => players.find(p => p.id === id)?.pseudo || 'Inconnu';
  
  const winnerNames = result.winnerIds.map(getName).join(', ');
  const loserNames = result.loserIds.map(getName).join(', ');

  const canBuyback = localPlayerPoints >= buybackCost && localPlayerClothingRemaining < startingClothing;

  return (
    <div className="w-full max-w-sm mx-auto bg-table-panel border border-table-border rounded-panel p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
      {/* Winner Section */}
      <div className="flex flex-col items-center">
        <Trophy className="w-8 h-8 text-rank-gold mb-2" />
        <h3 className="font-title font-semibold text-white text-lg">
          {result.tiedForWin ? 'Égalité pour la gagne !' : `Gagnant : ${winnerNames}`}
        </h3>
        <p className="text-sm text-gray-400">
          {result.winnerIds.includes(localPlayerId) && localHandLabel 
            ? `Avec ${localHandLabel} (+1 point)` 
            : '+1 point'}
        </p>
      </div>
      
      <div className="w-full h-px bg-table-border" />
      
      {/* Loser Section */}
      <div className="flex flex-col items-center w-full">
        {isLoser ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
            <h4 className="font-bold text-red-400">Vous avez perdu.</h4>
            <p className="text-sm text-red-300 mt-1">Retirez un vêtement.</p>
            {localHandLabel && <p className="text-xs text-red-300/70 mt-2">Votre main : {localHandLabel}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400">
              {result.tiedForLoss ? 'Égalité pour la perte :' : 'Perdant :'}
            </p>
            <p className="font-semibold text-white">{loserNames}</p>
            <p className="text-xs text-gray-500 mt-1">Retire un vêtement</p>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-table-border" />

      {/* Révélation des mains Section */}
      <div className="w-full flex flex-col gap-3 text-left">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
          🔍 Révélation des mains
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {Object.entries(result.handLabels).map(([playerId, handLabel]) => {
            const player = players.find(p => p.id === playerId);
            if (!player) return null;
            
            const isLocal = playerId === localPlayerId;
            const hasWon = result.winnerIds.includes(playerId);
            const hasLost = result.loserIds.includes(playerId);
            
            return (
              <div 
                key={playerId} 
                className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                  isLocal 
                    ? 'bg-felt-accent/10 border-felt-accent/30' 
                    : 'bg-black/20 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{player.avatar}</span>
                    <span className={`text-xs font-semibold ${isLocal ? 'text-felt-accent' : 'text-white'} truncate max-w-[120px]`}>
                      {player.pseudo} {isLocal && '(Vous)'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {hasWon && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">
                        Gagne (+1)
                      </span>
                    )}
                    {hasLost && (
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20 font-bold uppercase tracking-wider">
                        Perd (-1 👕)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cards */}
                  <div className="flex -space-x-2.5">
                    {player.holeCards && player.holeCards.map((c, i) => (
                      <PlayingCard key={i} card={c} size="sm" className="shadow-md cursor-default pointer-events-none" />
                    ))}
                  </div>
                  {/* Hand description */}
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Main</span>
                    <span className="text-xs font-bold text-gray-200">{handLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-table-border" />

      {/* Marché de rachat Section */}
      <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-2">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
          🛍️ Marché de rachat
        </h4>
        <p className="text-[10px] text-gray-400">
          Échangez {buybackCost} points de victoire pour récupérer 1 vêtement perdu.
        </p>
        
        {localPlayerClothingRemaining >= startingClothing ? (
          <div className="text-[10px] text-gray-500 italic py-1">
            Garde-robe déjà complète (max)
          </div>
        ) : localPlayerPoints < buybackCost ? (
          <button
            disabled
            className="w-full bg-white/5 text-gray-400 border border-white/10 font-title text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
          >
            Points insuffisants ({localPlayerPoints}/{buybackCost} pts)
          </button>
        ) : (
          <button
            onClick={onRestoreClothing}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-table-bg font-title font-bold text-xs py-2 px-3 rounded-lg transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 hover:shadow-amber-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Racheter 1 vêtement (-{buybackCost} pts)
          </button>
        )}
      </div>

      {/* Actions Section */}
      <div className="w-full flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={onNextHand}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-title font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:shadow-emerald-500/25"
          >
            Lancer la manche suivante
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-sm text-gray-500 italic py-2 text-center animate-pulse">
            En attente de l'hôte pour la manche suivante...
          </div>
        )}
      </div>
    </div>
  );
}
