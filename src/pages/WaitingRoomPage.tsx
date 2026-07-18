import React, { useState } from 'react';
import { Player } from '@/engine/model/Player';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { Copy, Check, Play, LogOut, Info, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguageStore, t } from '@/i18n/languageStore';

interface WaitingRoomPageProps {
  code: string;
  players: Player[];
  hostId: string;
  localPlayerId: string;
  maxPlayers: number;
  startingClothing: number;
  buybackCost: number;
}

export default function WaitingRoomPage({
  code,
  players,
  hostId,
  localPlayerId,
  maxPlayers,
  startingClothing,
  buybackCost,
}: WaitingRoomPageProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  
  const localPlayer = players.find(p => p.id === localPlayerId);
  const isHost = hostId === localPlayerId;
  const isReady = localPlayer?.ready ?? false;
  
  const language = useLanguageStore((s) => s.language);

  const canStart = isHost && players.length >= 2 && players.every(p => p.isHost || p.ready);

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
            <h1 className="font-title text-3xl font-bold text-white mb-2">{t('waiting_room_title')}</h1>
            <p className="text-gray-400 text-sm">{t('waiting_players_status')}</p>
          </div>
          
          <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              {t('table_code_label')}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 font-mono text-3xl tracking-[0.2em] font-bold text-white">
                {code}
              </div>
              <button 
                onClick={handleCopyLink}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors group relative cursor-pointer"
                title={t('copy_link_btn')}
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300 group-hover:text-white" />}
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs mt-2 font-medium">{t('link_copied_msg')}</p>}
          </div>

          {/* Configuration / Paramètres Section */}
          {isHost ? (
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 flex flex-col gap-3">
              <label className="text-xs font-semibold text-felt-accent uppercase tracking-wider block">
                ⚙️ {t('table_settings_title')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">{t('max_players_label')}</label>
                  <select 
                    value={maxPlayers}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value);
                      getTransport().updateTableSettings({ maxPlayers: nextMax, startingClothing, buybackCost }).catch(console.error);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-felt-accent cursor-pointer"
                  >
                    {[2, 3, 4].filter(n => n >= players.length).map(n => (
                      <option key={n} value={n} className="bg-table-panel text-white">{n} {t('players_suffix')}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">{t('starting_clothing_label')}</label>
                  <select 
                    value={startingClothing}
                    onChange={(e) => {
                      const nextClothing = Number(e.target.value);
                      getTransport().updateTableSettings({ maxPlayers, startingClothing: nextClothing, buybackCost }).catch(console.error);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-felt-accent cursor-pointer"
                  >
                    {[3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n} className="bg-table-panel text-white">{n} 👕</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">{t('buyback_cost_label')}</label>
                  <select 
                    value={buybackCost}
                    onChange={(e) => {
                      const nextCost = Number(e.target.value);
                      getTransport().updateTableSettings({ maxPlayers, startingClothing, buybackCost: nextCost }).catch(console.error);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-felt-accent cursor-pointer"
                  >
                    {[2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-table-panel text-white">{n} pts</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                {t('table_settings_title')}
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="block text-[10px] text-gray-400 font-semibold uppercase">{t('max_players_label')}</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{maxPlayers} max</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="block text-[10px] text-gray-400 font-semibold uppercase">{t('starting_clothing_label')}</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{startingClothing} 👕</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="block text-[10px] text-gray-400 font-semibold uppercase">{t('buyback_cost_label')}</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{buybackCost} pts</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            {!isHost && (
              <button
                onClick={toggleReady}
                className={`w-full py-4 rounded-full font-title font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer ${
                  isReady 
                    ? 'bg-table-bg border-2 border-felt-accent text-felt-accent hover:bg-felt-accent/10' 
                    : 'bg-white text-table-bg hover:bg-gray-100 active:scale-[0.98]'
                }`}
              >
                {isReady ? (
                  <><Check className="w-5 h-5" /> {t('ready_to_play_banner')}</>
                ) : (
                  language === 'en' ? 'I am Ready' : 'Je suis prêt'
                )}
              </button>
            )}
            
            {isHost && (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="w-full py-4 rounded-full font-title font-bold text-lg bg-felt-accent text-table-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-felt-accent/20 flex justify-center items-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                {t('start_game_btn')}
              </button>
            )}

            {!isHost && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4" />
                {t('waiting_host_launch')}
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Players List */}
        <div className="w-full md:w-64 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-title font-semibold text-gray-300">{t('connected_players_title')}</h3>
            <span className="text-sm font-medium text-gray-500">{players.length} / {maxPlayers}</span>
          </div>
          
          <div className="bg-black/20 rounded-3xl p-4 flex-1 border border-white/5 space-y-2 overflow-y-auto">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-table-panel flex items-center justify-center text-xl">
                    {p.avatar}
                  </div>
                  {(p.isHost || p.ready) && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">
                    {p.pseudo} {p.id === localPlayerId && <span className="text-gray-500 text-xs">{t('you_suffix')}</span>}
                  </span>
                  <span className={`text-xs ${p.isHost || p.ready ? 'text-green-400' : 'text-gray-500'}`}>
                    {p.isHost ? (language === 'en' ? 'Host' : 'Organisateur') : (p.ready ? t('ready_label') : (language === 'en' ? 'Waiting' : 'En attente'))}
                  </span>
                </div>
                {p.isHost && (
                  <div className="ml-auto text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded uppercase">
                    {language === 'en' ? 'Host' : 'Hôte'}
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty slots placeholders */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 p-2 rounded-2xl bg-transparent border border-dashed border-white/10 opacity-50">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center" />
                <span className="text-sm text-gray-500 italic">
                  {language === 'en' ? 'Empty slot...' : 'Place libre...'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex flex-col items-center gap-3">
            {isHost && (
              <button
                onClick={() => {
                  const confirmMsg = language === 'en' 
                    ? "Permanently delete this table? Other players will be disconnected." 
                    : "Supprimer definitivement cette table ? Les autres joueurs seront deconnectes.";
                  if (window.confirm(confirmMsg)) {
                    getTransport().deleteTable().then(() => {
                      setLocation('/');
                    }).catch(console.error);
                  }
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'en' ? 'Delete Table' : 'Supprimer la table'}
              </button>
            )}
            <button
              onClick={leaveTable}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t('leave_table_btn')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
