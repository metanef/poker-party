import React, { useState } from 'react';
import { Player } from '@/engine/model/Player';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { PlayerSeat } from '@/ui/components/PlayerSeat';
import { Copy, Check, Play, LogOut, Info, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface WaitingRoomPageProps {
  code: string;
  players: Player[];
  hostId: string;
  localPlayerId: string;
  maxPlayers: number;
}

export default function WaitingRoomPage({ code, players, hostId, localPlayerId, maxPlayers }: WaitingRoomPageProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  
  const localPlayer = players.find(p => p.id === localPlayerId);
  const isHost = hostId === localPlayerId;
  const isReady = localPlayer?.ready ?? false;
  
  const canStart = isHost && players.length >= 2 && players.every(p => p.ready);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/table/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleReady = () => {
    getTransport().sendReady(!isReady).catch(console.error);
  };

  const startGame = () => {
    if (!canStart) return;
    getTransport().startGame().catch(console.error);
  };

  const leaveTable = () => {
    getTransport().leaveTable().then(() => {
      setLocation('/');
    });
  };

  return (
    <div className="min-h-[100dvh] bg-table-bg flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-table-panel border border-table-border rounded-[40px] p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-10">
        
        {/* Decorative glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-felt-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left Col: Info & Actions */}
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h1 className="font-title text-3xl font-bold text-white mb-2">Salle d'attente</h1>
            <p className="text-gray-400 text-sm">En attente des autres joueurs...</p>
          </div>
          
          <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-8">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Code de la table
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 font-mono text-3xl tracking-[0.2em] font-bold text-white">
                {code}
              </div>
              <button 
                onClick={handleCopyLink}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors group relative"
                title="Copier le lien"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300 group-hover:text-white" />}
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs mt-2 font-medium">Lien copié dans le presse-papiers !</p>}
          </div>

          <div className="mt-auto space-y-4">
            <button
              onClick={toggleReady}
              className={`w-full py-4 rounded-full font-title font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${
                isReady 
                  ? 'bg-table-bg border-2 border-felt-accent text-felt-accent hover:bg-felt-accent/10' 
                  : 'bg-white text-table-bg hover:bg-gray-100 active:scale-[0.98]'
              }`}
            >
              {isReady ? (
                <><Check className="w-5 h-5" /> Prêt !</>
              ) : (
                'Je suis prêt'
              )}
            </button>
            
            {isHost && (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="w-full py-4 rounded-full font-title font-bold text-lg bg-felt-accent text-table-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-felt-accent/20 flex justify-center items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Démarrer la partie
              </button>
            )}

            {!isHost && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4" />
                L'hôte démarrera la partie quand tout le monde sera prêt.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Players List */}
        <div className="w-full md:w-64 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-title font-semibold text-gray-300">Joueurs</h3>
            <span className="text-sm font-medium text-gray-500">{players.length} / {maxPlayers}</span>
          </div>
          
          <div className="bg-black/20 rounded-3xl p-4 flex-1 border border-white/5 space-y-2 overflow-y-auto">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-table-panel flex items-center justify-center text-xl">
                    {p.avatar}
                  </div>
                  {p.ready && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">
                    {p.pseudo} {p.id === localPlayerId && <span className="text-gray-500 text-xs">(Vous)</span>}
                  </span>
                  <span className={`text-xs ${p.ready ? 'text-green-400' : 'text-gray-500'}`}>
                    {p.ready ? 'Prêt' : 'En attente'}
                  </span>
                </div>
                {p.isHost && (
                  <div className="ml-auto text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                    HÔTE
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty slots placeholders */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 p-2 rounded-2xl bg-transparent border border-dashed border-white/10 opacity-50">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center" />
                <span className="text-sm text-gray-500 italic">Place libre...</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex flex-col items-center gap-3">
            {isHost && (
              <button
                onClick={() => {
                  if (window.confirm("Supprimer definitivement cette table ? Les autres joueurs seront deconnectes.")) {
                    getTransport().deleteTable().then(() => {
                      setLocation('/');
                    }).catch(console.error);
                  }
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer la table
              </button>
            )}
            <button
              onClick={leaveTable}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Quitter la table
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
