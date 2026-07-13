import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useTableStore } from '@/store/tableStore';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { ConsentModal } from '@/ui/components/ConsentModal';
import WaitingRoomPage from './WaitingRoomPage';
import { PlayerSeat } from '@/ui/components/PlayerSeat';
import { ExchangeConsole } from '@/ui/components/ExchangeConsole';
import { TurnTimer } from '@/ui/components/TurnTimer';
import { EmotePicker } from '@/ui/components/EmotePicker';
import { PauseButton } from '@/ui/components/PauseButton';
import { HandResultBanner } from '@/ui/components/HandResultBanner';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { LogOut, Home, UserPlus, AlertCircle } from 'lucide-react';

export default function TablePage() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const transport = getTransport();
  
  const table = useTableStore(s => s.table);
  const privateHand = useTableStore(s => s.privateHand);
  
  // Local state for join form when arriving directly via URL
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [avatar, setAvatar] = useState('👻');
  const [isJoining, setIsJoining] = useState(false);

  const [announcementHand, setAnnouncementHand] = useState<number | null>(null);
  const [showRoundAnnounce, setShowRoundAnnounce] = useState(false);

  // Check if we need to show the join form
  useEffect(() => {
    // Give it a tiny delay to see if transport connects and gets state
    const timer = setTimeout(() => {
      if (!table || !table.players.some(p => p.id === transport.localPlayerId)) {
        setNeedsToJoin(true);
      } else {
        setNeedsToJoin(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [table, transport.localPlayerId]);

  // Round start announcement effect
  useEffect(() => {
    if (table && table.stage !== 'lobby' && table.handNumber > 0) {
      if (announcementHand !== table.handNumber) {
        setAnnouncementHand(table.handNumber);
        setShowRoundAnnounce(true);
        const timer = setTimeout(() => {
          setShowRoundAnnounce(false);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [table?.handNumber, announcementHand]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim() || !code) return;
    setIsJoining(true);
    try {
      await transport.joinTable({ code, pseudo, avatar });
      setNeedsToJoin(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  // 1. Loading state
  if (!table && !needsToJoin) {
    return (
      <div className="min-h-[100dvh] bg-table-bg flex items-center justify-center">
        <div className="text-felt-accent animate-pulse font-title">Connexion à la table...</div>
      </div>
    );
  }

  // 2. Not joined yet (arrived via direct link)
  if (needsToJoin) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="bg-white rounded-panel p-8 shadow-xl max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="font-title text-2xl font-bold text-center mb-2">Rejoindre la table</h1>
          <p className="text-center text-gray-500 mb-6 font-mono bg-gray-100 py-1 rounded inline-block w-full">Code : {code}</p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo</label>
              <input 
                type="text" value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Votre pseudo" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
              <div className="flex justify-between">
                {['👻','🤠','👽','🤖','🤡'].map(em => (
                  <button type="button" key={em} onClick={() => setAvatar(em)}
                    className={`text-2xl w-12 h-12 rounded-full ${avatar === em ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isJoining || !pseudo}
              className="w-full bg-gray-900 text-white font-title font-semibold rounded-xl py-3 mt-4 hover:bg-gray-800 disabled:opacity-50"
            >
              {isJoining ? 'Connexion...' : 'Rejoindre'}
            </button>
            <button type="button" onClick={() => setLocation('/')}
              className="w-full text-sm text-gray-500 py-2 hover:text-gray-900 flex justify-center items-center gap-1"
            >
              <Home className="w-4 h-4" /> Retour à l'accueil
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ensure table exists for following views
  if (!table) return null;

  const localPlayer = table.players.find(p => p.id === transport.localPlayerId);
  if (!localPlayer) return null; // Should not happen after join

  // 3. Consent check
  if (!localPlayer.consentGiven) {
    return <ConsentModal onConsented={() => {}} />; // Modal handles transport call
  }

  // 4. Lobby stage
  if (table.stage === 'lobby') {
    return (
      <WaitingRoomPage 
        code={table.code}
        players={table.players}
        hostId={table.hostId}
        localPlayerId={transport.localPlayerId}
        maxPlayers={table.maxPlayers}
      />
    );
  }

  // 5. Game Over
  if (table.gameOverMessage) {
    return (
      <div className="min-h-[100dvh] bg-table-bg flex items-center justify-center p-4">
        <div className="bg-table-panel border border-table-border rounded-panel p-8 max-w-md w-full text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-title text-2xl font-bold text-white mb-4">Partie Terminée</h2>
          <p className="text-gray-300 mb-8">{table.gameOverMessage}</p>
          <button 
            onClick={() => { transport.leaveTable(); setLocation('/'); }}
            className="bg-white text-table-bg font-title font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition-colors"
          >
            Retour au lobby
          </button>
        </div>
      </div>
    );
  }

  // 6. Active Game View
  const isExchange = ['exchange1', 'exchange2', 'exchange3'].includes(table.stage);
  const isShowdown = table.stage === 'showdown';
  const opponents = table.players.filter(p => p.id !== transport.localPlayerId);
  const localCards = privateHand?.holeCards || [];

  return (
    <div className="min-h-[100dvh] bg-table-bg text-white overflow-hidden flex flex-col relative select-none">
      
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 z-20 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="font-mono text-sm tracking-widest text-gray-500 bg-black/40 px-3 py-1 rounded-md">
            {table.code}
          </div>
          <div className="text-sm font-medium text-gray-400 capitalize">
            {table.stage}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <PauseButton paused={table.paused} isHost={table.hostId === transport.localPlayerId} />
          <button 
            onClick={() => { if(confirm('Quitter la partie ?')) { transport.leaveTable(); setLocation('/'); } }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-table-panel border border-table-border text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
            title="Quitter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {/* Felt / Table Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] max-w-4xl border-2 border-white/5 rounded-full bg-white/[0.02] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />

        {/* Opponents Layout (Top half circle) */}
        <div className="w-full max-w-3xl flex justify-around items-end absolute top-12 z-10">
          {opponents.map((p) => (
            <PlayerSeat 
              key={p.id} 
              player={p} 
              isActiveTurn={isExchange} 
            />
          ))}
        </div>

        {/* Center Table Area (Community Cards & Pot/Timer) */}
        <div className="relative z-10 flex flex-col items-center gap-8 mt-12">
          {/* Community Cards */}
          <div className="flex items-center gap-2 h-36">
            {table.communityCards.map((card, i) => (
              <PlayingCard key={i} card={card} size="md" className="shadow-2xl" />
            ))}
            {/* Empty slots for visual structure during dealing/flop */}
            {Array.from({ length: 5 - table.communityCards.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-16 h-24 rounded-card border-2 border-dashed border-white/10" />
            ))}
          </div>

          {/* Center Info / Timer */}
          <div className="h-16 flex items-center justify-center">
            {isExchange && table.exchangeDeadline ? (
              <TurnTimer deadline={table.exchangeDeadline} />
            ) : table.paused ? (
              <div className="text-gray-500 flex items-center gap-2 font-title animate-pulse">
                <PauseButton paused={true} isHost={false} className="w-8 h-8 pointer-events-none" />
                En pause
              </div>
            ) : (
              <div className="text-gray-600 font-title text-sm uppercase tracking-widest">
                Manche {table.handNumber}
              </div>
            )}
          </div>
        </div>

        {/* Showdown Result Overlay */}
        {isShowdown && table.lastHandResult && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <HandResultBanner 
              result={table.lastHandResult} 
              players={table.players} 
              localPlayerId={transport.localPlayerId} 
              isHost={table.hostId === transport.localPlayerId}
              onNextHand={() => transport.startNextHand().catch(console.error)}
              localPlayerPoints={localPlayer.points}
              localPlayerClothingRemaining={localPlayer.clothingRemaining}
              startingClothing={table.startingClothing}
              onRestoreClothing={() => transport.sendRestoreClothing().catch(console.error)}
            />
          </div>
        )}

      </div>

      {/* Local Player Area (Bottom) */}
      <div className="w-full flex flex-col items-center pb-6 pt-4 bg-gradient-to-t from-black/80 to-transparent z-20 relative">
        
        {/* Emotes */}
        <div className="absolute -top-14 left-4 z-30">
          <EmotePicker />
        </div>

        {/* Local Player Info */}
        <div className="absolute right-6 bottom-6 flex items-end gap-4 z-30">
           <div className="text-right flex flex-col items-end gap-1">
             <span className="text-white font-medium text-sm">{localPlayer.pseudo}</span>
             <span className="text-rank-gold font-bold text-lg">{localPlayer.points} pts</span>
             <span className="text-xs text-gray-400">👕 {localPlayer.clothingRemaining} restant{localPlayer.clothingRemaining > 1 ? 's' : ''}</span>
             {localPlayer.points >= 3 && (
               <button
                 onClick={() => transport.sendRestoreClothing().catch(console.error)}
                 className="text-xs bg-felt-accent text-table-bg font-title font-semibold px-3 py-1.5 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap"
                 title="Remettre un vêtement et repartir de 0 point"
               >
                 Récupérer un vêtement
               </button>
             )}
           </div>
           <div className="w-14 h-14 rounded-full bg-table-panel border-2 border-gray-600 flex items-center justify-center text-2xl shadow-lg">
             {localPlayer.avatar}
           </div>
        </div>

        {/* Exchange Console or Static Cards */}
        {localPlayer.active ? (
          isExchange && !isShowdown ? (
             <ExchangeConsole 
               cards={localCards} 
               isExchangeActive={isExchange && !table.paused}
               hasActed={localPlayer.hasActedThisRound}
             />
          ) : (
             <div className="flex justify-center items-end h-48 space-x-2 md:space-x-4 mb-6">
               {localCards.map((card, idx) => (
                 <PlayingCard key={idx} card={card} size="lg" />
               ))}
               {localCards.length === 0 && Array.from({length: 5}).map((_, i) => (
                  <PlayingCard key={i} size="lg" className="opacity-50" />
               ))}
             </div>
          )
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 font-title italic mb-6">
            Vous avez passé ce tour
          </div>
        )}

      </div>

      {/* Pause Overlay (Blocks interactions if paused and not showdown) */}
      {table.paused && !isShowdown && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
           <div className="bg-table-panel p-6 rounded-panel border border-table-border text-center shadow-2xl">
             <h2 className="font-title text-xl text-white mb-2">Jeu en pause</h2>
             <p className="text-gray-400 text-sm">
               {table.hostId === transport.localPlayerId 
                 ? "Cliquez sur le bouton play en haut pour reprendre."
                 : "En attente de l'hôte pour reprendre la partie."}
             </p>
           </div>
        </div>
      )}

      {/* Round Announcement Overlay */}
      {showRoundAnnounce && table && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none animate-backdrop">
          <div className="bg-gradient-to-r from-felt-accent/10 via-black/85 to-felt-accent/10 border-y border-felt-accent/20 w-full py-8 text-center shadow-2xl backdrop-blur-md transform animate-banner">
            <span className="text-felt-accent font-mono tracking-widest text-xs uppercase block mb-1">
              🃏 Distribution des cartes en cours
            </span>
            <h2 className="font-title text-3xl md:text-5xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_10px_rgba(61,217,196,0.3)]">
              Début de la Manche {table.handNumber}
            </h2>
          </div>
        </div>
      )}

    </div>
  );
}
