import React from 'react';
import { HandResult } from '@/engine/model/Table';
import { Player } from '@/engine/model/Player';
import { Trophy, AlertTriangle, ArrowRight, RefreshCw, Check, Clock } from 'lucide-react';
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
  onToggleReady: () => void;
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
  onToggleReady,
}: HandResultBannerProps) {
  const isWinner = result.winnerIds.includes(localPlayerId);
  const isLoser = result.loserIds.includes(localPlayerId);
  
  const host = players.find(p => p.isHost);
  const hostId = host?.id || '';
  const localPlayer = players.find(p => p.id === localPlayerId);
  const isReady = localPlayer?.ready ?? false;

  const otherActivePlayers = players.filter(p => p.id !== hostId && p.active);
  const readyOtherCount = otherActivePlayers.filter(p => p.ready).length;
  const allOthersReady = otherActivePlayers.every(p => p.ready);
  
  const localHandLabel = result.handLabels[localPlayerId];

  // Helper to get pseudo from ID
  const getName = (id: string) => players.find(p => p.id === id)?.pseudo || 'Inconnu';
  
  const winnerNames = result.winnerIds.map(getName).join(', ');
  const loserNames = result.loserIds.map(getName).join(', ');

  const canBuyback = localPlayerPoints >= buybackCost && localPlayerClothingRemaining < startingClothing;

  return (
    <div className="w-full max-w-sm my-auto mx-auto bg-table-panel border border-table-border rounded-panel p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
      {/* Top Banner (Action for local player) */}
      <div className="flex flex-col items-center w-full">
        {isLoser ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full flex flex-col items-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
            <h3 className="font-title font-semibold text-red-400 text-lg">Vous avez perdu !</h3>
            <p className="text-sm text-red-300 mt-1">Retirez un vêtement.</p>
          </div>
        ) : result.winnerIds.includes(localPlayerId) ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 w-full flex flex-col items-center">
            <Trophy className="w-8 h-8 text-amber-400 mb-2" />
            <h3 className="font-title font-semibold text-amber-400 text-lg">Vous avez gagné !</h3>
            <p className="text-sm text-amber-300 mt-1">+1 point</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Trophy className="w-8 h-8 text-rank-gold mb-2" />
            <h3 className="font-title font-semibold text-white text-lg">
              {result.tiedForWin ? 'Égalité pour la gagne !' : `Gagnant : ${winnerNames}`}
            </h3>
            <p className="text-sm text-gray-400">
              +1 point
            </p>
          </div>
        )}
      </div>
      

      <div className="w-full h-px bg-table-border" />

      {/* Révélation des mains Section */}
      <div className="w-full flex flex-col gap-3 text-left">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
          🔍 Révélation des mains
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
      <div 
        className={`w-full bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-2 ${
          localPlayerClothingRemaining >= startingClothing ? 'invisible pointer-events-none' : ''
        }`}
      >
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
          🛍️ Marché de rachat
        </h4>
        <p className="text-[10px] text-gray-400">
          Récupérer 1 vêtement.
        </p>
        
        {localPlayerPoints < buybackCost ? (
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

      {/* Ready Status Section */}
      <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span>Prêts pour la suite :</span>
          <span>{readyOtherCount} / {otherActivePlayers.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {players.filter(p => p.active).map(p => {
            const isPlayerHost = p.id === hostId;
            return (
              <span 
                key={p.id}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                  isPlayerHost 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : p.ready
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                }`}
              >
                {p.pseudo}
                {isPlayerHost ? (
                  <span className="text-[8px]">👑</span>
                ) : p.ready ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Clock className="w-3 h-3 text-gray-500 animate-pulse" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="w-full flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={onNextHand}
            disabled={!allOthersReady}
            className={`w-full font-title font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              allOthersReady
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white active:scale-95 hover:shadow-emerald-500/25 cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
            }`}
          >
            {allOthersReady ? 'Lancer la manche suivante' : 'En attente des autres joueurs...'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={onToggleReady}
              className={`w-full font-title font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 border cursor-pointer ${
                isReady 
                  ? 'bg-green-600 hover:bg-green-500 border-green-500/20 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 text-white'
              }`}
            >
              {isReady ? '✓ Prêt pour la suite' : 'Se marquer comme Prêt'}
            </button>
            <div className="text-[10px] text-gray-500 italic py-1 text-center animate-pulse">
              En attente de l'hôte pour lancer la manche...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
