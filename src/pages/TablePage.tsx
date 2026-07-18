import React, { useState, useEffect, useRef } from 'react';
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
import { HandResultBanner, BurningClothingAnimation } from '@/ui/components/HandResultBanner';
import { PlayingCard } from '@/ui/components/PlayingCard';
import { SidebarChat } from '@/ui/components/SidebarChat';
import { LogOut, Home, UserPlus, AlertCircle, MessageSquare, Trophy, RefreshCw, Crown } from 'lucide-react';

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
  const [isCheckingReconnect, setIsCheckingReconnect] = useState(true);
  const [hasJoinedSession, setHasJoinedSession] = useState(() => {
    return transport.getCurrentTableCode() === code;
  });

  const lastAnnouncedHand = useRef<number | null>(null);
  const [showRoundAnnounce, setShowRoundAnnounce] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastLogsCountRef = useRef(0);

  // Monitor unread logs
  useEffect(() => {
    if (!table || !table.logs) return;
    
    if (isSidebarOpen) {
      setUnreadCount(0);
    } else {
      const prevCount = lastLogsCountRef.current;
      const newLogs = table.logs.slice(prevCount);
      if (newLogs.length > 0) {
        // Count only chat messages from other players
        const unreadChatCount = newLogs.filter(
          log => log.type !== 'system' && log.playerId !== transport.localPlayerId
        ).length;
        
        if (unreadChatCount > 0) {
          setUnreadCount((prev) => prev + unreadChatCount);
        }
      }
    }
    lastLogsCountRef.current = table.logs.length;
  }, [table?.logs, isSidebarOpen, transport.localPlayerId]);

  // Auto-reconnect if already in table
  useEffect(() => {
    if (!code) {
      setIsCheckingReconnect(false);
      return;
    }

    if (transport.getCurrentTableCode() === code) {
      setHasJoinedSession(true);
      setNeedsToJoin(false);
      setIsCheckingReconnect(false);
      return;
    }
    
    let isMounted = true;
    const tryReconnect = async () => {
      try {
        const success = await transport.tryAutoReconnect(code);
        if (success && isMounted) {
          setHasJoinedSession(true);
          setNeedsToJoin(false);
        } else if (isMounted) {
          setNeedsToJoin(true);
        }
      } catch (err) {
        console.error("Auto-reconnection failed:", err);
        if (isMounted) setNeedsToJoin(true);
      } finally {
        if (isMounted) {
          setIsCheckingReconnect(false);
        }
      }
    };
    
    tryReconnect();
    
    return () => {
      isMounted = false;
    };
  }, [code, transport]);

  // Check if we need to show the join form
  useEffect(() => {
    if (isCheckingReconnect || hasJoinedSession) return;
    
    const timer = setTimeout(() => {
      if (!table || !table.players.some(p => p.id === transport.localPlayerId)) {
        setNeedsToJoin(true);
      } else {
        setNeedsToJoin(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [table, transport.localPlayerId, isCheckingReconnect, hasJoinedSession]);

  // Round start announcement effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (table && table.stage !== 'lobby' && table.handNumber > 0) {
      if (lastAnnouncedHand.current !== table.handNumber) {
        lastAnnouncedHand.current = table.handNumber;
        setShowRoundAnnounce(true);
        timer = setTimeout(() => {
          setShowRoundAnnounce(false);
        }, 2200);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [table?.handNumber]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim() || !code) return;
    setIsJoining(true);
    try {
      await transport.joinTable({ code, pseudo, avatar });
      setHasJoinedSession(true);
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
        <div className="text-felt-accent animate-pulse font-title">
          {isCheckingReconnect ? 'Reconnexion en cours...' : 'Connexion à la table...'}
        </div>
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
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-teal-500 outline-none"
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
        startingClothing={table.startingClothing}
        buybackCost={table.buybackCost ?? 3}
      />
    );
  }

  // 5. Game Over
  if (table.gameOverMessage) {
    const isHost = table.hostId === transport.localPlayerId;
    const sortedPlayers = [...table.players].sort((a, b) => b.points - a.points);
    const nakedPlayers = table.players.filter((p) => p.clothingRemaining === 0);
    const localNaked = nakedPlayers.some((p) => p.id === transport.localPlayerId);

    return (
      <div className="min-h-[100dvh] bg-table-bg flex items-center justify-center p-4 relative overflow-y-auto">
        <div className="bg-table-panel border border-table-border rounded-panel p-6 max-w-lg w-full text-center shadow-2xl flex flex-col gap-6 my-auto animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center">
            {localNaked ? (
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
                <BurningClothingAnimation className="scale-125" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
            )}
            <h2 className="font-title text-3xl font-extrabold text-white tracking-tight">
              Partie Terminée
            </h2>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">
              Classement Final
            </p>
          </div>

          {/* Naked Announcement */}
          {nakedPlayers.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-sm text-red-400 font-medium leading-relaxed">
                {localNaked ? (
                  "🔞 Vous finissez COMPLÈTEMENT NU !"
                ) : (
                  <>
                    🔞 <span className="font-bold">{nakedPlayers.map(p => p.pseudo).join(', ')}</span>{' '}
                    {nakedPlayers.length > 1 ? " finissent COMPLÈTEMENT NUS !" : "finit COMPLÈTEMENT NU !"}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Scoreboard List */}
          <div className="space-y-2 text-left">
            {sortedPlayers.map((player, index) => {
              const isNaked = player.clothingRemaining === 0;
              const isPlayerLocal = player.id === transport.localPlayerId;
              const isPlayerHost = player.id === table.hostId;

              // Placement symbols
              let rankSymbol = `${index + 1}e`;
              let rankColor = 'text-gray-400';
              if (index === 0) {
                rankSymbol = '🥇';
                rankColor = 'text-amber-400';
              } else if (index === 1) {
                rankSymbol = '🥈';
                rankColor = 'text-slate-300';
              } else if (index === 2) {
                rankSymbol = '🥉';
                rankColor = 'text-amber-600';
              }

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isPlayerLocal
                      ? 'bg-felt-accent/15 border-felt-accent/35 shadow-inner'
                      : 'bg-black/20 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-6 text-center ${rankColor}`}>
                      {rankSymbol}
                    </span>
                    <span className="text-xl">{player.avatar}</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold flex items-center gap-1.5 ${isPlayerLocal ? 'text-felt-accent' : 'text-white'}`}>
                        {player.pseudo} {isPlayerLocal && '(Vous)'}
                        {isPlayerHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {isNaked ? '🔞 Éliminé (Nu)' : `👕 ${player.clothingRemaining} vêtements restants`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      {player.points} {player.points > 1 ? 'manches' : 'manche'}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium font-title">
                      gagnée{player.points > 1 && 's'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => {
                transport.leaveTable().catch(console.error);
                setLocation('/');
              }}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-title font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Quitter la partie
            </button>

            {isHost ? (
              <button
                onClick={() => {
                  transport.restartGame().catch(console.error);
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-table-bg font-title font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Relancer une partie
              </button>
            ) : (
              <div className="flex-1 bg-white/5 border border-dashed border-white/10 text-gray-400 text-xs py-3 px-6 rounded-xl flex items-center justify-center">
                En attente de l'hôte pour relancer...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Active Game View
  const isExchange = ['echange1', 'echange2', 'echange3'].includes(table.stage);
  const isShowdown = table.stage === 'showdown';
  const opponents = table.players.filter(p => p.id !== transport.localPlayerId);
  const localCards = privateHand?.holeCards || [];

  return (
    <div className="min-h-[100dvh] bg-table-bg text-white overflow-hidden flex flex-row relative select-none animate-fadeIn">
      
      {/* Game Table (Left Side) */}
      <div className="flex-1 flex flex-col h-[100dvh] relative overflow-y-auto scrollbar-hide">
        
        {/* Top Bar */}
        <div className="pt-safe-game bg-black/20 border-b border-white/5 z-[60] flex-shrink-0">
          <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="font-mono text-sm tracking-widest text-gray-500 bg-black/40 px-3 py-1 rounded-md">
              {table.code}
            </div>
            <div className="text-sm font-medium text-gray-400 capitalize">
              {table.stage}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-table-panel border border-table-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors relative active:scale-95 duration-200"
              title="Chat & Historique"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border border-slate-950 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <PauseButton paused={table.paused} isHost={table.hostId === transport.localPlayerId} />
            <button 
              onClick={() => { if(confirm('Quitter la partie ?')) { transport.leaveTable(); setLocation('/'); } }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-table-panel border border-table-border text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors active:scale-95 duration-200"
              title="Quitter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          </div>
        </div>

      {/* Main Game Area */}
      <div className="flex-1 min-h-[400px] relative flex flex-col items-center justify-between p-4">
        
        {/* Felt / Table Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[35vh] sm:w-[80vw] sm:h-[60vh] max-w-4xl border-2 border-white/5 rounded-full bg-white/[0.02] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />

        {/* Opponents Layout (Top half circle) */}
        <div className="w-full max-w-3xl flex justify-around items-end mt-2 sm:mt-6 px-2 sm:px-0 z-10">
          {opponents.map((p) => (
            <PlayerSeat 
              key={p.id} 
              player={p} 
              isActiveTurn={isExchange} 
            />
          ))}
        </div>

        {/* Center Table Area (Community Cards & Pot/Timer) */}
        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-8 my-auto scale-90 sm:scale-100">
          {/* Community Cards */}
          <div className="flex items-center gap-1.5 sm:gap-2 h-28 sm:h-36">
            {table.communityCards.map((card, i) => (
              <PlayingCard key={i} card={card} size="md" className="shadow-2xl" />
            ))}
            {/* Empty slots for visual structure during dealing/flop */}
            {Array.from({ length: 5 - table.communityCards.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-18 sm:w-16 sm:h-24 rounded-card border-2 border-dashed border-white/10" />
            ))}
          </div>

          {/* Center Info / Timer */}
          <div className="h-16 flex items-center justify-center">
            {isExchange && table.exchangeDeadline ? (
              <TurnTimer deadline={table.exchangeDeadline} paused={table.paused} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 pt-20 overflow-y-auto">
            <HandResultBanner 
              result={table.lastHandResult} 
              players={table.players} 
              localPlayerId={transport.localPlayerId} 
              isHost={table.hostId === transport.localPlayerId}
              onNextHand={() => transport.startNextHand().catch(console.error)}
              localPlayerPoints={localPlayer.points}
              localPlayerClothingRemaining={localPlayer.clothingRemaining}
              startingClothing={table.startingClothing}
              buybackCost={table.buybackCost ?? 3}
              onRestoreClothing={() => transport.sendRestoreClothing().catch(console.error)}
              onToggleReady={() => transport.sendReady(!localPlayer.ready).catch(console.error)}
            />
          </div>
        )}

      </div>

      {/* Local Player Area (Bottom) */}
      <div className="w-full flex-shrink-0 flex flex-col items-center pb-safe-game pt-4 bg-gradient-to-t from-black/80 to-transparent z-20 relative">
        
        {/* Emotes */}
        <div className="absolute -top-14 left-4 z-30">
          <EmotePicker />
        </div>

        {/* Local Player Info */}
        <div className="absolute right-4 bottom-4 md:right-6 md:bottom-6 flex items-end gap-2 md:gap-4 z-30 scale-90 sm:scale-100 origin-bottom-right">
           <div className="text-right flex flex-col items-end gap-0.5 md:gap-1">
             <span className="text-white font-medium text-xs md:text-sm">{localPlayer.pseudo}</span>
             <span className="text-rank-gold font-bold text-sm md:text-lg">{localPlayer.points} pts</span>
             <span className="text-[10px] md:text-xs text-gray-400">👕 {localPlayer.clothingRemaining} restant{localPlayer.clothingRemaining > 1 ? 's' : ''}</span>
             {localPlayer.points >= (table.buybackCost ?? 3) && (
               <button
                 onClick={() => transport.sendRestoreClothing().catch(console.error)}
                 className="text-[10px] md:text-xs bg-felt-accent text-table-bg font-title font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap"
                 title={`Remettre un vêtement (coût : ${table.buybackCost ?? 3} pts)`}
               >
                 Récupérer un vêtement
               </button>
             )}
           </div>
           <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-table-panel border-2 border-gray-600 flex items-center justify-center text-xl md:text-2xl shadow-lg">
             {localPlayer.avatar}
           </div>
        </div>

        {/* Exchange Console or Static Cards */}
        {localPlayer.active ? (
           <ExchangeConsole 
             cards={localCards} 
             isExchangeActive={isExchange && !table.paused && !isShowdown}
             hasActed={localPlayer.hasActedThisRound}
           />
        ) : (
          <div className="h-32 sm:h-48 flex items-center justify-center text-gray-500 font-title italic mb-4 sm:mb-6">
            Vous avez passé ce tour
          </div>
        )}

      </div>

      {/* Pause Overlay (Blocks interactions if paused and not showdown) */}
      {table.paused && !isShowdown && (
        <div className="absolute inset-0 z-[50] bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
           <div className="bg-table-panel p-6 rounded-panel border border-table-border text-center shadow-2xl flex flex-col items-center">
             <h2 className="font-title text-xl text-white mb-2">Jeu en pause</h2>
             <p className="text-gray-400 text-sm mb-4">
               {table.hostId === transport.localPlayerId 
                 ? "La partie est suspendue."
                 : "En attente de l'hôte pour reprendre la partie."}
             </p>
             {table.hostId === transport.localPlayerId && (
               <button
                 onClick={() => transport.sendPause(false).catch(console.error)}
                 className="bg-felt-accent text-table-bg font-title font-semibold px-6 py-2.5 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
               >
                 Reprendre la partie
               </button>
             )}
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

      {/* Sidebar Chat (Right Side) */}
      {isSidebarOpen && (
        <div className="w-full md:w-80 h-[100dvh] absolute md:relative right-0 top-0 z-[70] transition-all duration-300">
          <SidebarChat 
            logs={table.logs || []}
            localPlayerId={transport.localPlayerId}
            hostId={table.hostId}
            onSendMessage={(msg) => transport.sendChatMessage(msg)}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

    </div>
  );
}
