import React from 'react';
import { HandResult } from '@/engine/model/Table';
import { Player } from '@/engine/model/Player';
import { Trophy, AlertTriangle } from 'lucide-react';

interface HandResultBannerProps {
  result: HandResult;
  players: Player[];
  localPlayerId: string;
}

export function HandResultBanner({ result, players, localPlayerId }: HandResultBannerProps) {
  const isWinner = result.winnerIds.includes(localPlayerId);
  const isLoser = result.loserIds.includes(localPlayerId);
  
  const localHandLabel = result.handLabels[localPlayerId];

  // Helper to get pseudo from ID
  const getName = (id: string) => players.find(p => p.id === id)?.pseudo || 'Inconnu';
  
  const winnerNames = result.winnerIds.map(getName).join(', ');
  const loserNames = result.loserIds.map(getName).join(', ');

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
      <div className="flex flex-col items-center">
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
    </div>
  );
}
